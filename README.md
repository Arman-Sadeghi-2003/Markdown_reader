# Markdown Reader

A Windows desktop app that opens `.md` files in a styled, offline viewer — with
first-class RTL support (Persian, Arabic, Hebrew), Mermaid diagrams, and PDF export.

- **Stack:** .NET 10 (`net10.0-windows`), WPF, WebView2
- **Version:** 1.3.1.0
- **Solution:** `MarkdownReader.slnx`

## How it works

The app is a thin WPF shell hosting a WebView2 control. C# owns the window, file I/O,
and Windows integration; all rendering and styling lives in a bundled static web app
under `MarkdownReader/Web/`.

```
WPF shell (C#)                         WebView2 content (HTML/CSS/JS)
────────────────                       ─────────────────────────────
App.xaml.cs        ── startup ──────►  https://app.local/viewer.html
MainWindow.xaml.cs ── OpenFile() ───►  window.__renderMarkdown(json)
                                        └─► renderOutput() → marked → DOM
                                                           → mermaid.run()
                                                           → PDF export
```

`Web/` is copied to the output directory and mapped to the virtual host **`app.local`**
via `SetVirtualHostNameToFolderMapping`, so the page loads over `https://` with no
local server. Markdown text is JSON-encoded in C# and pushed into the page with
`ExecuteScriptAsync`.

## Opening a file

Three ways, all restricted to `.md`:

1. **Double-click a `.md` file in Explorer** — the app registers a `MarkdownReader.md`
   ProgID under `HKCU\SOFTWARE\Classes` on first launch.
2. **Drag & drop** onto the window (a drop overlay appears while dragging).
3. **Open File** button in the title bar.

This is a read-only viewer — there is no editing pane.

## Features

- **GitHub Flavored Markdown** via bundled `marked` (`gfm: true`, `breaks: true`)
- **RTL support** — LTR / RTL / **Auto** toggle. Auto-detection counts characters per
  script and only flips to RTL when RTL characters outnumber LTR *and* exceed 10, so
  short foreign tokens don't flip the whole document.
- **Mermaid diagrams** — rendered inline, each with zoom (0.35×–3×), pan, reset, and
  mouse dragging. Diagram colors are derived from the page's CSS variables.
- **Code blocks** with a copy button (Clipboard API, `execCommand` fallback)
- **Wide tables** scroll horizontally inside their own container
- **PDF export** — see [docs/PDF_FEATURE_GUIDE.md](docs/PDF_FEATURE_GUIDE.md)
- **Offline** — `marked`, `mermaid`, DOMPurify, Font Awesome and the Vazir Persian
  font family are all vendored. The one exception is PDF export, which fetches jsPDF
  and html2canvas from a CDN on first use.
- **Sanitized rendering** — Markdown files are treated as untrusted input: parser
  output passes through DOMPurify before it reaches the DOM, and the page carries a
  Content-Security-Policy. See [docs/issue-bug.md](docs/issue-bug.md) #2.

## Project structure

```
/
├── MarkdownReader.slnx           # solution
├── MarkdownReader/
│   ├── App.xaml(.cs)             # startup, .md association, args[0] handling
│   ├── MainWindow.xaml(.cs)      # title bar, WebView2 host, drag & drop, dialog
│   ├── FileAssociation.cs        # ProgID registration + SHChangeNotify
│   ├── Assets/                   # application icon
│   └── Web/                      # copied to output, served from app.local
│       ├── viewer.html           # entry point: toolbar + output pane
│       ├── js/
│       │   ├── config.js             # marked + mermaid configuration
│       │   ├── markdown-renderer.js  # renderOutput(): parse, wrap, run mermaid
│       │   ├── rtl-detection.js      # script detection + direction heuristic
│       │   ├── ui-controls.js        # direction state, copy buttons, themes
│       │   ├── mermaid-controls.js   # zoom / pan / drag per diagram
│       │   ├── pdf-export.js         # jsPDF-based export
│       │   └── main.js               # legacy browser-build init (unused)
│       ├── styles/               # variables, base, components, rtl
│       ├── fonts/                # Vazir family (Persian PDF output)
│       └── libs/                 # marked, mermaid, DOMPurify, Font Awesome
├── docs/
│   ├── project-overview.md       # architecture overview
│   ├── PDF_FEATURE_GUIDE.md      # PDF export internals
│   └── issue-bug.md              # known issues and bugs
├── markdown_test.md              # sample document for manual testing
└── README.md
```

## Build & run

```bash
dotnet build MarkdownReader/MarkdownReader.csproj
```

Requirements: .NET 10 SDK (Windows), the WebView2 runtime, and the sole NuGet
dependency `Microsoft.Web.WebView2` (1.0.4015-prerelease).

WebView2 user data is stored in `%APPDATA%\MarkdownReader`. DevTools and the default
context menu are disabled in the hosted page.

## Theming

`styles/variables.css` defines the "Luxury Light" palette — warm ivory background
(`#F7F2EA`) with a bronze accent (`#9C7A53`) — as CSS custom properties consumed by
the other stylesheets and by the WPF title bar. Change the values there to restyle
the viewer.

> **Note:** `ui-controls.js` also contains a five-theme switcher (Aurora, Midnight,
> Ocean, Forest, Sunset) carried over from the earlier browser-only build. It is
> currently inert in the desktop app: no stylesheet defines `[data-theme]` rules,
> `viewer.html` has no theme UI, and its initializer is only called from the unused
> `main.js`.

## Extending

- New styling → the matching file in `styles/`
- New rendering behavior → `js/markdown-renderer.js`
- New RTL script → add a pattern to `RTL_LANGUAGES` in `js/rtl-detection.js`
- New OS integration → the C# side (`MainWindow.xaml.cs`, `FileAssociation.cs`)

Keep the shell/web split intact: C# should stay responsible only for the window, file
access, and OS integration.

## License

See [LICENSE](LICENSE).
