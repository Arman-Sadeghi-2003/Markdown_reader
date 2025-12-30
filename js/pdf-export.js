/**
 * PDF Export Module
 * Handles downloading rendered markdown output as PDF
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
        btn.innerHTML = ' Generating PDF...';
        btn.disabled = true;

        // Load html2pdf library if not already loaded
        if (!window.html2pdf) {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
            script.onload = () => {
                performPDFExport(outputEl, btn, originalText);
            };
            document.head.appendChild(script);
        } else {
            performPDFExport(outputEl, btn, originalText);
        }
    } catch (error) {
        console.error('PDF Export Error:', error);
        alert('Failed to export PDF. Please try again.');
    }
}

function performPDFExport(outputEl, btn, originalText) {
    // Create a clone for PDF (without interactive elements)
    const clonedContent = outputEl.cloneNode(true);

    // Remove copy buttons from code blocks
    clonedContent.querySelectorAll('.copy-btn').forEach(btn => btn.remove());

    // Remove mermaid controls
    clonedContent.querySelectorAll('.mermaid-controls').forEach(ctrl => ctrl.remove());

    const options = {
        margin: [15, 15, 15, 15],
        filename: `markdown-export-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2,
            useCORS: true,
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg').trim() || '#ffffff'
        },
        jsPDF: { 
            orientation: 'portrait', 
            unit: 'mm', 
            format: 'a4',
            compress: true
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    // Generate and download PDF
    html2pdf()
        .set(options)
        .from(clonedContent)
        .save()
        .finally(() => {
            // Reset button
            btn.innerHTML = originalText;
            btn.disabled = false;
        });
}

// Make function globally available
window.downloadAsPDF = downloadAsPDF;
