/**
 * Mermaid Controls Module
 * Handles zoom and pan functionality for mermaid diagrams
 */

// Store transform state for each diagram
const mermaidStates = {};

function getMermaidState(id) {
  if (!mermaidStates[id]) {
    mermaidStates[id] = { scale: 1, translateX: 0, translateY: 0 };
  }
  return mermaidStates[id];
}

function applyTransform(id) {
  const state = getMermaidState(id);
  const index = id.replace('mermaid-', '');
  const content = document.getElementById(`mermaid-content-${index}`);
  if (!content) return;

  content.style.transform = `translate(${state.translateX}px, ${state.translateY}px) scale(${state.scale})`;
}

function zoomMermaid(id, direction) {
  const state = getMermaidState(id);
  const step = 0.12;

  if (direction === 'in') state.scale = Math.min(state.scale + step, 3);
  if (direction === 'out') state.scale = Math.max(state.scale - step, 0.35);

  applyTransform(id);
}

function panMermaid(id, direction) {
  const state = getMermaidState(id);
  const step = 50;

  switch (direction) {
    case 'up': state.translateY += step; break;
    case 'down': state.translateY -= step; break;
    case 'left': state.translateX += step; break;
    case 'right': state.translateX -= step; break;
    default: break;
  }

  applyTransform(id);
}

function resetMermaid(id) {
  mermaidStates[id] = { scale: 1, translateX: 0, translateY: 0 };
  applyTransform(id);
}

window.zoomMermaid = zoomMermaid;
window.panMermaid = panMermaid;
window.resetMermaid = resetMermaid;
