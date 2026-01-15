(function () {
  var header = document.querySelector('.dr-header');
  if (!header) return;

  var nav = header.querySelector('.dr-nav');
  var toggle = header.querySelector('.dr-nav-toggle');
  var navList = header.querySelector('.dr-nav-list');

  if (!nav || !toggle || !navList) return;

  function setCollapsed(collapsed) {
    if (collapsed) {
      nav.classList.add('dr-nav-collapsed');
      toggle.classList.remove('dr-nav-toggle-active');
      toggle.setAttribute('aria-expanded', 'false');
    } else {
      nav.classList.remove('dr-nav-collapsed');
      toggle.classList.add('dr-nav-toggle-active');
      toggle.setAttribute('aria-expanded', 'true');
    }
  }

  function syncWithViewport() {
    var isMobile = window.matchMedia('(max-width: 767px)').matches;
    if (isMobile) {
      setCollapsed(true);
    } else {
      setCollapsed(false);
    }
  }

  toggle.addEventListener('click', function () {
    var isCollapsed = nav.classList.contains('dr-nav-collapsed');
    setCollapsed(!isCollapsed);
  });

  syncWithViewport();
  window.addEventListener('resize', syncWithViewport);
})();
