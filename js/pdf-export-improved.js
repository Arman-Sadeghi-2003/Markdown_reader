/**
 * PDF Export Module - Enhanced with Multi-Language & RTL/LTR Support
 * Uses jsPDF with custom font support for Persian, Arabic, Hebrew, and more
 * Includes proper text direction handling for RTL and LTR languages
 * Features page breaks, table support, and diagram rendering
 */

// ============================================================================
// LANGUAGE & FONT CONFIGURATION
// ============================================================================

const LANGUAGE_FONTS = {
  // RTL Languages (Right-to-Left)
  persian: {
    name: 'Vazir',
    path: 'fonts/Vazir.ttf',
    direction: 'rtl',
    aliases: ['fa', 'farsi']
  },
  arabic: {
    name: 'Arabic',
    path: 'fonts/Arabic.ttf',
    direction: 'rtl',
    aliases: ['ar']
  },
  hebrew: {
    name: 'Hebrew',
    path: 'fonts/Hebrew.ttf',
    direction: 'rtl',
    aliases: ['he']
  },
  urdu: {
    name: 'Urdu',
    path: 'fonts/Urdu.ttf',
    direction: 'rtl',
    aliases: ['ur']
  },
  // LTR Languages (Left-to-Right) - using default fonts
  english: {
    name: 'Helvetica',
    path: null,
    direction: 'ltr',
    aliases: ['en', 'en-US', 'en-GB']
  },
  spanish: {
    name: 'Helvetica',
    path: null,
    direction: 'ltr',
    aliases: ['es', 'es-ES']
  },
  french: {
    name: 'Helvetica',
    path: null,
    direction: 'ltr',
    aliases: ['fr', 'fr-FR']
  },
  german: {
    name: 'Helvetica',
    path: null,
    direction: 'ltr',
    aliases: ['de', 'de-DE']
  },
  russian: {
    name: 'Helvetica',
    path: null,
    direction: 'ltr',
    aliases: ['ru', 'ru-RU']
  }
};

// RTL Language detection patterns
const RTL_CHAR_RANGES = {
  persian: /[\u06A9\u06AF\u06CC\u067E\u0686\u0698\u0600-\u06FF]/g,
  arabic: /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g,
  hebrew: /[\u0590-\u05FF\uFB1D-\uFB4F]/g,
  urdu: /[\u0600-\u06FF]/g
};

// ============================================================================
// HELPER FUNCTIONS - LANGUAGE DETECTION
// ============================================================================

/**
 * Detect the language and text direction from content
 * @param {string} text
 * @returns {{language: string, direction: string}}
 */
function detectLanguageAndDirection(text) {
  if (!text) return { language: 'english', direction: 'ltr' };

  const rtlCounts = {
    persian: (text.match(RTL_CHAR_RANGES.persian) || []).length,
    arabic: (text.match(RTL_CHAR_RANGES.arabic) || []).length,
    hebrew: (text.match(RTL_CHAR_RANGES.hebrew) || []).length
  };

  const ltrCount = (text.match(/[a-zA-Z\u00C0-\u024F]/g) || []).length;
  
  // Find dominant RTL language
  const maxRTL = Math.max(
    rtlCounts.persian,
    rtlCounts.arabic,
    rtlCounts.hebrew
  );

  if (maxRTL > ltrCount && maxRTL >= 10) {
    if (rtlCounts.persian >= maxRTL) {
      return { language: 'persian', direction: 'rtl' };
    } else if (rtlCounts.arabic >= maxRTL) {
      return { language: 'arabic', direction: 'rtl' };
    } else if (rtlCounts.hebrew >= maxRTL) {
      return { language: 'hebrew', direction: 'rtl' };
    }
  }

  return { language: 'english', direction: 'ltr' };
}

/**
 * Get font configuration for a language
 * @param {string} language
 * @returns {Object}
 */
