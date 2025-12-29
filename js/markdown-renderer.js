/**
 * Markdown Renderer Module
 * Handles rendering markdown content and Mermaid diagrams
 */

function renderOutput() {
  const inputText = document.getElementById('inputArea').value.trim();
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
    // Render markdown
    outputEl.innerHTML = marked.parse(inputText);

    // Find Mermaid blocks: ```
    const mermaidBlocks = outputEl.querySelectorAll('pre code.language-mermaid, code.language-mermaid');
    const mermaidContainers = [];

    mermaidBlocks.forEach((block, index) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'mermaid-wrapper';

      const controls = document.createElement('div');
      controls.className = 'mermaid-controls';
      controls.innerHTML = `
        <button type="button" title="Zoom in" onclick="zoomMermaid('mermaid-${index}','in')"><i class="fa-solid fa-magnifying-glass-plus"></i></button>
        <button type="button" title="Zoom out" onclick="zoomMermaid('mermaid-${index}','out')"><i class="fa-solid fa-magnifying-glass-minus"></i></button>
        <button type="button" title="Reset" onclick="resetMermaid('mermaid-${index}')"><i class="fa-solid fa-rotate-left"></i></button>
        <span class="divider" aria-hidden="true"></span>
        <button type="button" title="Pan up" onclick="panMermaid('mermaid-${index}','up')"><i class="fa-solid fa-arrow-up"></i></button>
        <button type="button" title="Pan down" onclick="panMermaid('mermaid-${index}','down')"><i class="fa-solid fa-arrow-down"></i></button>
        <button type="button" title="Pan left" onclick="panMermaid('mermaid-${index}','left')"><i class="fa-solid fa-arrow-left"></i></button>
        <button type="button" title="Pan right" onclick="panMermaid('mermaid-${index}','right')"><i class="fa-solid fa-arrow-right"></i></button>
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
      mermaid.run({ nodes: mermaidContainers });
    }

    // Add copy buttons to remaining code blocks
    outputEl.querySelectorAll('pre').forEach(pre => addCopyButtonsTo(pre));

    // Small visual feedback
    outputEl.style.opacity = '0';
    setTimeout(() => {
      outputEl.style.transition = 'opacity 0.22s ease';
      outputEl.style.opacity = '1';
    }, 10);
  } catch (error) {
    outputEl.innerHTML = `**Rendering Error:** ${error.message}`;
  }
}

window.renderOutput = renderOutput;
