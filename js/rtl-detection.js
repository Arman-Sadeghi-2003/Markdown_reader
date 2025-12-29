/**
 * RTL Detection Module
 * Handles detection of Right-to-Left languages and text direction
 */

// RTL language detection patterns
const RTL_LANGUAGES = {
  arabic: /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g,
  hebrew: /[\u0590-\u05FF\uFB1D-\uFB4F]/g,
  persian: /[\u06A9\u06AF\u06CC\u067E\u0686\u0698]/g,
  urdu: /[\u0600-\u06FF]/g,
  sindhi: /[\u0600-\u06FF]/g,
  kurdish: /[\u0600-\u06FF]/g
};

/**
 * Detects the text direction based on character analysis
 * @param {string} text
 * @returns {'rtl'|'ltr'}
 */
function detectTextDirection(text) {
  if (!text) return 'ltr';

  const rtlMatches =
    (text.match(RTL_LANGUAGES.persian) || []).length +
    (text.match(RTL_LANGUAGES.hebrew) || []).length +
    (text.match(RTL_LANGUAGES.arabic) || []).length;

  const ltrMatches = (text.match(/[a-zA-Z\u00C0-\u024F]/g) || []).length;

  // Require a minimum amount of RTL chars to avoid flipping on short tokens
  if (rtlMatches > ltrMatches && rtlMatches >= 10) return 'rtl';
  return 'ltr';
}

/**
 * Detects the language family of the text
 * @param {string} text
 * @returns {string}
 */
function getDetectedLanguage(text) {
  if (!text) return 'Unknown';

  if ((text.match(RTL_LANGUAGES.persian) || []).length) return 'Persian/Farsi';
  if ((text.match(RTL_LANGUAGES.hebrew) || []).length) return 'Hebrew';
  if ((text.match(RTL_LANGUAGES.arabic) || []).length) return 'Arabic';
  if (/[a-zA-Z]/.test(text)) return 'Latin-based (EN/ES/FR/etc.)';

  return 'Mixed/Unknown';
}
