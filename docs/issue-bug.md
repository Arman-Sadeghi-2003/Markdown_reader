# Known Issues & Bugs

Findings from a read of the current `desktop` branch. Nothing here has been reproduced
in a running build — each entry names the code path that produces it, so it can be
confirmed quickly. Ordered by severity.

Legend: **[Crash]** breaks the app · **[Security]** trust boundary · **[Bug]** wrong
behavior · **[UX]** confusing but working · **[Debt]** cleanliness / maintenance.

Priorities: **P0** ship-blocking — crashes or a trust-boundary hole · **P1** breaks a
headline feature or is hit in everyday use · **P2** wrong output or friction with a
workaround · **P3** cleanup, no user-visible effect.

## Priority table

| # | Issue | Type | Priority | Area | Effort | Status |
|---|---|---|---|---|---|---|
| [1](#1-crash-the-auto-direction-button-throws-before-a-file-is-opened) | **Auto** button throws before a file is opened | Crash | **P0** | Web / UI | S | ✅ Fixed |
| [2](#2-security-markdown-is-rendered-without-sanitization) | Markdown rendered without sanitization | Security | **P0** | Web / render | M | ✅ Fixed |
| [3](#3-crash-openfile-can-dereference-a-null-corewebview2) | `OpenFile` can dereference a null `CoreWebView2` | Crash | **P0** | C# shell | S | Open |
| [4](#4-crash-unhandled-io-exceptions-in-openfile) | Unhandled I/O exceptions in `OpenFile` | Crash | **P0** | C# shell | S | Open |
| [8](#8-bug-pdf-export-fails-with-no-network-connection) | PDF export fails offline | Bug | **P1** | PDF | S | Open — also unblocks a strict CSP |
| [9](#9-bug-rtl-text-is-not-reordered-in-exported-pdfs) | RTL text not reordered in PDFs | Bug | **P1** | PDF / RTL | L | Open |
| [14](#14-bug-a-single-mermaid-parse-error-stops-all-diagram-setup) | One bad diagram disables all diagram setup | Bug | **P1** | Mermaid | S | Open |
| [5](#5-bug-global-mouse-listeners-accumulate-on-every-render) | Global mouse listeners accumulate per render | Bug | **P1** | Mermaid | M | Open |
| [6](#6-bug-diagram-zoompan-state-leaks-between-documents) | Zoom/pan state leaks between documents | Bug | **P1** | Mermaid | S | Open |
| [17](#17-ux-empty-state-and-error-text-is-written-for-the-old-web-app) | Empty-state / error text from the old web app | UX | **P1** | Web / UI | S | Open |
| [16](#16-ux-picking-a-non-md-file-does-nothing-silently) | Non-`.md` file opens silently do nothing | UX | **P1** | C# shell | S | Open |
| [7](#7-bug-press-and-hold-zoom-can-run-forever) | Press-and-hold zoom can run forever | Bug | **P2** | Mermaid | S | Open |
| [11](#11-bug-nested-list-items-are-duplicated-in-pdf-output) | Nested list items duplicated in PDF | Bug | **P2** | PDF | S | Open |
| [13](#13-bug-table-headers-are-not-repeated-across-page-breaks) | Table headers not repeated across pages | Bug | **P2** | PDF | M | Open |
| [12](#12-bug-tall-diagrams-are-shrunk-against-the-wrong-page-space) | Tall diagrams shrunk against wrong page space | Bug | **P2** | PDF | S | Open |
| [15](#15-bug-inline-formatting-is-flattened-in-pdf-text) | Inline formatting flattened in PDF text | Bug | **P2** | PDF | M | Open |
| [21](#21-bug-non-utf-8-files-are-garbled) | Non-UTF-8 files are garbled | Bug | **P2** | C# shell | S | Open |
| [19](#19-ux-the-md-association-is-claimed-silently-on-every-launch) | `.md` association claimed silently each launch | UX | **P2** | C# shell | M | Open |
| [10](#10-bug-persian-characters-are-double-counted-in-direction-detection) | Persian chars double-counted in detection | Bug | **P2** | RTL | S | Open |
| [23](#23-bug-rtl-tables-are-forced-back-to-ltr) | RTL tables forced back to LTR | Bug | **P2** | RTL / CSS | S | Open |
| [18](#18-ux-the-pdf-button-relabels-itself-after-a-failure) | PDF button relabels itself after a failure | UX | **P2** | PDF | S | Open |
| [22](#22-bug-webviewready-fires-on-every-navigation-success-or-failure) | `WebViewReady` fires on every navigation | Bug | **P2** | C# shell | S | Open |
| [20](#20-bug-fileassociation-registers-the-wrong-executable-under-dotnet-run) | Wrong exe registered under `dotnet run` | Bug | **P3** | C# shell | S | Open |
| [25](#25-debt-the-theme-switcher-is-inert) | Theme switcher is inert | Debt | **P3** | Web / UI | M | Open |
| [24](#24-debt-mainjs-is-dead-code-that-would-crash-if-loaded) | `main.js` is dead code | Debt | **P3** | Web | S | Open |
| [26](#26-debt-stale-marked-options) | Stale `marked` options, no heading ids | Debt | **P3** | Web / render | S | Open |
| [29](#29-debt-diagnostics-are-unreachable) | Diagnostics unreachable (DevTools off) | Debt | **P3** | C# / Web | S | Open |
| [28](#28-debt-hard-coded-accent-color-in-pdf-output) | Hard-coded accent color in PDF output | Debt | **P3** | PDF | S | Open |
| [30](#30-debt-prerelease-dependency-and-shipped-source-bloat) | Prerelease dependency and source bloat | Debt | **P3** | Build | S | Open |
| [27](#27-debt-dead-skip-check-in-the-pdf-walker) | Dead skip-check in the PDF walker | Debt | **P3** | PDF | S | Open |

Effort: **S** under an hour · **M** half a day · **L** a day or more.

---

## Critical

### 1. [Crash] The **Auto** direction button throws before a file is opened

`setDirection('auto')` reads `document.getElementById('inputArea').value`
([ui-controls.js:26](MarkdownReader/Web/js/ui-controls.js:26)), but `#inputArea` is
created lazily by `window.__renderMarkdown`
([viewer.html:167](MarkdownReader/Web/viewer.html:167)) — it does not exist in the
initial DOM. Clicking **Auto** on the empty state throws
`TypeError: Cannot read properties of null`, and because DevTools are disabled the
button simply appears dead.

`renderOutput()` has the same unguarded access at
[markdown-renderer.js:7](MarkdownReader/Web/js/markdown-renderer.js:7).

**Fixed.** `#inputArea` is now a `hidden` textarea in the `viewer.html` markup, present
from first paint. Both call sites read through a single null-safe accessor,
`getMarkdownSource()` in `markdown-renderer.js`, and `setDirection('auto')` skips
`renderOutput()` when no document is open so the empty state survives. Verified by
serving `Web/` over localhost: **Auto** on the empty state no longer throws, and
auto-detection still resolves LTR for Latin and RTL for Persian once a file is loaded.

### 2. [Security] Markdown is rendered without sanitization

`marked.parse()` ([markdown-renderer.js:28](MarkdownReader/Web/js/markdown-renderer.js:28))
passes raw HTML straight through — marked v15 removed the `sanitize` option entirely,
and no DOMPurify pass replaces it. Any `<script>`, `<img onerror=…>` or `<iframe>` in
a `.md` file executes inside the `app.local` origin, which can read the whole bundled
`Web/` folder and `localStorage`. Opening a Markdown file received from someone else
is enough to trigger it.

There is also no Content-Security-Policy on the page, and `pdf-export.js` pulls
scripts from a CDN at runtime, so a strict CSP would need that host allowlisted — or,
better, the libraries vendored (see #8).

**Fixed.** DOMPurify 3.1.6 is vendored at `Web/libs/purify.min.js` and every render
now goes through `sanitizeMarkup()` in `markdown-renderer.js`, which fails closed —
if the library is ever missing, the markup is escaped rather than injected. The
rendering-error branch escapes `error.message` through the same module instead of
interpolating it into HTML.

`viewer.html` also carries a CSP: `default-src 'none'` with `script-src` limited to
`'self'`, `'unsafe-inline'` and `https://cdnjs.cloudflare.com`. `'unsafe-inline'` is
required because the toolbar and the generated Mermaid controls use inline handlers,
and cdnjs is allowed only for the PDF libraries — **fixing #8 lets `script-src` and
`connect-src` drop to `'self'`.**

Verified against a payload document (`<script>`, `<img onerror>`, `<iframe>`,
`javascript:` links in both Markdown and raw-HTML form): nothing executed and every
vector was stripped, while `<em>`, `<br>`, `<details>`, tables and code blocks
survived. Mermaid still renders under the CSP, and the PDF libraries still load.

### 3. [Crash] `OpenFile` can dereference a null `CoreWebView2`

[MainWindow.xaml.cs:74](MarkdownReader/MainWindow.xaml.cs:74) calls
`WebView.CoreWebView2.ExecuteScriptAsync` with no initialization check. The
**Open File** button and drag & drop are both live from the moment the window is
shown, while `InitializeWebViewAsync()` is still awaiting
`CoreWebView2Environment.CreateAsync`. A drop during that window throws a
`NullReferenceException` inside an `async void` method — unhandled, so it takes the
process down.

The `args[0]` path is safe because it waits for `WebViewReady`; nothing else is.

**Fix:** track a ready flag, queue the pending path, and disable the toolbar until the
WebView reports ready.

### 4. [Crash] Unhandled I/O exceptions in `OpenFile`

[MainWindow.xaml.cs:63](MarkdownReader/MainWindow.xaml.cs:63) — `File.ReadAllTextAsync`
is not wrapped in `try`/`catch`. A locked file, a disconnected network path, or a
permissions error throws in an `async void` handler and crashes the app instead of
showing a message. The `File.Exists` check above does not close the race.

---

## Functional bugs

### 5. [Bug] Global mouse listeners accumulate on every render

`initializeDragging()` attaches `mousemove` and `mouseup` handlers to `document`
([mermaid-controls.js:121-122](MarkdownReader/Web/js/mermaid-controls.js:121)) and
never removes them. It runs once per diagram per render, and `renderOutput()` is
re-invoked by `setDirection('auto')` and `setTheme()`. Opening several documents in
one session leaves dozens of live handlers holding references to detached DOM nodes.

### 6. [Bug] Diagram zoom/pan state leaks between documents

`mermaidStates` is keyed by positional index (`mermaid-0`, `mermaid-1`, …) and is
never cleared ([mermaid-controls.js:6](MarkdownReader/Web/js/mermaid-controls.js:6)).
Zoom into the first diagram, open a different file, and its first diagram appears
pre-zoomed and off-center.

### 7. [Bug] Press-and-hold zoom can run forever

`startRepeat()` is stopped by `onmouseup`/`onmouseleave` on the button
([markdown-renderer.js:52](MarkdownReader/Web/js/markdown-renderer.js:52)). If the
button is released outside the window, or focus is lost mid-press, neither fires and
the interval keeps zooming indefinitely.

**Fix:** also stop on `window.blur` and on a document-level `mouseup`.

### 8. [Bug] PDF export fails with no network connection

`loadPDFLibraries()` ([pdf-export.js:61](MarkdownReader/Web/js/pdf-export.js:61))
fetches jsPDF and html2canvas from cdnjs at click time. Every other asset — marked,
mermaid, Font Awesome, Vazir — is vendored under `Web/`, so this is the only feature
that breaks offline, in an app whose whole premise is offline viewing.

**Fix:** vendor both libraries alongside the others.

### 9. [Bug] RTL text is not reordered in exported PDFs

jsPDF renders the Vazir glyphs but lays them out left-to-right with no bidi
reordering. Persian, Arabic and Hebrew paragraphs come out visually reversed even
though they are correct in the viewer — which undercuts the feature the Vazir
embedding was built for.

**Fix:** run text through a bidi/shaping pass before `doc.text()`, or export RTL
documents through a rasterized path.

### 10. [Bug] Persian characters are double-counted in direction detection

`detectTextDirection()` adds `RTL_LANGUAGES.persian` and `RTL_LANGUAGES.arabic` match
counts together ([rtl-detection.js:23](MarkdownReader/Web/js/rtl-detection.js:23)),
but the Persian pattern (`ک گ ی پ چ ژ`) is a subset of the Arabic range — every
Persian-specific letter is counted twice. The bias happens to help Persian detection,
but it is accidental, and it makes the ">= 10 characters" threshold mean something
different per script.

`urdu`, `sindhi` and `kurdish` are defined in the same map but never referenced.

### 11. [Bug] Nested list items are duplicated in PDF output

[pdf-export.js:366](MarkdownReader/Web/js/pdf-export.js:366) uses
`element.querySelectorAll('li')`, which collects descendants at every depth. A nested
list emits its child items once inside the parent `<li>`'s text and again as their own
lines — all at the same indent level.

### 12. [Bug] Tall diagrams are shrunk against the wrong page space

[pdf-export.js:304](MarkdownReader/Web/js/pdf-export.js:304) computes `maxImageHeight`
from the space left on the *current* page, scales the image down to fit, and only then
calls `checkPageBreak()`. When the break fires, the image lands at the top of a fresh
page already shrunk to fit the previous page's remainder — a diagram low on a page
comes out much smaller than it needed to be.

### 13. [Bug] Table headers are not repeated across page breaks

`drawRow()` starts a new page mid-table
([pdf-export.js:468](MarkdownReader/Web/js/pdf-export.js:468)) without re-drawing the
header row, so continuation pages show unlabeled columns. Zebra striping also starts
on the first data row (`index % 2 === 0`,
[pdf-export.js:501](MarkdownReader/Web/js/pdf-export.js:501)), which reads as a shaded
row directly beneath the shaded header.

### 14. [Bug] A single Mermaid parse error stops all diagram setup

`mermaid.run({...}).then(...)`
([markdown-renderer.js:103](MarkdownReader/Web/js/markdown-renderer.js:103)) has no
`.catch`. One malformed diagram rejects the promise, so `initializeDragging()` never
runs for *any* diagram in the document, and the rejection surfaces only as an
unhandled-promise warning in a console the user cannot open.

### 15. [Bug] Inline formatting is flattened in PDF text

`getCleanText()` reads `textContent`, so bold, italics, links and inline code lose
their styling in every text block. Link URLs are dropped entirely — a document of
references exports as undifferentiated prose.

---

## UX and correctness

### 16. [UX] Picking a non-`.md` file does nothing, silently

The **Open File** dialog offers an `All Files (*.*)` filter
([MainWindow.xaml.cs:129](MarkdownReader/MainWindow.xaml.cs:129)), but `OpenFile`
returns early for any extension other than `.md`
([MainWindow.xaml.cs:60](MarkdownReader/MainWindow.xaml.cs:60)) with no message. The
user selects a `.txt` or `.markdown` file and the window just doesn't change.

**Fix:** accept `.markdown`/`.txt`, or say why nothing happened.

### 17. [UX] Empty-state and error text is written for the old web app

`renderOutput()` prints "Enter some text above to see the rendered output…"
([markdown-renderer.js:12](MarkdownReader/Web/js/markdown-renderer.js:12)) — there is
no input area in the desktop viewer, and this string also overwrites the styled empty
state. The error branch writes literal Markdown into HTML
([markdown-renderer.js:125](MarkdownReader/Web/js/markdown-renderer.js:125)), so the
`**` shows up as-is, and `error.message` is interpolated unescaped.

### 18. [UX] The PDF button relabels itself after a failure

The error path sets the label to `📥 Download as PDF`
([pdf-export.js:50](MarkdownReader/Web/js/pdf-export.js:50)), but the button's real
label is a Font Awesome icon plus `PDF`. One failed export permanently changes the
toolbar until the app restarts.

### 19. [UX] The `.md` association is claimed silently on every launch

`Task.Run(FileAssociation.Register)` runs at every startup
([App.xaml.cs:15](MarkdownReader/App.xaml.cs:15)) and rewrites
`HKCU\SOFTWARE\Classes\.md`, taking the file type from whatever editor the user had
chosen — with no prompt and no way to opt out from inside the app. `Unregister()`
exists but is never called.

**Fix:** register once, on explicit consent, and expose a way to release it.

### 20. [Bug] `FileAssociation` registers the wrong executable under `dotnet run`

`Environment.ProcessPath`
([FileAssociation.cs:21](MarkdownReader/FileAssociation.cs:21)) resolves to
`dotnet.exe` when the app is launched through the SDK host, writing a shell command
that will not open the viewer. Harmless for published builds, confusing during
development.

### 21. [Bug] Non-UTF-8 files are garbled

`File.ReadAllTextAsync(path)` assumes UTF-8 (with BOM detection). Legacy Persian or
Arabic documents saved as Windows-1256, or UTF-16 files without a BOM, render as
mojibake with no indication why.

### 22. [Bug] `WebViewReady` fires on every navigation, success or failure

The handler at [MainWindow.xaml.cs:48](MarkdownReader/MainWindow.xaml.cs:48) ignores
`e.IsSuccess` and is raised for each `NavigationCompleted`. Today only one navigation
occurs, so the startup file-open works — but the contract is wrong, and the `args[0]`
subscription in `App.xaml.cs` would re-open the file on any future re-navigation.

### 23. [Bug] RTL tables are forced back to LTR

`.rtl .table-wrap table { direction: ltr; }`
([rtl.css:45](MarkdownReader/Web/styles/rtl.css:45)) overrides the container's RTL
direction, so column order in a Persian or Arabic document runs left-to-right. This
may be deliberate for numeric tables, but it is unconditional and undocumented.

---

## Maintenance / debt

### 24. [Debt] `main.js` is dead code that would crash if loaded

Not referenced by `viewer.html`. If it were re-added, its `DOMContentLoaded` handler
dereferences `#inputArea` unconditionally
([main.js:16](MarkdownReader/Web/js/main.js:16)) — the same null as #1 — and wires
`keydown`/`input` listeners for an editor the desktop app does not have.

### 25. [Debt] The theme switcher is inert

`ui-controls.js` defines five themes, writes `data-theme` and persists to
`localStorage`, but no stylesheet defines `[data-theme]` rules, `viewer.html` has no
`#themeButton`/`#themeDropdown`, and `initThemeSwitcher()` is only called from the
unused `main.js`. Either finish it or remove it — as written it reads like a working
feature.

### 26. [Debt] Stale `marked` options

`headerIds: false` and `mangle: false`
([config.js:7](MarkdownReader/Web/js/config.js:7)) were removed from marked in v13;
the bundled build is v15.0.12, where both are silently ignored. Headings therefore
carry no `id` attributes, so in-document anchor links inside a Markdown file do not
work.

### 27. [Debt] Dead skip-check in the PDF walker

`element.classList.contains('copy-btn')`
([pdf-export.js:331](MarkdownReader/Web/js/pdf-export.js:331)) can never match — copy
buttons live inside `<pre>`, never as direct children of `#output`. The `pre` handler
strips them separately, so the check is vestigial.

### 28. [Debt] Hard-coded accent color in PDF output

Blockquote rules, horizontal rules and table headers use indigo `(99, 102, 241)`
throughout `pdf-export.js`, unrelated to the bronze `--primary` (`#9C7A53`) the app
actually uses. Exported PDFs do not look like the app.

### 29. [Debt] Diagnostics are unreachable

`pdf-export.js` and `mermaid-controls.js` log extensively via `console.*`, but
`AreDevToolsEnabled = false`
([MainWindow.xaml.cs:45](MarkdownReader/MainWindow.xaml.cs:45)) makes the console
inaccessible in a normal build. Consider a debug-only toggle, or forwarding errors to
the C# side via `WebMessageReceived`.

### 30. [Debt] Prerelease dependency and shipped source bloat

The project pins `Microsoft.Web.WebView2` **1.0.4015-prerelease**. Font Awesome ships
its full `scss/` sources and unminified CSS into the output directory, and
`mermaid.min.js` alone is 2.7 MB — none of the SCSS is needed at runtime.

---

## Suggested order of work

1. **P0 (#1, #3, #4)** — the three crashes; each is a small, local fix. **#1 is done.**
2. **P0 (#2)** — sanitize rendered HTML before the app is distributed. **Done.**
3. **P1 PDF (#8, #9)** — make export work offline and get RTL right, or state the limits.
4. **P1 Mermaid (#14, #5, #6)** — one lifecycle pass over the diagram layer; #7 rides along.
5. **P1 UI (#17, #16)** — replace the leftover web-app copy and give bad input a response.
6. P2 by area, P3 as cleanup.
