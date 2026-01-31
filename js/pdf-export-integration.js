// ============================================================================
// INTEGRATION GUIDE - PDF Export Enhanced Module
// ============================================================================

/**
 * STEP 1: Replace PDF Export Module
 * 
 * In your HTML file, replace:
 *   <script src="pdf-export.js"></script>
 * 
 * With:
 *   <script src="pdf-export-improved.js"></script>
 */

// ============================================================================
// STEP 2: Ensure Font Files are Available
// ============================================================================

/*
Create a 'fonts' directory in your project root with:

/project/
├── index.html
├── pdf-export-improved.js
├── rtl-detection.js
├── markdown-renderer.js
├── mermaid-controls.js
├── config.js
├── main.js
└── fonts/
    ├── Vazir.ttf          (Persian)
    ├── Arabic.ttf         (Arabic)
    ├── Hebrew.ttf         (Hebrew)
    ├── Urdu.ttf           (Urdu)
    └── [other fonts...]

Font files can be downloaded from:
- Vazir (Persian): https://github.com/rastikerdar/vazir-font
- Arabic fonts: https://fonts.google.com/?subset=arabic
- Hebrew fonts: https://fonts.google.com/?subset=hebrew
*/

// ============================================================================
// STEP 3: HTML Integration
// ============================================================================

// Your HTML file should have:

/*
<div id="output">
  <!-- Rendered markdown content here -->
</div>

<button class="pdf-download-btn" onclick="downloadAsPDF()">
  📥 Download as PDF
</button>
*/

// ============================================================================
// STEP 4: Testing Different Languages
// ============================================================================

/**
 * Test Persian Export
 */
function testPersianExport() {
  const testContent = document.getElementById('output');
  testContent.innerHTML = `
    <h1>تست صادرات فارسی</h1>
    <p>این یک پاراگراف تستی به زبان فارسی است.</p>
    <p>Lorem ipsum dolor sit amet - English mixed with Persian</p>
  `;
  downloadAsPDF();
}

/**
 * Test Arabic Export
 */
function testArabicExport() {
  const testContent = document.getElementById('output');
  testContent.innerHTML = `
    <h1>اختبار التصدير العربي</h1>
    <p>هذه فقرة اختبارية باللغة العربية.</p>
    <ul>
      <li>العنصر الأول</li>
      <li>العنصر الثاني</li>
    </ul>
  `;
  downloadAsPDF();
}

/**
 * Test Hebrew Export
 */
function testHebrewExport() {
  const testContent = document.getElementById('output');
  testContent.innerHTML = `
    <h1>בדיקת ייצוא עברית</h1>
    <p>זהו פסקה בדיקה בעברית.</p>
    <table>
      <tr>
        <th>עמודה 1</th>
        <th>עמודה 2</th>
      </tr>
      <tr>
        <td>תא 1</td>
        <td>תא 2</td>
      </tr>
    </table>
  `;
  downloadAsPDF();
}

/**
 * Test English Export
 */
function testEnglishExport() {
  const testContent = document.getElementById('output');
  testContent.innerHTML = `
    <h1>English Export Test</h1>
    <p>This is a test paragraph in English.</p>
    <p>Mixed content with numbers: 123, dates: 2024-01-31</p>
  `;
  downloadAsPDF();
}

/**
 * Test Mixed Content
 */
function testMixedContent() {
  const testContent = document.getElementById('output');
  testContent.innerHTML = `
    <h1>محتوى مختلط - Mixed Content</h1>
    <p>This paragraph has English and also includes فارسی text.</p>
    <h2>English Section</h2>
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
    <h2>بخش فارسی</h2>
    <p>این یک بخش فارسی است در میان محتوای انگلیسی.</p>
  `;
  downloadAsPDF();
}

// ============================================================================
// STEP 5: Programmatic Language Detection
// ============================================================================

/**
 * Get Language Info Before Export
 */
function checkLanguageInfo() {
  const content = document.getElementById('output');
  const text = content.innerText;
  
  const { language, direction } = detectLanguageAndDirection(text);
  
  console.log('=== Language Detection ===');
  console.log('Detected Language:', language);
  console.log('Text Direction:', direction);
  console.log('Font Config:', getFontConfig(language));
  
  return { language, direction };
}

/**
 * Export with Language Confirmation
 */
async function downloadWithConfirmation() {
  const { language, direction } = checkLanguageInfo();
  
  const confirmed = confirm(
    `Export PDF with ${language} (${direction})?\n\nPress OK to continue.`
  );
  
  if (confirmed) {
    downloadAsPDF();
  }
}

// ============================================================================
// STEP 6: Error Handling & Debugging
// ============================================================================

/**
 * Enable Debug Mode
 */
function enablePDFDebugMode() {
  // Set to log all PDF operations
  const originalLog = console.log;
  const originalError = console.error;
  
  console.log = function(...args) {
    if (String(args[0]).includes('PDF') || String(args[0]).includes('font')) {
      originalLog.apply(console, args);
    }
  };
  
  console.error = function(...args) {
    if (String(args[0]).includes('PDF') || String(args[0]).includes('font')) {
      originalError.apply(console, args);
    }
  };
  
  console.log('📋 PDF Debug Mode Enabled');
}

/**
 * Test Font Availability
 */
async function testFontAvailability() {
  console.log('=== Testing Font Availability ===');
  
  const fontPaths = [
    { name: 'Vazir (Persian)', path: 'fonts/Vazir.ttf' },
    { name: 'Arabic', path: 'fonts/Arabic.ttf' },
    { name: 'Hebrew', path: 'fonts/Hebrew.ttf' },
    { name: 'Urdu', path: 'fonts/Urdu.ttf' }
  ];
  
  for (const { name, path } of fontPaths) {
    try {
      const response = await fetch(path);
      const available = response.ok;
      console.log(`${name}: ${available ? '✓ Available' : '✗ Not Found'}`);
    } catch (error) {
      console.log(`${name}: ✗ Error (${error.message})`);
    }
  }
}