function getFontConfig(language) {
  const lang = language.toLowerCase();
  
  // Direct match
  if (LANGUAGE_FONTS[lang]) {
    return LANGUAGE_FONTS[lang];
  }

  // Check aliases
  for (const [langKey, config] of Object.entries(LANGUAGE_FONTS)) {
    if (config.aliases.includes(lang)) {
      return config;
    }
  }

  // Default to English
  return LANGUAGE_FONTS.english;
}

/**
 * Reverse text for RTL display (handles mixed content)
 * @param {string} text
 * @param {string} direction
 * @returns {string}
 */
function handleTextDirection(text, direction) {
  if (direction === 'rtl') {
    // For pure RTL text, reverse it
    if (detectLanguageAndDirection(text).direction === 'rtl') {
      return text.split('').reverse().join('');
    }
  }
  return text;
}

// ============================================================================
// PDF EXPORT MAIN FUNCTIONS
// ============================================================================

/**
 * Main PDF download function with language detection
 */
async function downloadAsPDF() {
  const outputEl = document.getElementById('output');
  
  if (!outputEl || !outputEl.innerHTML.trim()) {
    alert('No content to export. Please render markdown first.');
    return;
  }

  // Detect language and direction from content
  const contentText = outputEl.innerText || outputEl.textContent;
  const { language, direction } = detectLanguageAndDirection(contentText);

  try {
    // Show loading state
    const btn = document.querySelector('.pdf-download-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '⏳ Generating PDF...';
    btn.disabled = true;

    console.log(`Detected Language: ${language}, Direction: ${direction}`);

    // Load required libraries
    await loadPDFLibraries();

    // Load fonts if needed
    const fontConfig = getFontConfig(language);
    if (fontConfig.path) {
      await loadFont(fontConfig);
    }

    // Perform export
    await performPDFExport(outputEl, btn, originalText, language, direction);

  } catch (error) {
    console.error('PDF Export Error:', error);
    const btn = document.querySelector('.pdf-download-btn');
    if (btn) {
      btn.innerHTML = '📥 Download as PDF';
      btn.disabled = false;
    }
    alert('Failed to export PDF: ' + error.message);
  }
}

/**
 * Load jsPDF and html2canvas libraries
 */
async function loadPDFLibraries() {
  if (!window.jspdf) {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
  }

  if (!window.html2canvas) {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
  }
}

/**
 * Load custom font for the document
 * @param {Object} fontConfig
 */
async function loadFont(fontConfig) {
  return new Promise(async (resolve, reject) => {
    try {
      const fontBase64 = await fetchFontAsBase64(fontConfig.path);
      registerFont(fontBase64, fontConfig.name);
      console.log(`${fontConfig.name} font loaded successfully`);
      resolve();
    } catch (error) {
      console.warn(`Failed to load ${fontConfig.name} font:`, error);
      resolve(); // Continue without custom font
    }
  });
}

/**
 * Fetch font file and convert to base64
 * @param {string} fontPath
 * @returns {Promise<string>}
 */
async function fetchFontAsBase64(fontPath) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', fontPath, true);
    xhr.responseType = 'arraybuffer';

    xhr.onload = function() {
      if (xhr.status === 200) {
        const fontBase64 = arrayBufferToBase64(xhr.response);
        resolve(fontBase64);
      } else {
        reject(new Error(`Font not found: ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error(`Network error loading font: ${fontPath}`));
    };

    xhr.send();
  });
}

/**
 * Register font with jsPDF
 * @param {string} fontBase64
 * @param {string} fontName
 */
function registerFont(fontBase64, fontName) {
  const { jsPDF } = window.jspdf;
  const callAddFont = function() {
    this.addFileToVFS(`${fontName}.ttf`, fontBase64);
    this.addFont(`${fontName}.ttf`, fontName, 'normal');
  };
  jsPDF.API.events.push(['addFonts', callAddFont]);
}

/**
 * Convert ArrayBuffer to Base64 string
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Load script dynamically
 * @param {string} src
 * @returns {Promise}
 */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

// ============================================================================
// PDF GENERATION & RENDERING
// ============================================================================

/**
 * Main PDF export function
 * @param {Element} outputEl
 * @param {Element} btn
 * @param {string} originalText
 * @param {string} language
 * @param {string} direction
 */
async function performPDFExport(outputEl, btn, originalText, language, direction) {
  try {
    const { jsPDF } = window.jspdf;
    
    // Create PDF document with RTL settings
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
      lang: language === 'persian' ? 'fa-IR' : 'en-US'
    });

    // Set font
    const fontConfig = getFontConfig(language);
    doc.setFont(fontConfig.name, 'normal');

    // Page dimensions
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Margins - adjust for RTL
    const marginLeft = direction === 'rtl' ? 15 : 15;
    const marginRight = direction === 'rtl' ? 15 : 15;
    const maxWidth = pageWidth - marginLeft - marginRight;

    let yPosition = 15;
    const lineHeight = 7;
    const smallLineHeight = 5;

    // Font sizes
    const fontSize = {
      h1: 20,
      h2: 16,
      h3: 14,
      h4: 12,
      h5: 11,
      body: 10,
      code: 9
    };

    // Helper: Check page break
    function checkPageBreak(requiredHeight) {
      if (yPosition + requiredHeight > pageHeight - 15) {
        doc.addPage();
        yPosition = 15;
        return true;
      }
      return false;
    }

    // Helper: Get clean text
    function getCleanText(element) {
      const temp = document.createElement('div');
      temp.innerHTML = element.innerHTML;
      let text = temp.textContent || temp.innerText || '';
      text = text.replace(/\s+/g, ' ').trim();
      return text;
    }

    // Helper: Add wrapped text with direction support
    function addWrappedText(text, size, fontStyle = 'normal', indent = 0) {
      if (!text || text.trim().length === 0) return;

      doc.setFontSize(size);
      doc.setFont(fontConfig.name, fontStyle);

      const xPos = direction === 'rtl' ? pageWidth - marginRight - indent : marginLeft + indent;
      const alignDirection = direction === 'rtl' ? 'right' : 'left';

      const lines = doc.splitTextToSize(text, maxWidth - indent);
      
      for (let i = 0; i < lines.length; i++) {
        checkPageBreak(lineHeight);
        doc.text(lines[i], xPos, yPosition, { align: alignDirection });
        yPosition += lineHeight;
      }
    }

    // Helper: Add code block as image
    async function addCodeBlock(codeElement) {
      checkPageBreak(30);
      try {
        const tempContainer = document.createElement('div');
        tempContainer.style.cssText = `
          position: absolute;
          left: -9999px;
          background: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 6px;
          padding: 12px;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.5;
          width: ${maxWidth * 3.78}px;
          direction: ${direction};
          unicode-bidi: embed;
        `;

        const codeClone = codeElement.cloneNode(true);
        const copyBtn = codeClone.querySelector('.copy-btn');
        if (copyBtn) copyBtn.remove();

        tempContainer.appendChild(codeClone);
        document.body.appendChild(tempContainer);

        const canvas = await html2canvas(tempContainer, {
          scale: 2,
          backgroundColor: '#f5f5f5',
          logging: false,
          letterRendering: true
        });

        document.body.removeChild(tempContainer);

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = maxWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        checkPageBreak(imgHeight);

        const xPos = direction === 'rtl' ? pageWidth - marginRight - imgWidth : marginLeft;
        doc.addImage(imgData, 'PNG', xPos, yPosition, imgWidth, imgHeight);

        yPosition += imgHeight + 5;

      } catch (error) {
        console.error('Error rendering code block:', error);
        const codeText = getCleanText(codeElement);
        addWrappedText(codeText, fontSize.code, 'normal', 5);
      }
    }

    // Helper: Add diagram/image
    async function addDiagram(element) {
      checkPageBreak(50);
      try {
        const canvas = await html2canvas(element, {
          scale: 2,
          backgroundColor: '#ffffff',
          logging: false,
          letterRendering: true
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = maxWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let finalHeight = imgHeight;
        let finalWidth = imgWidth;
        const maxImageHeight = pageHeight - 15 - yPosition - 10;

        if (imgHeight > maxImageHeight) {
          finalHeight = maxImageHeight;
          finalWidth = (canvas.width * finalHeight) / canvas.height;
        }

        checkPageBreak(finalHeight);

        const xPos = direction === 'rtl' ? pageWidth - marginRight - finalWidth : marginLeft;
        doc.addImage(imgData, 'PNG', xPos, yPosition, finalWidth, finalHeight);

        yPosition += finalHeight + 5;

      } catch (error) {
        console.error('Error rendering diagram:', error);
        addWrappedText('[Diagram]', fontSize.body, 'normal');
      }
    }

    // Process content elements
    const children = Array.from(outputEl.children);

    for (const element of children) {
      const tagName = element.tagName.toLowerCase();

      // Skip controls and buttons
      if (
        element.classList.contains('copy-btn') ||
        element.classList.contains('mermaid-controls')
      ) {
        continue;
      }

      // Headings
      if (tagName.match(/^h[1-6]$/)) {
        const level = parseInt(tagName[1]);
        checkPageBreak(15);
        yPosition += 3;

        const text = getCleanText(element);
        const size = fontSize[`h${level}`] || fontSize.body;

        doc.setFontSize(size);
        doc.setFont(fontConfig.name, 'normal');

        const xPos = direction === 'rtl' ? pageWidth - marginRight : marginLeft;
        const alignDirection = direction === 'rtl' ? 'right' : 'left';

        const lines = doc.splitTextToSize(text, maxWidth);
        for (const line of lines) {
          checkPageBreak(lineHeight * 1.5);
          doc.text(line, xPos, yPosition, { align: alignDirection });
          yPosition += lineHeight * 1.3;
        }

        yPosition += 2;
        continue;
      }

      // Paragraphs
      if (tagName === 'p') {
        const text = getCleanText(element);
        addWrappedText(text, fontSize.body);
        yPosition += 2;
        continue;
      }

      // Lists
      if (tagName === 'ul' || tagName === 'ol') {
        const items = element.querySelectorAll('li');
        items.forEach((item, index) => {
          const bullet = tagName === 'ul' ? '•' : `${index + 1}.`;
          const text = `${bullet} ${getCleanText(item)}`;
          addWrappedText(text, fontSize.body, 'normal', 5);
        });
        yPosition += 3;
        continue;
      }

      // Code blocks
      if (tagName === 'pre') {
        await addCodeBlock(element);
        continue;
      }

      // Blockquotes
      if (tagName === 'blockquote') {
        checkPageBreak(15);

        doc.setDrawColor(99, 102, 241);
        doc.setLineWidth(1);

        const lineXStart = direction === 'rtl' ? pageWidth - marginRight - 5 : marginLeft;
        doc.line(lineXStart, yPosition, lineXStart, yPosition + 10);

        const text = getCleanText(element);
        doc.setFontSize(fontSize.body);
        doc.setFont(fontConfig.name, 'normal');

        const xPos = direction === 'rtl' 
          ? pageWidth - marginRight - maxWidth + 10 
          : marginLeft + 5;
        const alignDirection = direction === 'rtl' ? 'right' : 'left';

        const lines = doc.splitTextToSize(text, maxWidth - 10);
        for (const line of lines) {
          checkPageBreak(lineHeight);
          doc.text(line, xPos, yPosition, { align: alignDirection });
          yPosition += lineHeight;
        }

        yPosition += 3;
        continue;
      }

      // Tables
      if (tagName === 'table') {
        checkPageBreak(30);

        const headers = Array.from(element.querySelectorAll('th')).map(th =>
          getCleanText(th)
        );
        const rows = Array.from(element.querySelectorAll('tr'))
          .slice(1)
          .map(tr => Array.from(tr.querySelectorAll('td')).map(td => getCleanText(td)));

        if (headers.length > 0) {
          doc.setFontSize(fontSize.body);
          doc.setFont(fontConfig.name, 'normal');

          const colWidth = maxWidth / headers.length;

          // Draw header
          doc.setFillColor(99, 102, 241);
          doc.setTextColor(255, 255, 255);

          const headerXStart = direction === 'rtl' 
            ? pageWidth - marginRight - maxWidth 
            : marginLeft;

          doc.rect(headerXStart, yPosition, maxWidth, 8, 'F');

          headers.forEach((header, i) => {
            const cellXPos = direction === 'rtl'
              ? headerXStart + maxWidth - (i * colWidth) - colWidth + 2
              : headerXStart + (i * colWidth) + 2;

            doc.text(header, cellXPos, yPosition + 5, {
              align: direction === 'rtl' ? 'right' : 'left'
            });
          });

          yPosition += 8;
          doc.setTextColor(0, 0, 0);
          doc.setFont(fontConfig.name, 'normal');

          // Draw rows
          rows.forEach((row, rowIndex) => {
            checkPageBreak(8);

            if (rowIndex % 2 === 0) {
              doc.setFillColor(249, 249, 249);
              doc.rect(headerXStart, yPosition, maxWidth, 7, 'F');
            }

            row.forEach((cell, i) => {
              const cellText = doc.splitTextToSize(cell, colWidth - 4);
              const cellXPos = direction === 'rtl'
                ? headerXStart + maxWidth - (i * colWidth) - colWidth + 2
                : headerXStart + (i * colWidth) + 2;

              doc.text(cellText[0] || '', cellXPos, yPosition + 5, {
                align: direction === 'rtl' ? 'right' : 'left'
              });
            });

            yPosition += 7;
          });

          yPosition += 5;
        }

        continue;
      }

      // Horizontal rules
      if (tagName === 'hr') {
        checkPageBreak(5);
        doc.setDrawColor(99, 102, 241);
        doc.setLineWidth(0.5);
        const hrXStart = direction === 'rtl' 
          ? pageWidth - marginRight - maxWidth 
          : marginLeft;
        doc.line(hrXStart, yPosition, hrXStart + maxWidth, yPosition);
        yPosition += 5;
        continue;
      }

      // Mermaid diagrams
      if (
        element.classList.contains('mermaid-wrapper') ||
        element.querySelector('.mermaid') ||
        element.querySelector('svg')
      ) {
        await addDiagram(element);
        continue;
      }

      // Images
      if (tagName === 'img') {
        checkPageBreak(50);
        try {
          const imgData = element.src;
          const imgWidth = maxWidth;
          const aspectRatio = element.naturalHeight / element.naturalWidth;
          const imgHeight = imgWidth * aspectRatio;

          checkPageBreak(imgHeight);

          const imgXPos = direction === 'rtl' 
            ? pageWidth - marginRight - imgWidth 
            : marginLeft;

          doc.addImage(imgData, 'JPEG', imgXPos, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 5;

        } catch (error) {
          console.error('Error adding image:', error);
        }

        continue;
      }

      // Default: extract text
      const text = getCleanText(element);
      if (text && text.trim()) {
        addWrappedText(text, fontSize.body);
        yPosition += 2;
      }
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const langSuffix = language !== 'english' ? `-${language}` : '';
    const filename = `markdown-export${langSuffix}-${timestamp}.pdf`;

    // Save the PDF
    doc.save(filename);

    // Reset button state
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }, 500);

    console.log(`PDF exported successfully as ${filename}`);

  } catch (error) {
    console.error('PDF Export Error:', error);
    btn.innerHTML = originalText;
    btn.disabled = false;
    throw error;
  }
}

// ============================================================================
// EXPORT
// ============================================================================

// Make functions globally available
window.downloadAsPDF = downloadAsPDF;
window.detectLanguageAndDirection = detectLanguageAndDirection;
window.getFontConfig = getFontConfig;

// Log that the module is loaded
console.log('Enhanced PDF Export module with RTL/LTR multi-language support loaded successfully');
