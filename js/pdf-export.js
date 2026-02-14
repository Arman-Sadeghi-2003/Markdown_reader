/**
 * PDF Export Module - Persian Support Only
 * Simplified version for Persian/English content with offline fonts
 */

// ============================================================================
// FONT CONFIGURATION
// ============================================================================

const PERSIAN_FONT = {
    name: 'Vazir',
    path: 'fonts/Vazir.ttf',
    fallback: 'Helvetica'
};

let persianFontLoaded = false;

// ============================================================================
// MAIN PDF EXPORT FUNCTION
// ============================================================================

async function downloadAsPDF() {
    const outputEl = document.getElementById('output');

    if (!outputEl || !outputEl.innerHTML.trim()) {
        alert('No content to export. Please render markdown first.');
        return;
    }

    try {
        // Show loading state
        const btn = document.querySelector('.pdf-download-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '⏳ Generating PDF...';
        btn.disabled = true;

        // Load required libraries
        await loadPDFLibraries();

        // Try to load Persian font
        await loadPersianFont();

        // Perform export
        await performPDFExport(outputEl, btn, originalText);

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

// ============================================================================
// LIBRARY LOADING
// ============================================================================

async function loadPDFLibraries() {
    // Load jsPDF
    if (!window.jspdf) {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    }

    // Load html2canvas for diagrams and code blocks
    if (!window.html2canvas) {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
    }
}

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
// PERSIAN FONT LOADING
// ============================================================================

async function loadPersianFont() {
    // Skip if already loaded
    if (persianFontLoaded) {
        console.log('Persian font already loaded');
        return;
    }

    try {
        console.log(`Loading Persian font from: ${PERSIAN_FONT.path}`);

        const fontBase64 = await fetchFontAsBase64(PERSIAN_FONT.path);
        registerPersianFont(fontBase64);
        persianFontLoaded = true;

        console.log('✓ Persian font (Vazir) loaded successfully');
    } catch (error) {
        console.warn('⚠ Could not load Persian font from:', PERSIAN_FONT.path);
        console.warn('Will use system font as fallback');
        console.warn('To fix: Place Vazir.ttf in the fonts/ folder');
        // Don't throw - will use fallback
    }
}

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
                reject(new Error(`Font not found: HTTP ${xhr.status}`));
            }
        };

        xhr.onerror = () => {
            reject(new Error(`Network error loading font`));
        };

        xhr.send();
    });
}

function registerPersianFont(fontBase64) {
    const { jsPDF } = window.jspdf;

    const callAddFont = function() {
        this.addFileToVFS('Vazir.ttf', fontBase64);
        this.addFont('Vazir.ttf', 'Vazir', 'normal');
    };

    jsPDF.API.events.push(['addFonts', callAddFont]);
}

function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;

    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }

    return btoa(binary);
}

// ============================================================================
// PDF GENERATION
// ============================================================================

async function performPDFExport(outputEl, btn, originalText) {
    try {
        const { jsPDF } = window.jspdf;

        // Use Vazir if loaded, otherwise Helvetica
        const fontToUse = persianFontLoaded ? PERSIAN_FONT.name : PERSIAN_FONT.fallback;
        console.log(`Using font: ${fontToUse}`);

        // Create PDF document
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true
        });

        // Set font
        doc.setFont(fontToUse, 'normal');

        // Page dimensions
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        const maxWidth = pageWidth - (2 * margin);
        let yPosition = margin;
        const lineHeight = 7;

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
            if (yPosition + requiredHeight > pageHeight - margin) {
                doc.addPage();
                yPosition = margin;
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

        // Helper: Add wrapped text
        function addWrappedText(text, size, fontStyle = 'normal', indent = 0) {
            if (!text || text.trim().length === 0) return;

            doc.setFontSize(size);
            doc.setFont(fontToUse, fontStyle);

            const lines = doc.splitTextToSize(text, maxWidth - indent);
            for (let i = 0; i < lines.length; i++) {
                checkPageBreak(lineHeight);
                doc.text(lines[i], margin + indent, yPosition);
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
                doc.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
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
                const maxImageHeight = pageHeight - margin - yPosition - 10;

                if (imgHeight > maxImageHeight) {
                    finalHeight = maxImageHeight;
                    finalWidth = (canvas.width * finalHeight) / canvas.height;
                }

                checkPageBreak(finalHeight);
                doc.addImage(imgData, 'PNG', margin, yPosition, finalWidth, finalHeight);
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
            if (element.classList.contains('copy-btn') ||
                element.classList.contains('mermaid-controls')) {
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
                doc.setFont(fontToUse, 'bold');

                const lines = doc.splitTextToSize(text, maxWidth);
                for (const line of lines) {
                    checkPageBreak(lineHeight * 1.5);
                    doc.text(line, margin, yPosition);
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
                doc.line(margin, yPosition, margin, yPosition + 10);

                const text = getCleanText(element);
                doc.setFontSize(fontSize.body);
                doc.setFont(fontToUse, 'normal');

                const lines = doc.splitTextToSize(text, maxWidth - 10);
                for (const line of lines) {
                    checkPageBreak(lineHeight);
                    doc.text(line, margin + 5, yPosition);
                    yPosition += lineHeight;
                }

                yPosition += 3;
                continue;
            }

            // Tables
            if (tagName === 'table') {
                checkPageBreak(30);

                const headers = Array.from(element.querySelectorAll('th')).map(th => getCleanText(th));
                const rows = Array.from(element.querySelectorAll('tr')).slice(1).map(tr =>
                    Array.from(tr.querySelectorAll('td')).map(td => getCleanText(td))
                );

                if (headers.length > 0) {
                    doc.setFontSize(fontSize.body);
                    doc.setFont(fontToUse, 'normal');

                    const colWidth = maxWidth / headers.length;

                    // Draw header
                    doc.setFillColor(99, 102, 241);
                    doc.setTextColor(255, 255, 255);
                    doc.rect(margin, yPosition, maxWidth, 8, 'F');

                    headers.forEach((header, i) => {
                        doc.text(header, margin + (i * colWidth) + 2, yPosition + 5);
                    });

                    yPosition += 8;
                    doc.setTextColor(0, 0, 0);
                    doc.setFont(fontToUse, 'normal');

                    // Draw rows
                    rows.forEach((row, rowIndex) => {
                        checkPageBreak(8);

                        if (rowIndex % 2 === 0) {
                            doc.setFillColor(249, 249, 249);
                            doc.rect(margin, yPosition, maxWidth, 7, 'F');
                        }

                        row.forEach((cell, i) => {
                            const cellText = doc.splitTextToSize(cell, colWidth - 4);
                            doc.text(cellText[0] || '', margin + (i * colWidth) + 2, yPosition + 5);
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
                doc.line(margin, yPosition, pageWidth - margin, yPosition);
                yPosition += 5;
                continue;
            }

            // Mermaid diagrams
            if (element.classList.contains('mermaid-wrapper') ||
                element.querySelector('.mermaid') ||
                element.querySelector('svg')) {
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
                    doc.addImage(imgData, 'JPEG', margin, yPosition, imgWidth, imgHeight);
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
        const filename = `markdown-export-${timestamp}.pdf`;

        // Save the PDF
        doc.save(filename);

        // Reset button state
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }, 500);

        console.log(`✓ PDF exported successfully: ${filename}`);

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

window.downloadAsPDF = downloadAsPDF;

console.log('PDF Export module (Persian support) loaded');
console.log('Persian font path: fonts/Vazir.ttf');