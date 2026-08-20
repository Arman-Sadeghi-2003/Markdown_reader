# Markdown Reader — Project Overview

A Windows desktop application that renders Markdown files in a styled, offline-first
viewer with first-class RTL (Persian/Arabic/Hebrew) support, Mermaid diagrams, and
PDF export.

- **Solution**: `MarkdownReader.slnx` → `MarkdownReader/MarkdownReader.csproj`
- **Stack**: .NET 10 (`net10.0-windows`), WPF, WebView2
- **Version**: 1.3.1.0 (`AssemblyVersion` in the csproj)
- **Current branch**: `desktop` (other branches: `main`, `API`, `local`)

## Architecture

The app is a thin WPF shell hosting a WebView2 control. All rendering, styling and
export logic lives in a bundled static web app; the C# side only handles the window
chrome, file I/O, and OS integration.

```
WPF shell (C#)                         WebView2 content (HTML/CSS/JS)
────────────────                       ─────────────────────────────
App.xaml.cs        ── startup ──────►  https://app.local/viewer.html
MainWindow.xaml.cs ── OpenFile() ───►  window.__renderMarkdown(json)
                                        └─► renderOutput() → marked → DOM
                                                           → mermaid.run()
                                                           → PDF export
```

The `Web/` folder is copied to the output directory (`PreserveNewest`) and mapped to
the virtual host **`app.local`** via
`SetVirtualHostNameToFolderMapping`, so the page loads over `https://` without a
server. Default context menus and DevTools are disabled. WebView2 user data lives in
`%APPDATA%\MarkdownReader`.

## C# components

| File | Responsibility |
|---|---|
| [App.xaml.cs](MarkdownReader/App.xaml.cs) | Startup; registers the `.md` association on a background task; opens the file passed as `args[0]` once the WebView signals `WebViewReady`. |
| [MainWindow.xaml](MarkdownReader/MainWindow.xaml) | Title bar (file name + full path + **Open File** button), the WebView2 host, and a drag-over overlay. Bronze/ivory palette matching the web theme. |
| [MainWindow.xaml.cs](MarkdownReader/MainWindow.xaml.cs) | WebView2 bootstrap, `OpenFile(path)`, drag & drop handling, `OpenFileDialog`. Markdown is JSON-serialized and pushed in with `ExecuteScriptAsync`. |
| [FileAssociation.cs](MarkdownReader/FileAssociation.cs) | Writes the `MarkdownReader.md` ProgID under `HKCU\SOFTWARE\Classes`, maps `.md` to it, and calls `SHChangeNotify`. Failures are swallowed — the association is a convenience, not a requirement. |

Three ways to open a document: double-click a `.md` file in Explorer, drag & drop onto
the window, or the **Open File** dialog. Only `.md` is accepted.

## Web layer (`MarkdownReader/Web/`)

### Entry point
[viewer.html](MarkdownReader/Web/viewer.html) — toolbar (PDF button, LTR/RTL/Auto
direction toggles, language indicator), a scrollable `#output` pane capped at 860px,
and an empty state. It defines `window.__renderMarkdown(markdown)`, which stuffs the
text into a hidden `#inputArea` textarea and calls `renderOutput()` — the same code
path the original browser version used.

### JavaScript modules

| Module | Role |
|---|---|
| `js/config.js` | Configures `marked` (GFM, `breaks: true`) and Mermaid. `applyMermaidThemeFromCSS()` reads CSS custom properties so diagrams follow the page palette. |
| `js/markdown-renderer.js` | `renderOutput()`: parse Markdown, sanitize via `sanitizeMarkup()` (DOMPurify, fails closed), wrap tables in `.table-wrap` for horizontal scroll, convert `language-mermaid` code blocks into zoom/pan wrappers, run Mermaid, attach copy buttons, fade in. |
| `js/rtl-detection.js` | Character-class regexes per script; `detectTextDirection()` flips to RTL only when RTL chars outnumber LTR chars **and** exceed 10, avoiding flips on short tokens. `getDetectedLanguage()` names the script family. |
| `js/ui-controls.js` | Direction state (`currentDirection`, `autoDetectEnabled`), `setDirection()`, clipboard copy buttons with `execCommand` fallback, and a theme switcher (`aurora`/`midnight`/`ocean`/`forest`/`sunset`) persisted to `localStorage`. |
| `js/mermaid-controls.js` | Per-diagram transform state; zoom (0.35×–3×), 50px pan steps, reset, press-and-hold repeat on the control buttons, and mouse dragging of the viewport. |
| `js/pdf-export.js` | `downloadAsPDF()` — walks `#output` element by element and composes an A4 PDF with jsPDF. |
| `js/main.js` | Init/keyboard wiring from the original browser build. **Not referenced by `viewer.html`.** |

