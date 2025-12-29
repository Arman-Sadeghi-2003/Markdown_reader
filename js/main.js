/**
 * Main Initialization File
 * Handles page initialization and event listeners
 */

document.addEventListener('DOMContentLoaded', () => {
  // Init theme switcher (sets theme + wires UI)
  if (typeof window.initThemeSwitcher === 'function') {
    window.initThemeSwitcher();
  }

  // Default direction
  setDirection('ltr');

  // Auto-render if there is content
  const input = document.getElementById('inputArea');
  if (input.value.trim()) renderOutput();

  // Keyboard shortcut (Ctrl+Enter or Cmd+Enter)
  input.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      renderOutput();
    }
  });

  // Auto-detect on input change when auto mode is enabled
  input.addEventListener('input', () => {
    if (!autoDetectEnabled) return;

    const inputText = input.value;
    const detectedDir = detectTextDirection(inputText);
    const detectedLang = getDetectedLanguage(inputText);

    const langIndicator = document.getElementById('langIndicator');
    const outputEl = document.getElementById('output');

    outputEl.className = detectedDir;
    langIndicator.textContent = `Language: ${detectedLang} (Auto: ${detectedDir.toUpperCase()})`;
  });
});
