/**
 * Markdown Renderer Module
 * Handles rendering markdown content and Mermaid diagrams
 */

/**
 * Current markdown source. #inputArea is the hidden textarea the shell writes into;
 * it is empty until a file is opened, so callers must tolerate "no document yet".
 * @returns {string}
 */
function getMarkdownSource() {
    return document.getElementById('inputArea')?.value ?? '';
}

/**
 * Sanitizes rendered markup before it reaches innerHTML.
 *
 * Markdown files are untrusted input — marked passes raw HTML straight through, so a
 * <script> or an onerror handler in a .md file would otherwise execute with this
 * page's origin. DOMPurify's defaults drop script/iframe/object, event-handler
 * attributes and javascript: URLs while keeping ordinary formatting HTML.
 *
 * Fails closed: if the library is missing, the markup is escaped rather than injected.
 * @param {string} html
 * @returns {string}
 */
function sanitizeMarkup(html) {
    if (typeof DOMPurify === 'undefined' || typeof DOMPurify.sanitize !== 'function') {
        console.error('DOMPurify is unavailable — rendering escaped source instead');
        return escapeHtml(html);
    }
    return DOMPurify.sanitize(html);
}

/**
 * Escapes a string for safe insertion into innerHTML.
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
    const holder = document.createElement('div');
    holder.textContent = String(text);
    return holder.innerHTML;
}

function renderOutput() {
    const inputText = getMarkdownSource().trim();
    const outputEl = document.getElementById('output');
    const langIndicator = document.getElementById('langIndicator');

    if (!inputText) {
        outputEl.innerHTML = 'Enter some text above to see the rendered output...';
        return;
    }

    // Auto-detect direction if enabled
    if (autoDetectEnabled) {
        const detectedDir = detectTextDirection(inputText);
        const detectedLang = getDetectedLanguage(inputText);
        outputEl.className = detectedDir;
        langIndicator.textContent = `Language: ${detectedLang} (Auto: ${detectedDir.toUpperCase()})`;
    } else {
        outputEl.className = currentDirection;
    }

    try {
        // Render markdown — always through the sanitizer, never raw
        outputEl.innerHTML = sanitizeMarkup(marked.parse(inputText));

        outputEl.querySelectorAll('table').forEach(table => {
            if (table.parentElement && table.parentElement.classList.contains('table-wrap')) return;

            const wrap = document.createElement('div');
            wrap.className = 'table-wrap';
            table.parentNode.insertBefore(wrap, table);
            wrap.appendChild(table);
        });

        // Find Mermaid blocks
        const mermaidBlocks = outputEl.querySelectorAll('pre code.language-mermaid, code.language-mermaid');
        const mermaidContainers = [];

        mermaidBlocks.forEach((block, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'mermaid-wrapper';

            const controls = document.createElement('div');
            controls.className = 'mermaid-controls mermaid-actions';
            controls.innerHTML = `
                <button onmousedown="startRepeat(() => zoomMermaid('mermaid-${index}', 'in'), 'zoom-in-${index}')"
                        onmouseup="stopRepeat('zoom-in-${index}')"
                        onmouseleave="stopRepeat('zoom-in-${index}')"
                        title="Zoom In">🔍+</button>
                <button onmousedown="startRepeat(() => zoomMermaid('mermaid-${index}', 'out'), 'zoom-out-${index}')"
                        onmouseup="stopRepeat('zoom-out-${index}')"
                        onmouseleave="stopRepeat('zoom-out-${index}')"
                        title="Zoom Out">🔍−</button>
                <button onmousedown="startRepeat(() => panMermaid('mermaid-${index}', 'up'), 'pan-up-${index}')"
                        onmouseup="stopRepeat('pan-up-${index}')"
                        onmouseleave="stopRepeat('pan-up-${index}')"
                        title="Pan Up">⬆️</button>
                <button onmousedown="startRepeat(() => panMermaid('mermaid-${index}', 'down'), 'pan-down-${index}')"
                        onmouseup="stopRepeat('pan-down-${index}')"
                        onmouseleave="stopRepeat('pan-down-${index}')"
                        title="Pan Down">⬇️</button>
                <button onmousedown="startRepeat(() => panMermaid('mermaid-${index}', 'left'), 'pan-left-${index}')"
                        onmouseup="stopRepeat('pan-left-${index}')"
                        onmouseleave="stopRepeat('pan-left-${index}')"
                        title="Pan Left">⬅️</button>
                <button onmousedown="startRepeat(() => panMermaid('mermaid-${index}', 'right'), 'pan-right-${index}')"
                        onmouseup="stopRepeat('pan-right-${index}')"
                        onmouseleave="stopRepeat('pan-right-${index}')"
                        title="Pan Right">➡️</button>
                <button onclick="resetMermaid('mermaid-${index}')" title="Reset View">🔄</button>
            `;

            const viewport = document.createElement('div');
            viewport.className = 'mermaid-viewport';

            const content = document.createElement('div');
            content.className = 'mermaid-content';
            content.id = `mermaid-content-${index}`;

            const container = document.createElement('div');
            container.className = 'mermaid';
            container.id = `mermaid-${index}`;
            container.textContent = block.textContent;

            content.appendChild(container);
            viewport.appendChild(content);
            wrapper.appendChild(controls);
            wrapper.appendChild(viewport);

            const pre = block.closest('pre');
            if (pre) pre.replaceWith(wrapper);
            else block.replaceWith(wrapper);

            mermaidContainers.push(container);
        });

        // Render Mermaid diagrams after DOM update
        if (mermaidContainers.length > 0) {
            mermaid.run({ nodes: mermaidContainers }).then(() => {
                // Initialize dragging after mermaid rendering is complete
                mermaidContainers.forEach((container, index) => {
                    setTimeout(() => {
                        if (typeof window.initializeDragging === 'function') {
                            window.initializeDragging(index);
                        }
                    }, 100);
                });
            });
        }

        // Add copy buttons to remaining code blocks
        outputEl.querySelectorAll('pre').forEach(pre => addCopyButtonsTo(pre));

        // Visual feedback
        outputEl.style.opacity = '0';
        setTimeout(() => {
            outputEl.style.transition = 'opacity 0.22s ease';
            outputEl.style.opacity = '1';
        }, 10);
    } catch (error) {
        outputEl.innerHTML = `<strong>Rendering error:</strong> ${escapeHtml(error.message)}`;
    }
}

window.renderOutput = renderOutput;
window.getMarkdownSource = getMarkdownSource;
window.sanitizeMarkup = sanitizeMarkup;
