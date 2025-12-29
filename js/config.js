/**
 * Configuration File
 * Contains initialization and configuration for external libraries
 */

// Marked: better Markdown parsing
marked.setOptions({
  breaks: true,
  gfm: true,
  headerIds: false,
  mangle: false
});

// Mermaid theme helper (reads CSS variables so diagrams match the active theme)
function applyMermaidThemeFromCSS() {
  const cs = getComputedStyle(document.documentElement);

  const primary = cs.getPropertyValue('--primary').trim() || '#4cafef';
  const text = cs.getPropertyValue('--text-color').trim() || '#333';
  const border = cs.getPropertyValue('--border-color').trim() || '#e5e7eb';
  const card = cs.getPropertyValue('--card-bg').trim() || '#ffffff';

  // Mermaid v10+: "base" + themeVariables is a good approach for custom themes.
  mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    securityLevel: 'strict',
    themeVariables: {
      primaryColor: primary,
      primaryTextColor: text,
      primaryBorderColor: primary,
      lineColor: primary,
      textColor: text,
      mainBkg: card,
      nodeBorder: border,
      fontFamily: '"Segoe UI", Tahoma, sans-serif'
    }
  });
}

window.applyMermaidThemeFromCSS = applyMermaidThemeFromCSS;

// Initial initialize
applyMermaidThemeFromCSS();
