/**
 * Markdown Renderer - Local API Server
 * Session-based: each render gets its own unique ID and isolated content.
 *
 * IIS hosting: HttpPlatformHandler sets process.env.PORT automatically.
 * Local dev:   Falls back to port 3000.
 */

const http   = require('http');
const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;

// ── Session store ─────────────────────────────────────────────────────────────
// Map of id -> { markdown, timestamp, lastAccessed }
// Sessions expire after TTL_MS of inactivity to prevent unbounded memory growth.
const sessions  = new Map();
const TTL_MS    = 2 * 60 * 60 * 1000; // 2 hours
const GC_MS     = 15 * 60 * 1000;      // run GC every 15 min

function gcSessions() {
  const cutoff = Date.now() - TTL_MS;
  for (const [id, session] of sessions) {
    if (session.lastAccessed < cutoff) {
      sessions.delete(id);
    }
  }
}
setInterval(gcSessions, GC_MS).unref();

function createSession(markdown) {
  const id = crypto.randomBytes(16).toString('hex');
  sessions.set(id, { markdown, timestamp: Date.now(), lastAccessed: Date.now() });
  return id;
}

function getSession(id) {
  const session = sessions.get(id);
  if (!session) return null;
  session.lastAccessed = Date.now(); // refresh TTL on access
  return session;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.json': 'application/json; charset=utf-8'
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function serveStatic(res, filePath) {
  const ext  = path.extname(filePath).toLowerCase();
  const mime = MIME_TYPES[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, data) => {
    if (err) return sendJson(res, 404, { error: 'File not found' });
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ── Server ────────────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const url      = new URL(req.url, `http://${req.headers.host || `localhost:${PORT}`}`);
  const pathname = decodeURIComponent(url.pathname);

  // ── POST /api/render ─────────────────────────────────────────────────────
  // Body: { "markdown": "..." }
  // Returns a unique session id and a ready-to-open viewUrl.
  if (req.method === 'POST' && pathname === '/api/render') {
    try {
      const body = await parseBody(req);
      if (typeof body.markdown !== 'string') {
        return sendJson(res, 400, { error: 'Missing "markdown" field in request body' });
      }
      const id = createSession(body.markdown);
      return sendJson(res, 200, {
        success:   true,
        id,
        viewUrl:   `/view?id=${id}`,
        timestamp: sessions.get(id).timestamp
      });
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }

  // ── GET /api/content?id=xxx ───────────────────────────────────────────────
  // Returns the markdown for a specific session (polled by the WebView).
  if (req.method === 'GET' && pathname === '/api/content') {
    const id      = url.searchParams.get('id');
    const session = id && getSession(id);
    if (!session) {
      return sendJson(res, 404, { error: 'Session not found or expired' });
    }
    return sendJson(res, 200, { id, markdown: session.markdown, timestamp: session.timestamp });
  }

  // ── GET /view?id=xxx ──────────────────────────────────────────────────────
  // Serves the viewer page; the page reads ?id from its own URL.
  if (req.method === 'GET' && pathname === '/view') {
    return serveStatic(res, path.join(__dirname, 'index.html'));
  }

  // ── Static files ──────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const relativePath    = pathname.replace(/^\/+/, '');
    const normalizedPath  = path.normalize(relativePath);
    if (normalizedPath.includes('..')) {
      return sendJson(res, 403, { error: 'Forbidden' });
    }
    const filePath = path.join(__dirname, normalizedPath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return serveStatic(res, filePath);
    }
  }

  return sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
