# PDF Export — Implementation Guide

How `MarkdownReader/Web/js/pdf-export.js` turns the rendered preview into a PDF.

## Overview

The **PDF** button in the viewer toolbar calls `downloadAsPDF()`. Rather than
screenshotting the page, the exporter walks the rendered `#output` DOM element by
element and composes a real text-based PDF with **jsPDF** — headings, paragraphs,
lists, blockquotes and tables become selectable text, while code blocks and Mermaid
diagrams are rasterized with **html2canvas** and pasted in as PNGs.

Output filename: `markdown-export-YYYY-MM-DD.pdf`.

## Flow

```
User clicks PDF button (enabled once a document is open)
        ↓
downloadAsPDF()
        ↓
Guard: is there rendered content?     → alert and stop if empty
        ↓
loadPDFLibraries()                    → jsPDF + html2canvas from cdnjs
        ↓
loadPersianFont()                     → fonts/Vazir.ttf → base64 → jsPDF VFS
        ↓
performPDFExport()                    → element-by-element walk of #output
        ↓
doc.save('markdown-export-YYYY-MM-DD.pdf')
        ↓
Button state restored
```

## Font handling

Persian/Arabic text needs an embedded font — jsPDF's built-in Helvetica cannot render
it. `loadPersianFont()`:

1. Fetches `fonts/Vazir.ttf` over XHR as an `ArrayBuffer`.
2. Converts it to base64 (`arrayBufferToBase64`).
3. Registers it through a jsPDF `addFonts` event handler: `addFileToVFS` +
   `addFont('Vazir.ttf', 'Vazir', 'normal')`.

The result is cached in the `persianFontLoaded` flag, so the cost is paid once per
session. If the font can't be loaded the function warns and returns without throwing —
the export continues with **Helvetica** as fallback, which is fine for Latin-only
documents.

## Document setup

```javascript
new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
});
```

| Setting | Value |
|---|---|
| Margin | 15 mm |
| Line height | 7 mm |
| Heading sizes | h1 20, h2 16, h3 14, h4 12, h5 11 |
| Body / code size | 10 / 9 |

A `checkPageBreak(requiredHeight)` helper adds a page and resets `yPosition` whenever
the next block would overflow the bottom margin.

## Element handling

`performPDFExport()` iterates the children of `#output`, flattening `.table-wrap`
containers so the `<table>` inside is processed directly. Copy buttons and Mermaid
control bars are skipped.

| Element | Treatment |
|---|---|
| `h1`–`h6` | Bold text at the per-level size, wrapped with `splitTextToSize` |
| `p` | Wrapped body text |
| `ul` / `ol` | One line per `<li>`, prefixed `•` or `1.`, indented 5 mm |
| `blockquote` | Vertical rule at the left margin, text indented 5 mm |
| `table` | Drawn cell by cell: measured row heights, filled header row, zebra striping, 7 pt text, page-breaking mid-table |
| `hr` | 0.5 mm horizontal rule |
| `pre` | html2canvas raster at 2× scale on a light background; falls back to plain text on failure |
| Mermaid / `svg` | html2canvas raster at 2× scale, scaled down to fit the remaining page height |
| `img` | Added directly via `addImage`, aspect ratio preserved |
| anything else | Falls through to plain wrapped text |

Code blocks are cloned into an off-screen container (with the copy button removed)
before capture, so the PDF shows clean code without UI chrome.

## Customizing

**Filename** — near the end of `performPDFExport()`:

```javascript
const timestamp = new Date().toISOString().split('T')[0];
const filename = `markdown-export-${timestamp}.pdf`;
```

**Page size / orientation** — the `jsPDF` constructor options above.

**Margins and type scale** — the `margin`, `lineHeight` and `fontSize` constants at
the top of `performPDFExport()`.

**Raster quality** — the `scale: 2` option passed to `html2canvas` in `addCodeBlock()`
and `addDiagram()`.

**Fallback font** — `PERSIAN_FONT.fallback`.

## Known limitations

- **Requires a network connection.** `loadPDFLibraries()` pulls jsPDF and html2canvas
  from cdnjs at click time. Every other asset in the app is vendored, so this is the
  only feature that fails offline. Vendoring both libraries under `Web/libs/` would
  close the gap.
- **Text formatting is flattened.** `getCleanText()` extracts `textContent`, so inline
  bold, italic, links and inline code lose their styling in text blocks (code blocks
  and diagrams keep their appearance because they are rasterized).
- **RTL text is not reordered.** Vazir renders the glyphs, but jsPDF lays them out
  left-to-right; Persian and Arabic paragraphs will not read correctly in the PDF.
- **Fixed accent color.** Blockquote rules, horizontal rules and table headers use a
  hard-coded indigo (`99, 102, 241`) rather than the bronze palette from
  `styles/variables.css`.
- **Nested lists flatten.** `querySelectorAll('li')` collects all descendants at one
  indent level.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| "No content to export" | No document is open — open a `.md` file first |
| Export fails with a network error | The CDN libraries could not load; check connectivity |
| Persian text renders as boxes or Latin fallback | `fonts/Vazir.ttf` was not found in the output directory — confirm `Web/**` is being copied (`PreserveNewest`) |
| Diagrams missing or blank | html2canvas failed on that node; the console logs the error and a `[Diagram]` placeholder is inserted |

Diagnostics are written to the WebView2 console, but DevTools are disabled in
`MainWindow.xaml.cs` — re-enable `AreDevToolsEnabled` temporarily when debugging.

## Privacy

All processing happens locally in the WebView2 process. Document content is never
uploaded; the only network traffic is the one-time CDN fetch of the two libraries.
