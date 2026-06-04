# Markdown Renderer — API Guide

A session-based markdown rendering API that converts Markdown and Mermaid diagrams into a live WebView, served locally via IIS or Node.js.

---

## 🚀 Hosting

### IIS (Recommended)

**Prerequisites — install once on the machine:**
- [Node.js](https://nodejs.org) — adds `node.exe` to PATH
- [HttpPlatformHandler v1.2](https://www.iis.net/downloads/microsoft/httpplatformhandler)

**Deploy:**
1. Drop the project folder into your IIS site's physical path (e.g. `C:\inetpub\wwwroot\markdown-renderer\`)
2. Open IIS Manager → **Sites → Add Website**, point to that folder
3. IIS reads `web.config` and starts Node automatically — no manual process needed

**Verify it's running:**
- Open `http://your-server/view?id=test` — you'll see the WebView shell
- Check `logs/node.log` if something is wrong

**If HttpPlatformHandler can't find Node**, open `web.config` and set the full path:
```xml
<httpPlatform processPath="C:\Program Files\nodejs\node.exe" ...>
```
Run `where node` in cmd to get the exact path on your machine.

**If you get a 500.19 error**, run in an admin cmd then `iisreset`:
```cmd
%windir%\system32\inetsrv\appcmd.exe unlock config -section:system.webServer/handlers
```

### Local Development (Node only)
```bash
node server.js
# Server runs at http://localhost:3000
```

---

## 📡 API Reference

Base URL: `http://your-server` (IIS) or `http://localhost:3000` (local)

---

### POST `/api/render`

Submit markdown content. Returns a unique session ID and a ready-to-open WebView URL.

**Request**
```http
POST /api/render
Content-Type: application/json

{
  "markdown": "# Hello\n\nYour **markdown** here."
}
```

**Response `200 OK`**
```json
{
  "success": true,
  "id": "a3f9c2d1e4b87f60...",
  "viewUrl": "/view?id=a3f9c2d1e4b87f60...",
  "timestamp": 1717430400000
}
```

**Response `400 Bad Request`**
```json
{
  "error": "Missing \"markdown\" field in request body"
}
```

---

### GET `/api/content?id={id}`

Fetch the stored markdown for a session. Used internally by the WebView to poll for content — you don't need to call this directly.

**Request**
```http
GET /api/markdown/content?id=a3f9c2d1e4b87f60...
```

**Response `200 OK`**
```json
{
  "id": "a3f9c2d1e4b87f60...",
  "markdown": "# Hello\n\nYour **markdown** here.",
  "timestamp": 1717430400000
}
```

**Response `404 Not Found`**
```json
{
  "error": "Session not found or expired"
}
```

---

### GET `/view?id={id}`

Opens the rendered WebView for a session. Load this URL in a WebView control or browser — it auto-polls and renders the content.

```
/view?id=a3f9c2d1e4b87f60...
```

---

## 🔄 Full Flow

```
Your App
   │
   │  POST /api/render  { "markdown": "..." }
   ▼
 Server ──── creates session ────► returns { id, viewUrl }
   │
   │  Open viewUrl in WebView
   ▼
WebView  ──── polls GET /api/content?id=xxx every 1.5s ────► renders output
```

Each `POST /api/render` creates a completely isolated session — you can have multiple WebViews open on the same page and they will never interfere with each other.

---

## 📋 Quick Examples

**cURL**
```bash
curl -X POST http://localhost:3000/api/render \
  -H "Content-Type: application/json" \
  -d '{"markdown": "# Hello\n```mermaid\ngraph TD\n  A-->B\n```"}'
```

**JavaScript (fetch)**
```js
const res  = await fetch('/api/render', {
  method:  'POST',
  headers: { 'Content-Type': 'application/json' },
  body:    JSON.stringify({ markdown: '# Hello\n\n**world**' })
});
const { viewUrl } = await res.json();

// Open in WebView2
webView.CoreWebView2.Navigate('http://localhost:3000' + viewUrl);
```

**Bruno / Postman**
```
Method:  POST
URL:     http://localhost:3000/api/render
Body:    JSON
```
```json
{
  "markdown": "# Test\n\nSome **bold** and _italic_ text.\n\n```mermaid\ngraph TD\n  A[Start] --> B[End]\n```"
}
```
Copy the `viewUrl` from the response and open it in a browser to see the result.

---

## ⚙️ Session Behavior

| Property | Value |
|---|---|
| Session TTL | 2 hours from last access |
| GC interval | Every 15 minutes |
| Poll interval | 1.5 seconds (WebView side) |
| Storage | In-memory (resets on server restart) |
| Isolation | Each session is fully independent |

Sessions are refreshed on every `/api/content` poll, so an active WebView keeps its session alive automatically.

---

## 📁 Project Structure

```
/
├── index.html                  # WebView page (auto-renders from session)
├── server.js                   # API server (Node.js, zero dependencies)
├── web.config                  # IIS HttpPlatformHandler configuration
├── styles/
│   ├── variables.css           # Design tokens (luxury light palette)
│   ├── base.css                # Typography and base elements
│   ├── components.css          # Component styles
│   └── rtl.css                 # RTL language overrides
├── js/
│   ├── config.js               # Marked + Mermaid configuration
│   ├── rtl-detection.js        # RTL language detection
│   ├── ui-controls.js          # Direction toggle, copy buttons
│   ├── markdown-renderer.js    # Core render logic (renderOutput)
│   └── pdf-export.js           # PDF download
└── logs/
    └── node.log                # IIS stdout log (auto-created)
```

---

## 🌐 WebView Features

Once the WebView is open at `/view?id=...`:

| Feature | Details |
|---|---|
| Markdown | Full GitHub Flavored Markdown (GFM) |
| Diagrams | Mermaid flowcharts, sequences, Gantt, etc. |
| Code blocks | Syntax display + one-click copy |
| Direction | LTR / RTL / Auto-detect toggle |
| PDF export | Download rendered output as PDF |
| Live update | Re-POSTing the same `id` updates the view within 1.5s |

---

## 🌍 Browser & WebView Support

| Client | Support |
|---|---|
| Chrome / Edge (latest) | ✅ |
| Firefox (latest) | ✅ |
| Safari (latest) | ✅ |
| Microsoft WebView2 | ✅ |
