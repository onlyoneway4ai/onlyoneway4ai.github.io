(() => {
  const root = document.documentElement;
  const storageKey = 'blog-sidebar-collapsed';
  let collapsed = false;
  try {
    collapsed = localStorage.getItem(storageKey) === 'true';
  } catch (_) {
    // The toggle still works when browser storage is unavailable.
  }
  // Restore before the page is painted to avoid a sidebar flash.
  root.toggleAttribute('data-sidebar-collapsed', collapsed);

  document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('sidebar-collapse-toggle');
    const sidebar = document.getElementById('sidebar');
    if (!button || !sidebar) return;
    const desktop = window.matchMedia('(min-width: 850px)');

    function update() {
      root.toggleAttribute('data-sidebar-collapsed', collapsed);
      sidebar.inert = desktop.matches && collapsed;
      button.setAttribute('aria-expanded', String(!collapsed));
      const label = collapsed ? '展开导航栏' : '折叠导航栏';
      button.setAttribute('aria-label', label);
      button.title = label;
    }

    button.addEventListener('click', () => {
      collapsed = !collapsed;
      update();
      try {
        localStorage.setItem(storageKey, String(collapsed));
      } catch (_) {
        // Keep the current page usable even if the preference cannot be saved.
      }
    });
    desktop.addEventListener('change', update);
    button.hidden = false;
    update();
  });
})();
