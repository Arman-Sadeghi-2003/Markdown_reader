/**
 * UI Controls Module
 * Handles user interface interactions, direction controls, and theme switching.
 */

let currentDirection = 'ltr';
let autoDetectEnabled = false;

/* -----------------------------
   Direction controls
------------------------------ */

function setDirection(direction) {
  const outputEl = document.getElementById('output');
  const langIndicator = document.getElementById('langIndicator');
  const buttons = document.querySelectorAll('.direction-toggle');

  buttons.forEach(btn => btn.classList.remove('active'));

  currentDirection = direction;
  autoDetectEnabled = direction === 'auto';

  if (direction === 'auto') {
    document.querySelector('.auto-btn')?.classList.add('active');

    const inputText = document.getElementById('inputArea').value;
    const detectedDir = detectTextDirection(inputText);
    const detectedLang = getDetectedLanguage(inputText);

    outputEl.className = detectedDir;
    langIndicator.textContent = `Language: ${detectedLang} (Auto: ${detectedDir.toUpperCase()})`;
    renderOutput();
    return;
  }

  outputEl.className = direction;

  if (direction === 'ltr') {
    document.querySelector('.ltr-btn')?.classList.add('active');
    langIndicator.textContent = 'Language: Manual LTR';
  } else {
    document.querySelector('.rtl-btn')?.classList.add('active');
    langIndicator.textContent = 'Language: Manual RTL';
  }
}

/* -----------------------------
   Copy buttons for code blocks
------------------------------ */

function addCopyButtonsTo(pre) {
  if (pre.querySelector('.copy-btn')) return;

  const btn = document.createElement('button');
  btn.className = 'copy-btn';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Copy code');
  btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';

  const codeEl = pre.querySelector('code') || pre;

  btn.addEventListener('click', async () => {
    const text = codeEl.innerText;

    const resetBtn = () => {
      btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';
      btn.style.background = 'rgba(255,255,255,0.06)';
      btn.style.borderColor = 'rgba(255,255,255,0.10)';
    };

    try {
      await navigator.clipboard.writeText(text);
      btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied';
      btn.style.background = 'rgba(76, 175, 80, 0.18)';
      btn.style.borderColor = 'rgba(76, 175, 80, 0.28)';
      setTimeout(resetBtn, 1200);
      return;
    } catch (_) {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied';
        btn.style.background = 'rgba(76, 175, 80, 0.18)';
        btn.style.borderColor = 'rgba(76, 175, 80, 0.28)';
      } catch (__) {
        btn.innerHTML = '<i class="fa-solid fa-xmark"></i> Failed';
        btn.style.background = 'rgba(244, 67, 54, 0.18)';
        btn.style.borderColor = 'rgba(244, 67, 54, 0.28)';
      } finally {
        document.body.removeChild(ta);
        setTimeout(resetBtn, 1200);
      }
    }
  });

  pre.appendChild(btn);
}

/* -----------------------------
   Theme controls
------------------------------ */

const THEMES = [
  { id: 'aurora', label: 'Aurora' },
  { id: 'midnight', label: 'Midnight' },
  { id: 'ocean', label: 'Ocean' },
  { id: 'forest', label: 'Forest' },
  { id: 'sunset', label: 'Sunset' }
];

function setTheme(themeId) {
  const theme = THEMES.find(t => t.id === themeId) ? themeId : 'aurora';
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);

  const buttonLabel = document.getElementById('themeButtonLabel');
  if (buttonLabel) {
    const pretty = THEMES.find(t => t.id === theme)?.label || 'Aurora';
    buttonLabel.textContent = `Theme: ${pretty}`;
  }

  // Highlight active option
  document.querySelectorAll('.theme-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.theme === theme);
  });

  // Re-apply Mermaid theme to match CSS variables and re-render diagrams
  if (typeof window.applyMermaidThemeFromCSS === 'function') {
    window.applyMermaidThemeFromCSS();
  }

  // Re-render to ensure diagrams + styling remain consistent
  if (typeof window.renderOutput === 'function') {
    window.renderOutput();
  }
}

function initThemeSwitcher() {
  const saved = localStorage.getItem('theme');

  // If no saved theme, respect system preference (dark -> midnight)
  if (!saved) {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'midnight' : 'aurora');
  } else {
    setTheme(saved);
  }

  const btn = document.getElementById('themeButton');
  const dropdown = document.getElementById('themeDropdown');

  if (!btn || !dropdown) return;

  const closeDropdown = () => {
    dropdown.classList.remove('active');
    btn.setAttribute('aria-expanded', 'false');
  };

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = dropdown.classList.toggle('active');
    btn.setAttribute('aria-expanded', String(open));
  });

  dropdown.querySelectorAll('.theme-option').forEach(opt => {
    opt.addEventListener('click', () => {
      setTheme(opt.dataset.theme);
      closeDropdown();
    });

    opt.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setTheme(opt.dataset.theme);
        closeDropdown();
      }
    });
  });

  document.addEventListener('click', closeDropdown);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDropdown();
  });
}

window.initThemeSwitcher = initThemeSwitcher;
window.setTheme = setTheme;
