/**
 * Mermaid Controls Module
 * Handles zoom, pan, and drag functionality for mermaid diagrams
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

// Repeatable button functionality
let repeatIntervals = {};

window.startRepeat = function(fn, id, delay = 150) {
    fn();
    if (repeatIntervals[id]) {
        clearInterval(repeatIntervals[id]);
    }
    repeatIntervals[id] = setInterval(fn, delay);
};

window.stopRepeat = function(id) {
    if (repeatIntervals[id]) {
        clearInterval(repeatIntervals[id]);
        delete repeatIntervals[id];
    }
};

// Draggable functionality for mermaid viewports
window.initializeDragging = function(index) {
    const contentEl = document.getElementById(`mermaid-content-${index}`);
    if (!contentEl) {
        console.warn(`Cannot find mermaid-content-${index}`);
        return;
    }
    
    const viewport = contentEl.parentElement;
    const id = `mermaid-${index}`;
    
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialTranslateX = 0;
    let initialTranslateY = 0;

    const onMouseDown = (e) => {
        if (e.target.closest('.mermaid-controls')) return;
        
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        
        const state = getMermaidState(id);
        initialTranslateX = state.translateX;
        initialTranslateY = state.translateY;
        
        viewport.style.cursor = 'grabbing';
        e.preventDefault();
    };

    const onMouseMove = (e) => {
        if (!isDragging) return;
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        const state = getMermaidState(id);
        state.translateX = initialTranslateX + deltaX;
        state.translateY = initialTranslateY + deltaY;
        
        applyTransform(id);
    };

    const onMouseUp = () => {
        if (isDragging) {
            isDragging = false;
            viewport.style.cursor = 'grab';
        }
    };

    viewport.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    viewport.style.cursor = 'grab';
};

window.zoomMermaid = zoomMermaid;
window.panMermaid = panMermaid;
window.resetMermaid = resetMermaid;
