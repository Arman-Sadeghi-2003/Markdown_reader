/**
 * Markdown Renderer - Local API Server
 * Accepts mermaid/markdown content and serves the rendered WebView.
 *
 * IIS hosting: HttpPlatformHandler sets process.env.PORT automatically.
 * Local dev: Falls back to port 3000.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

let currentContent = {
  markdown: '',
  timestamp: null
};

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.json': 'application/json; charset=utf-8'
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function serveStatic(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      return sendJson(res, 404, { error: 'File not found' });
    }

    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });

    req.on('error', reject);
  });
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host || `localhost:${PORT}`}`);
  const pathname = decodeURIComponent(url.pathname);

  if (req.method === 'POST' && pathname === '/api/render') {
    try {
      const body = await parseBody(req);

      if (typeof body.markdown !== 'string') {
        return sendJson(res, 400, { error: 'Missing "markdown" field in request body' });
      }

      currentContent = {
        markdown: body.markdown,
        timestamp: Date.now()
      };

      return sendJson(res, 200, {
        success: true,
        viewUrl: '/view',
        timestamp: currentContent.timestamp
      });
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }

  if (req.method === 'GET' && pathname === '/api/content') {
    return sendJson(res, 200, currentContent);
  }

  if (req.method === 'GET' && pathname === '/view') {
    return serveStatic(res, path.join(__dirname, 'index.html'));
  }

  if (req.method === 'GET') {
    const relativePath = pathname.replace(/^\/+/, '');
    const normalizedPath = path.normalize(relativePath);

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