### Styles
`styles/variables.css` defines the "Luxury Light" palette — warm ivory background
(`#F7F2EA`) with a bronze accent (`#9C7A53`) — as CSS custom properties consumed by
`base.css`, `components.css` and `rtl.css`.

### Bundled libraries
`marked.min.js`, `mermaid.min.js`, `purify.min.js` (DOMPurify 3.1.6), Font Awesome
(CSS + webfonts), and the **Vazir** Persian font family are all vendored under
`Web/libs/` and `Web/fonts/`, so normal viewing needs no network.

### Security posture
Markdown files are untrusted input. Parser output is sanitized with DOMPurify before
it reaches `innerHTML`, and `viewer.html` declares a Content-Security-Policy
(`default-src 'none'`, script limited to `'self'`, `'unsafe-inline'` for the inline
toolbar handlers, and cdnjs for the PDF libraries).

## PDF export

`downloadAsPDF()` builds the PDF programmatically rather than screenshotting the page:

1. Loads jsPDF and html2canvas, then base64-encodes `fonts/Vazir.ttf` via XHR and
   registers it with jsPDF so Persian text renders (falls back to Helvetica).
2. Creates an A4 portrait document, 15mm margins, with a `checkPageBreak()` helper.
3. Dispatches per element type: headings h1–h6 with per-level sizes, paragraphs,
   ordered/unordered lists, blockquotes with a rule, tables laid out cell by cell with
   measured row heights and zebra striping, `<img>` tags, and — for `<pre>` code blocks
   and Mermaid/SVG diagrams — an html2canvas raster pasted in as PNG.
4. Saves as `markdown-export-YYYY-MM-DD.pdf`.

Interactive chrome (copy buttons, diagram controls) is stripped before capture.

## Repository layout

```
/
├── MarkdownReader.slnx           # solution
├── MarkdownReader/
│   ├── App.xaml(.cs)             # WPF application
│   ├── MainWindow.xaml(.cs)      # shell window + WebView2 host
│   ├── FileAssociation.cs        # .md ProgID registration
│   ├── Assets/                   # app icon
│   └── Web/                      # copied to output, served from app.local
│       ├── viewer.html
│       ├── js/  styles/  fonts/  libs/
├── README.md                     # project readme
├── markdown_test.md              # sample document for manual testing
└── docs/
    ├── project-overview.md       # this file
    ├── PDF_FEATURE_GUIDE.md      # PDF export internals
    └── issue-bug.md              # known issues and bugs
```

## Build & run

```bash
dotnet build MarkdownReader/MarkdownReader.csproj
```

Requires the .NET 10 SDK (Windows) and the WebView2 runtime; the only NuGet dependency
is `Microsoft.Web.WebView2` (1.0.4015-prerelease).

## Known gaps

Worth knowing before touching this code — these are observations from reading the
current tree, not open tickets:

- **The theme switcher is dead code in the desktop build.** `ui-controls.js` defines
  five themes and toggles `data-theme` on `<html>`, but no stylesheet defines
  `[data-theme]` rules and `viewer.html` contains no `#themeButton`/`#themeDropdown`.
  `initThemeSwitcher()` is only called from `main.js`, which the viewer does not load.
- **PDF export is not fully offline.** `loadPDFLibraries()` pulls jsPDF and
  html2canvas from cdnjs at click time, so export fails without a network connection
  even though every other asset is vendored.
- **Editing is not part of the desktop app** — it is a read-only viewer; the
  `#inputArea` textarea survives only as the plumbing `renderOutput()` reads from.
