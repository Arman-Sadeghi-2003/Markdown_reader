/**
 * PDF Export Module - Improved with Better Text Rendering
 * Uses jsPDF with HTML parsing for cleaner, readable PDF output
 * Avoids image-based rendering for better text quality
 */

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
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating PDF...';
        btn.disabled = true;

        // Load required libraries
        await loadPDFLibraries();
        
        // Perform export with better rendering
        await performPDFExport(outputEl, btn, originalText);
        
    } catch (error) {
        console.error('PDF Export Error:', error);
        const btn = document.querySelector('.pdf-download-btn');
        if (btn) {
            btn.innerHTML = '<i class="fas fa-file-pdf"></i> Download as PDF';
            btn.disabled = false;
        }
        alert('Failed to export PDF: ' + error.message);
    }
}

async function loadPDFLibraries() {
    // Load jsPDF if not already loaded
    if (!window.jspdf) {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    }
    
    // Load html2canvas as fallback for complex elements (diagrams, images)
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

async function performPDFExport(outputEl, btn, originalText) {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true
        });

        // Page dimensions
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        const maxWidth = pageWidth - (2 * margin);
        let yPosition = margin;
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

        // Helper function to check if we need a new page
        function checkPageBreak(requiredHeight) {
            if (yPosition + requiredHeight > pageHeight - margin) {
                doc.addPage();
                yPosition = margin;
                return true;
            }
            return false;
        }

        // Helper function to properly extract text from HTML element
        function getCleanText(element) {
            // Create a temporary div to decode HTML entities
            const temp = document.createElement('div');
            temp.innerHTML = element.innerHTML;
            
            // Get text content and clean it
            let text = temp.textContent || temp.innerText || '';
            
            // Remove extra whitespace and normalize
            text = text.replace(/\s+/g, ' ').trim();
            
            // Decode common HTML entities
            text = text.replace(/&amp;/g, '&')
                       .replace(/&lt;/g, '<')
                       .replace(/&gt;/g, '>')
                       .replace(/&quot;/g, '"')
                       .replace(/&#39;/g, "'")
                       .replace(/&nbsp;/g, ' ');
            
            return text;
        }

        // Helper function to add text with wrapping
        function addWrappedText(text, fontSize, fontStyle = 'normal', indent = 0) {
            if (!text || text.trim().length === 0) return;
            
            doc.setFontSize(fontSize);
            doc.setFont('helvetica', fontStyle);
            
            const lines = doc.splitTextToSize(text, maxWidth - indent);
            
            for (let i = 0; i < lines.length; i++) {
                checkPageBreak(lineHeight);
                doc.text(lines[i], margin + indent, yPosition);
                yPosition += lineHeight;
            }
        }

        // Helper function to process code blocks as images for better formatting
        async function addCodeBlock(codeElement) {
            checkPageBreak(30); // Minimum space needed
            
            try {
                // Create a temporary container with styling
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
                // Remove copy button if exists
                const copyBtn = codeClone.querySelector('.copy-btn');
                if (copyBtn) copyBtn.remove();
                
                tempContainer.appendChild(codeClone);
                document.body.appendChild(tempContainer);

                // Render to canvas
                const canvas = await html2canvas(tempContainer, {
                    scale: 2,
                    backgroundColor: '#f5f5f5',
                    logging: false
                });

                document.body.removeChild(tempContainer);

                // Add to PDF
                const imgData = canvas.toDataURL('image/png');
                const imgWidth = maxWidth;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                
                checkPageBreak(imgHeight);
                doc.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
                yPosition += imgHeight + 5;
                
            } catch (error) {
                console.error('Error rendering code block:', error);
                // Fallback to text
                const codeText = getCleanText(codeElement);
                addWrappedText(codeText, fontSize.code, 'normal', 5);
            }
        }

        // Helper function to add diagrams/images
        async function addDiagram(element) {
            checkPageBreak(50);
            
            try {
                const canvas = await html2canvas(element, {
                    scale: 2,
                    backgroundColor: '#ffffff',
                    logging: false
                });

                const imgData = canvas.toDataURL('image/png');
                const imgWidth = maxWidth;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                
                // Check if image fits, if not scale it down
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
                addWrappedText('[Diagram]', fontSize.body, 'italic');
            }
        }

        // Process each child element
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
                yPosition += 3; // Extra space before heading
                
                const text = getCleanText(element);
                const size = fontSize[`h${level}`] || fontSize.body;
                doc.setFontSize(size);
                doc.setFont('helvetica', 'bold');
                
                const lines = doc.splitTextToSize(text, maxWidth);
                for (const line of lines) {
                    checkPageBreak(lineHeight * 1.5);
                    doc.text(line, margin, yPosition);
                    yPosition += lineHeight * 1.3;
                }
                
                yPosition += 2; // Extra space after heading
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
                doc.setFont('helvetica', 'italic');
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
                
                // Extract table data
                const headers = Array.from(element.querySelectorAll('th')).map(th => getCleanText(th));
                const rows = Array.from(element.querySelectorAll('tr')).slice(1).map(tr => 
                    Array.from(tr.querySelectorAll('td')).map(td => getCleanText(td))
                );

                if (headers.length > 0) {
                    // Draw table manually for better control
                    doc.setFontSize(fontSize.body);
                    doc.setFont('helvetica', 'bold');
                    
                    // Calculate column widths
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
                    doc.setFont('helvetica', 'normal');
                    
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

            // Default: try to extract text
            const text = getCleanText(element);
            if (text && text.trim()) {
                addWrappedText(text, fontSize.body);
                yPosition += 2;
            }
        }

        // Generate timestamp for filename
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `markdown-export-${timestamp}.pdf`;

        // Save the PDF
        doc.save(filename);

        // Reset button state
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }, 500);

    } catch (error) {
        console.error('PDF Export Error:', error);
        btn.innerHTML = originalText;
        btn.disabled = false;
        throw error;
    }
}

// Make function globally available
window.downloadAsPDF = downloadAsPDF;

// Log that the module is loaded
console.log('Improved PDF Export module loaded successfully');
