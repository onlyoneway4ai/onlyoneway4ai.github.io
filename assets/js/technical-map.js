(() => {
  const map = document.querySelector('.technical-map');
  if (!map) return;
  const canvas = map.querySelector('.ability-canvas');
  const toolbar = map.querySelector('.ability-toolbar');
  const percentage = toolbar.querySelector('[role="status"]');
  const source = map.querySelector('.ability-source');
  const categories = [...source.querySelectorAll('.technical-map-category')].map(el => ({
    name: el.querySelector('h2').textContent.trim(),
    tags: [...el.querySelectorAll('.ability-tag')].map(tag => tag.textContent.trim())
  }));
  const ns = 'http://www.w3.org/2000/svg';
  function element(tag, attrs = {}, text) {
    const el = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    if (text !== undefined) el.textContent = text;
    return el;
  }
  const icons = {
    out: 'M5 12h14', in: 'M5 12h14M12 5v14',
    fit: 'M4 4v16M20 4v16M7 12h10M10 9l-3 3 3 3M14 9l3 3-3 3',
    reset: 'M3 10a9 9 0 1 1 2.6 8.4M3 4v6h6'
  };
  toolbar.querySelectorAll('button').forEach(button => {
    const icon = element('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false' });
    icon.append(element('path', { d: icons[button.dataset.mapAction] }));
    button.append(icon);
  });
  const svg = element('svg', { role: 'img', 'aria-label': '个人能力：' + categories.map(c => c.name + '，' + c.tags.join('、')).join('；') });
  const scene = element('g');
  const edges = element('g');
  const nodes = element('g');
  scene.append(edges, nodes);
  svg.append(scene);
  canvas.append(svg);
  const measure = document.createElement('canvas').getContext('2d');
  function metrics(text, kind = '') {
    const root = kind === 'is-root';
    const category = kind === 'is-category';
    measure.font = root ? '600 18px system-ui, sans-serif' : category ? '600 15px system-ui, sans-serif' : '14px system-ui, sans-serif';
    return {
      width: Math.max(root ? 154 : category ? 132 : 100, measure.measureText(text).width + (root ? 48 : category ? 40 : 32)),
      height: root ? 60 : category ? 50 : 36,
      radius: root ? 16 : category ? 12 : 9
    };
  }
  function node(text, x, y, color, kind = '') {
    const { width, height, radius } = metrics(text, kind);
    const group = element('g', { class: 'ability-node ' + kind, transform: 'translate(' + x + ' ' + y + ')' });
    group.style.setProperty('--branch-color', color);
    group.append(element('rect', { x: -width / 2, y: -height / 2, width, height, rx: radius }));
    group.append(element('text', { 'text-anchor': 'middle', 'dominant-baseline': 'central' }, text));
    nodes.append(group);
    return { x, y, width, kind };
  }
  function edge(a, b, color, direction) {
    const x1 = a.x + direction * a.width / 2;
    const x2 = b.x - direction * b.width / 2;
    const middle = (x1 + x2) / 2;
    const path = element('path', { class: 'ability-edge' + (a.kind === 'is-root' ? ' is-primary' : ''), d: 'M' + x1 + ',' + a.y + ' C' + middle + ',' + a.y + ' ' + middle + ',' + b.y + ' ' + x2 + ',' + b.y });
    path.style.setProperty('--branch-color', color);
    edges.append(path);
  }
  const root = node('个人能力', 0, 0, '#7489bf', 'is-root');
  const colors = ['#628aca', '#36a695', '#ae82c8', '#c38c53', '#c57891', '#7a9c57'];
  const sides = [[], []];
  const heights = [0, 0];
  categories.forEach((category, index) => {
    const side = heights[0] <= heights[1] ? 0 : 1;
    const height = Math.max(1, category.tags.length) * 62 + 34;
    sides[side].push({ ...category, height, color: colors[index % colors.length] });
    heights[side] += height;
  });
  sides.forEach((items, side) => {
    const direction = side === 0 ? 1 : -1;
    let top = -heights[side] / 2;
    items.forEach(category => {
      const y = top + category.height / 2;
      const branch = node(category.name, direction * 245, y, category.color, 'is-category');
      edge(root, branch, category.color, direction);
      category.tags.forEach((tag, index) => {
        const tagWidth = metrics(tag).width;
        const x = branch.x + direction * (branch.width / 2 + 85 + tagWidth / 2);
        const leaf = node(tag, x, y + (index - (category.tags.length - 1) / 2) * 62, category.color);
        edge(branch, leaf, category.color, direction);
      });
      top += category.height;
    });
  });
  source.hidden = true;
  canvas.hidden = false;
  map.querySelector('.ability-toolbar').hidden = false;
  let scale = 1, tx = 0, ty = 0, drag = null;
  const bounds = scene.getBBox();
  function render() {
    scene.setAttribute('transform', 'translate(' + tx + ' ' + ty + ') scale(' + scale + ')');
    const label = Math.round(scale * 100) + '%';
    if (percentage.textContent !== label) percentage.textContent = label;
  }
  function fit() {
    scale = Math.min(1.2, (canvas.clientWidth - 48) / bounds.width, (canvas.clientHeight - 48) / bounds.height);
    tx = canvas.clientWidth / 2 - (bounds.x + bounds.width / 2) * scale;
    ty = canvas.clientHeight / 2 - (bounds.y + bounds.height / 2) * scale;
    render();
  }
  function zoom(factor) {
    const next = Math.max(.15, Math.min(3, scale * factor));
    const x = canvas.clientWidth / 2, y = canvas.clientHeight / 2;
    tx = x - (x - tx) * next / scale;
    ty = y - (y - ty) * next / scale;
    scale = next;
    render();
  }
  map.querySelector('.ability-toolbar').addEventListener('click', event => {
    const action = event.target.closest('button')?.dataset.mapAction;
    if (action === 'fit') fit();
    if (action === 'in') zoom(1.25);
    if (action === 'out') zoom(.8);
    if (action === 'reset') {
      scale = 1;
      tx = canvas.clientWidth / 2 - (bounds.x + bounds.width / 2);
      ty = canvas.clientHeight / 2 - (bounds.y + bounds.height / 2);
      render();
    }
  });
  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0 || drag) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add('is-dragging');
  });
  canvas.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    tx += event.clientX - drag.x; ty += event.clientY - drag.y;
    drag.x = event.clientX; drag.y = event.clientY;
    render();
  });
  function stop() { drag = null; canvas.classList.remove('is-dragging'); }
  canvas.addEventListener('lostpointercapture', stop);
  canvas.addEventListener('pointerup', stop);
  canvas.addEventListener('pointercancel', stop);
  canvas.addEventListener('keydown', event => {
    const shifts = { ArrowLeft: [30, 0], ArrowRight: [-30, 0], ArrowUp: [0, 30], ArrowDown: [0, -30] };
    if (shifts[event.key]) { event.preventDefault(); tx += shifts[event.key][0]; ty += shifts[event.key][1]; render(); }
    else if (['+', '=', '-'].includes(event.key)) { event.preventDefault(); zoom(event.key === '-' ? .8 : 1.25); }
    else if (event.key === 'Home') { event.preventDefault(); fit(); }
  });
  new ResizeObserver(fit).observe(canvas);
  fit();
})();
