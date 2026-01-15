(function () {
  'use strict';

  const STATE = {
    initialized: false,
    burgerOpen: false,
    scrolled: false
  };

  const CONFIG = {
    headerScrollThreshold: 50,
    debounceDelay: 150,
    throttleDelay: 200,
    notificationDuration: 5000,
    countUpDuration: 2000
  };

  const VALIDATION = {
    name: /^[a-zA-ZÀ-ÿs-']{2,50}$/,
    email: /^[^s@]+@[^s@]+.[^s@]+$/,
    phone: /^[ds+-()[]]{10,20}$/,
    messageMinLength: 10
  };

  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  };

  const throttle = (func, limit) => {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  };

  const getHeaderHeight = () => {
    const header = document.querySelector('.l-header');
    return header ? header.offsetHeight : 80;
  };

  const notify = (message, type = 'info') => {
    const container = document.getElementById('notify-container') || createNotifyContainer();
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.setAttribute('role', 'alert');
    alert.innerHTML = `${message}<button type="button" class="btn-close" aria-label="Schließen"></button>`;

    const closeBtn = alert.querySelector('.btn-close');
    closeBtn.addEventListener('click', () => removeAlert(alert));

    container.appendChild(alert);

    setTimeout(() => removeAlert(alert), CONFIG.notificationDuration);
  };

  const createNotifyContainer = () => {
    const container = document.createElement('div');
    container.id = 'notify-container';
    container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;max-width:320px;';
    document.body.appendChild(container);
    return container;
  };

  const removeAlert = (alert) => {
    if (!alert.parentNode) return;
    alert.classList.remove('show');
    setTimeout(() => {
      if (alert.parentNode) alert.parentNode.removeChild(alert);
    }, 150);
  };

  const initBurgerMenu = () => {
    const toggle = document.querySelector('.c-nav__toggle, .navbar-toggler');
    const nav = document.querySelector('.navbar-collapse');
    const navLinks = document.querySelectorAll('.nav-link');

    if (!toggle || !nav) return;

    const closeMenu = () => {
      nav.classList.remove('show');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('u-no-scroll');
      STATE.burgerOpen = false;
    };

    const openMenu = () => {
      nav.classList.add('show');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('u-no-scroll');
      STATE.burgerOpen = true;
    };

    toggle.addEventListener('click', () => {
      STATE.burgerOpen ? closeMenu() : openMenu();
    });

    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        if (STATE.burgerOpen) closeMenu();
      });
    });

    document.addEventListener('click', (e) => {
      if (STATE.burgerOpen && !nav.contains(e.target) && !toggle.contains(e.target)) {
        closeMenu();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && STATE.burgerOpen) closeMenu();
    });

    window.addEventListener('resize', throttle(() => {
      if (window.innerWidth >= 768 && STATE.burgerOpen) closeMenu();
    }, CONFIG.throttleDelay));
  };

  const initSmoothScroll = () => {
    const links = document.querySelectorAll('a[href^="#"]');

    links.forEach((link) => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (!href || href === '#' || href === '#!') return;

        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          const headerHeight = getHeaderHeight();
          const top = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      });
    });
  };

  const initScrollSpy = () => {
    const sections = document.querySelectorAll('[id]');
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');

    if (sections.length === 0 || navLinks.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            navLinks.forEach((link) => {
              link.classList.remove('active');
              link.removeAttribute('aria-current');
              if (link.getAttribute('href') === `#${entry.target.id}`) {
                link.classList.add('active');
                link.setAttribute('aria-current', 'page');
              }
            });
          }
        });
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );

    sections.forEach((section) => observer.observe(section));
  };

  const initActiveMenu = () => {
    const path = window.location.pathname;
    const links = document.querySelectorAll('.nav-link');

    links.forEach((link) => {
      link.classList.remove('active');
      link.removeAttribute('aria-current');

      const linkPath = link.getAttribute('href');
      if (!linkPath || linkPath.startsWith('#')) return;

      const cleanLinkPath = linkPath.split('#')[0];
      const cleanCurrentPath = path.split('#')[0];

      if (
        cleanLinkPath === cleanCurrentPath ||
        (cleanCurrentPath === '/' && cleanLinkPath === '/index.html') ||
        (cleanCurrentPath === '/index.html' && cleanLinkPath === '/')
      ) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });
  };

  const initHeaderScroll = () => {
    const header = document.querySelector('.l-header');
    if (!header) return;

    const handleScroll = () => {
      const scrolled = window.pageYOffset > CONFIG.headerScrollThreshold;
      if (scrolled !== STATE.scrolled) {
        STATE.scrolled = scrolled;
        header.classList.toggle('is-scrolled', scrolled);
      }
    };

    window.addEventListener('scroll', throttle(handleScroll, CONFIG.throttleDelay));
    handleScroll();
  };

  const validateField = (field) => {
    const { id, name, type, value } = field;
    const fieldName = name || id;

    field.classList.remove('is-invalid');
    let feedback = field.parentNode.querySelector('.invalid-feedback');

    const showError = (message) => {
      field.classList.add('is-invalid');
      if (!feedback) {
        feedback = document.createElement('div');
        feedback.className = 'invalid-feedback';
        field.parentNode.appendChild(feedback);
      }
      feedback.textContent = message;
      return false;
    };

    if (field.hasAttribute('required') && !value.trim()) {
      return showError('Dieses Feld ist erforderlich.');
    }

    if (type === 'email' && value && !VALIDATION.email.test(value)) {
      return showError('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
    }

    if (type === 'tel' && value && !VALIDATION.phone.test(value)) {
      return showError('Bitte geben Sie eine gültige Telefonnummer ein.');
    }

    if ((fieldName.includes('Name') || fieldName.includes('name')) && value && !VALIDATION.name.test(value)) {
      return showError('Bitte geben Sie einen gültigen Namen ein (2-50 Zeichen).');
    }

    if (field.tagName === 'TEXTAREA' && value && value.length < VALIDATION.messageMinLength) {
      return showError(`Die Nachricht muss mindestens ${VALIDATION.messageMinLength} Zeichen lang sein.`);
    }

    if (type === 'checkbox' && field.hasAttribute('required') && !field.checked) {
      return showError('Sie müssen diesem Feld zustimmen.');
    }

    if (feedback) feedback.textContent = '';
    return true;
  };

  const initFormValidation = () => {
    const forms = document.querySelectorAll('.c-form, form');

    forms.forEach((form) => {
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.textContent : '';

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const fields = form.querySelectorAll('input, select, textarea');
        let isValid = true;

        fields.forEach((field) => {
          if (!validateField(field)) isValid = false;
        });

        if (!isValid) return;

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Wird gesendet...';
        }

        setTimeout(() => {
          notify('Ihre Anfrage wurde erfolgreich gesendet!', 'success');
          setTimeout(() => {
            window.location.href = 'thank_you.html';
          }, 1000);
        }, 1500);
      });

      const fields = form.querySelectorAll('input, select, textarea');
      fields.forEach((field) => {
        field.addEventListener('blur', () => validateField(field));
      });
    });
  };

  const initCountUp = () => {
    const counters = document.querySelectorAll('[data-count]');
    if (counters.length === 0) return;

    const animateCount = (element) => {
      const target = parseInt(element.getAttribute('data-count'), 10);
      const duration = CONFIG.countUpDuration;
      const start = 0;
      const increment = target / (duration / 16);
      let current = start;

      const updateCount = () => {
        current += increment;
        if (current < target) {
          element.textContent = Math.floor(current);
          requestAnimationFrame(updateCount);
        } else {
          element.textContent = target;
        }
      };

      updateCount();
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach((counter) => observer.observe(counter));
  };

  const initScrollToTop = () => {
    const btn = document.querySelector('[data-scroll-top]');
    if (!btn) return;

    const toggleVisibility = () => {
      btn.style.display = window.pageYOffset > 300 ? 'block' : 'none';
    };

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', throttle(toggleVisibility, CONFIG.throttleDelay));
    toggleVisibility();
  };

  const initImages = () => {
    const images = document.querySelectorAll('img');
    const placeholderSVG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23e9ecef" width="400" height="300"/%3E%3Ctext fill="%236c757d" font-family="sans-serif" font-size="18" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EBild nicht verfügbar%3C/text%3E%3C/svg%3E';

    images.forEach((img) => {
      if (!img.classList.contains('img-fluid')) {
        img.classList.add('img-fluid');
      }

      if (!img.hasAttribute('loading') && !img.hasAttribute('data-critical')) {
        img.setAttribute('loading', 'lazy');
      }

      img.addEventListener('error', function () {
        this.src = placeholderSVG;
        this.style.objectFit = 'contain';
      });
    });
  };

  const init = () => {
    if (STATE.initialized) return;
    STATE.initialized = true;

    initBurgerMenu();
    initSmoothScroll();
    initScrollSpy();
    initActiveMenu();
    initHeaderScroll();
    initFormValidation();
    initCountUp();
    initScrollToTop();
    initImages();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
