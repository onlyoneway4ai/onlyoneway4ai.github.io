(() => {
  const content = document.querySelector('.content');
  if (!content) return;
  const diagrams = new WeakMap();

  function addControls(container) {
    const state = { scale: 1, svg: null, width: 0 };
    const controls = document.createElement('div');
    controls.className = 'mermaid-controls';
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', '图表缩放');
    const percentage = document.createElement('span');
    percentage.setAttribute('role', 'status');
    percentage.setAttribute('aria-live', 'polite');

    state.apply = () => {
      state.svg.style.setProperty('--mermaid-natural-width', `${state.width * state.scale}px`);
      percentage.textContent = `${Math.round(state.scale * 100)}%`;
    };
    const actions = [
      ['缩小', 'M5 12h14', () => state.scale / 1.25],
      ['放大', 'M5 12h14M12 5v14', () => state.scale * 1.25],
      ['适应宽度', 'M4 4v16M20 4v16M7 12h10M10 9l-3 3 3 3M14 9l3 3-3 3', () => Math.min(1, container.clientWidth / state.width)],
      ['重置', 'M3 10a9 9 0 1 1 2.6 8.4M3 4v6h6', () => 1]
    ];
    for (const [label, path, scale] of actions) {
      if (label === '适应宽度') {
        const divider = document.createElement('span');
        divider.className = 'mermaid-controls-divider';
        divider.setAttribute('aria-hidden', 'true');
        controls.appendChild(divider);
      }
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', label);
      button.title = label;
      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      icon.setAttribute('viewBox', '0 0 24 24');
      icon.setAttribute('aria-hidden', 'true');
      icon.setAttribute('focusable', 'false');
      const shape = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      shape.setAttribute('d', path);
      icon.appendChild(shape);
      button.appendChild(icon);
      button.addEventListener('click', () => {
        state.scale = Math.min(3, Math.max(0.01, scale()));
        state.apply();
      });
      controls.appendChild(button);
      if (label === '缩小') controls.appendChild(percentage);
    }
    // Chirpy reads the source from the SVG container's previous sibling when
    // changing themes. Keep the hidden source and the diagram adjacent.
    const source = container.previousElementSibling;
    if (source?.classList.contains('d-none')) source.before(controls);
    else container.before(controls);
    let hideTimer;
    const setHover = (visible) => {
      clearTimeout(hideTimer);
      if (visible) controls.classList.add('is-hovered');
      else hideTimer = setTimeout(() => controls.classList.remove('is-hovered'), 150);
    };
    for (const region of [container, controls]) {
      region.addEventListener('pointerenter', () => setHover(true));
      region.addEventListener('pointerleave', (event) => {
        const next = event.relatedTarget;
        if (next instanceof Node && (container.contains(next) || controls.contains(next))) return;
        setHover(false);
      });
    }
    container.addEventListener('focus', () => {
      controls.classList.toggle('diagram-focused', container.matches(':focus-visible'));
    });
    container.addEventListener('blur', () => controls.classList.remove('diagram-focused'));
    diagrams.set(container, state);
    return state;
  }

  function sizeDiagrams() {
    content.querySelectorAll('.mermaid > svg').forEach((svg) => {
      // Mermaid's default width="100%" shrinks long diagrams. The viewBox
      // provides their natural size, independent of the article's width.
      const width = svg.viewBox.baseVal.width;
      if (!Number.isFinite(width) || width <= 0) return;

      const container = svg.parentElement;
      const state = diagrams.get(container) || addControls(container);
      if (state.svg === svg) return;
      state.svg = svg;
      state.width = width;
      state.apply();
      container.tabIndex = 0;
      container.setAttribute('role', 'region');
      container.setAttribute('aria-label', '图表，可横向滚动查看');
    });
  }

  // Rendering is asynchronous; Chirpy also replaces SVGs on theme changes.
  const observer = new MutationObserver(sizeDiagrams);
  observer.observe(content, { childList: true, subtree: true });
  sizeDiagrams();
})();