// ============================================================================
// STEP 7: Custom Configuration
// ============================================================================

/**
 * Example: Add Support for Chinese
 * 
 * Add to LANGUAGE_FONTS in pdf-export-improved.js:
 */
// const chineseConfig = {
//   chinese: {
//     name: 'SimSun',
//     path: 'fonts/SimSun.ttf',
//     direction: 'ltr',
//     aliases: ['zh', 'zh-CN', 'zh-TW']
//   }
// };

/**
 * Example: Add Support for Japanese
 * 
 * Add to RTL_CHAR_RANGES in pdf-export-improved.js:
 */
// const japaneseRanges = {
//   hiragana: /[\u3040-\u309F]/g,
//   katakana: /[\u30A0-\u30FF]/g,
//   kanji: /[\u4E00-\u9FFF]/g
// };

// ============================================================================
// STEP 8: Integration with Existing Code
// ============================================================================

/**
 * If you have RTL detection already, you can use existing functions:
 * 
 * from rtl-detection.js:
 *   - detectTextDirection(text)
 *   - getDetectedLanguage(text)
 * 
 * The new module has enhanced versions:
 *   - detectLanguageAndDirection(text)
 *   - getFontConfig(language)
 */

// Comparison:
function compareDetectionMethods(text) {
  console.log('=== Detection Methods Comparison ===');
  
  // Old method
  const oldDirection = detectTextDirection(text);
  const oldLanguage = getDetectedLanguage(text);
  console.log('Old Method:', { direction: oldDirection, language: oldLanguage });
  
  // New method
  const newDetection = detectLanguageAndDirection(text);
  console.log('New Method:', newDetection);
}

// ============================================================================
// STEP 9: Complete Example Usage
// ============================================================================

/**
 * Full integration example
 */
async function completeExportExample() {
  try {
    // 1. Get content
    const outputEl = document.getElementById('output');
    if (!outputEl || !outputEl.innerHTML.trim()) {
      console.warn('No content to export');
      return;
    }

    // 2. Detect language
    const text = outputEl.innerText;
    const { language, direction } = detectLanguageAndDirection(text);
    
    // 3. Log detection
    console.log('📍 Export Configuration:');
    console.log('   Language:', language);
    console.log('   Direction:', direction);
    console.log('   Font:', getFontConfig(language).name);

    // 4. Perform export
    await downloadAsPDF();
    
    // 5. Success message
    console.log('✓ PDF exported successfully');
    
  } catch (error) {
    console.error('✗ Export failed:', error);
  }
}

// ============================================================================
// STEP 10: Button HTML Examples
// ============================================================================

/*
<!-- Default Button (Auto-detect) -->
<button onclick="downloadAsPDF()" class="pdf-download-btn">
  📥 Download as PDF
</button>

<!-- Button with Confirmation -->
<button onclick="downloadWithConfirmation()" class="pdf-download-btn">
  📥 Download with Language Check
</button>

<!-- Language-specific Buttons -->
<button onclick="testPersianExport()" class="pdf-download-btn">
  📥 Persian (فارسی)
</button>

<button onclick="testArabicExport()" class="pdf-download-btn">
  📥 Arabic (العربية)
</button>

<button onclick="testHebrewExport()" class="pdf-download-btn">
  📥 Hebrew (עברית)
</button>

<button onclick="testEnglishExport()" class="pdf-download-btn">
  📥 English
</button>

<!-- Debug Button -->
<button onclick="testFontAvailability()" class="pdf-download-btn">
  🔍 Test Font Availability
</button>
*/

// ============================================================================
// QUICK START CHECKLIST
// ============================================================================

/*
✓ Replace pdf-export.js with pdf-export-improved.js
✓ Create /fonts directory
✓ Add font files (Vazir.ttf, etc.)
✓ Update HTML script import
✓ Update button onclick if needed
✓ Test with different languages
✓ Check console for any errors
✓ Verify PDF output in correct language
✓ Check RTL/LTR alignment
✓ Test with mixed content
*/

// ============================================================================
// SUPPORT & DEBUGGING
// ============================================================================

/**
 * Log all available functions
 */
function showAvailableFunctions() {
  console.log('=== Available Functions ===');
  console.log('downloadAsPDF()');
  console.log('detectLanguageAndDirection(text)');
  console.log('getFontConfig(language)');
  console.log('checkLanguageInfo()');
  console.log('downloadWithConfirmation()');
  console.log('testPersianExport()');
  console.log('testArabicExport()');
  console.log('testHebrewExport()');
  console.log('testEnglishExport()');
  console.log('testMixedContent()');
  console.log('testFontAvailability()');
  console.log('enablePDFDebugMode()');
}

// Make available globally
window.showAvailableFunctions = showAvailableFunctions;
window.checkLanguageInfo = checkLanguageInfo;
window.downloadWithConfirmation = downloadWithConfirmation;
window.testPersianExport = testPersianExport;
window.testArabicExport = testArabicExport;
window.testHebrewExport = testHebrewExport;
window.testEnglishExport = testEnglishExport;
window.testMixedContent = testMixedContent;
window.testFontAvailability = testFontAvailability;
window.enablePDFDebugMode = enablePDFDebugMode;
window.compareDetectionMethods = compareDetectionMethods;
window.completeExportExample = completeExportExample;

console.log('📦 PDF Export Integration Module Loaded');
console.log('Type showAvailableFunctions() in console for help');
