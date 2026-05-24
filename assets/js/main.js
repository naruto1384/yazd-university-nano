/* =========================================================
   Project Main JS
   Theme switcher + navigation + accordion + gallery + UI helpers
   ========================================================= */

(() => {
  'use strict';

  /* =========================
     Helpers
     ========================= */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

  const isMobile = () => window.matchMedia('(max-width: 900px)').matches;

  const smoothScrollTo = (targetEl, offset = 80) => {
    if (!targetEl) return;
    const top = targetEl.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  /* =========================
     Theme Switcher
     ========================= */
  const ThemeSwitcher = (() => {
    const STORAGE_KEY = 'theme';

    const getSystemTheme = () =>
      window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

    const getSavedTheme = () => localStorage.getItem(STORAGE_KEY);

    const applyTheme = (theme) => {
      document.documentElement.setAttribute('data-theme', theme);
    };

    const init = () => {
      const saved = getSavedTheme();
      applyTheme(saved || getSystemTheme());

      // اتصال دکمه .theme-toggle
      const btn = $('.theme-toggle');
      if (btn) {
        btn.addEventListener('click', toggle);
        btn.setAttribute('aria-label', 'تغییر تم');
      }
    };

    const toggle = () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem(STORAGE_KEY, next);
      Toast.show(next === 'dark' ? '🌙 حالت تاریک فعال شد' : '☀️ حالت روشن فعال شد', 'success', 1800);
    };

    return { init, toggle };
  })();

  /* =========================
     Toast System (themed)
     ========================= */
  const Toast = (() => {
    let host = null;
    let timer = null;

    const createHost = () => {
      if (host) return host;
      host = document.createElement('div');
      host.className = 'toast-host';
      host.setAttribute('aria-live', 'polite');
      host.setAttribute('aria-atomic', 'true');
      Object.assign(host.style, {
        position: 'fixed',
        left: '50%',
        bottom: '24px',
        transform: 'translateX(-50%)',
        zIndex: '9999',
        display: 'grid',
        gap: '8px',
        pointerEvents: 'none'
      });
      document.body.appendChild(host);
      return host;
    };

    const show = (message = '', type = 'success', timeout = 2200) => {
      const elHost = createHost();
      const el = document.createElement('div');
      el.className = `toast toast--${type}`;
      el.textContent = message;

      const root = getComputedStyle(document.documentElement);
      const accent = root.getPropertyValue('--accent')?.trim() || '#38bdf8';
      const accent2 = root.getPropertyValue('--accent-hover')?.trim() || '#a855f7';

      Object.assign(el.style, {
        padding: '10px 20px',
        borderRadius: '12px',
        color: type === 'error' ? '#fff' : '#0f172a',
        fontSize: '14px',
        fontWeight: '700',
        fontFamily: 'Vazirmatn, sans-serif',
        boxShadow: '0 12px 26px rgba(15, 0, 60, .45)',
        background:
          type === 'error'
            ? 'linear-gradient(135deg,#ef4444,#dc2626)'
            : `linear-gradient(135deg,${accent},${accent2})`,
        opacity: '0',
        transform: 'translateY(8px)',
        transition: 'all .25s ease',
        pointerEvents: 'auto',
        whiteSpace: 'nowrap'
      });

      elHost.appendChild(el);
      requestAnimationFrame(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      });

      clearTimeout(timer);
      timer = setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(8px)';
        setTimeout(() => el.remove(), 260);
      }, timeout);
    };

    return { show };
  })();

  /* =========================
     Header Scroll State
     ========================= */
  const HeaderState = (() => {
    // پشتیبانی از هر دو کلاس .site-header و .navbar
    const header = $('.site-header') || $('.navbar');
    if (!header) return { init() {} };

    const onScroll = () => {
      const y = window.scrollY || window.pageYOffset;
      header.classList.toggle('is-scrolled', y > 8);
    };

    return {
      init() {
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
      }
    };
  })();

  /* =========================
     Mobile Nav
     ========================= */
  const MobileNav = (() => {
    const navToggle = $('.nav-toggle');
    const nav = $('.nav');
    const navLinks = $$('.nav a, .nav__link');

    if (!nav || !navToggle) return { init() {} };

    const open = () => {
      nav.classList.add('is-open');
      navToggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('menu-open');
    };

    const close = () => {
      nav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
    };

    const toggle = () => {
      nav.classList.contains('is-open') ? close() : open();
    };

    const onDocClick = (e) => {
      if (!isMobile()) return;
      const insideNav = nav.contains(e.target);
      const insideBtn = navToggle.contains(e.target);
      if (!insideNav && !insideBtn) close();
    };

    const onResize = () => {
      if (!isMobile()) close();
    };

    return {
      init() {
        navToggle.addEventListener('click', toggle);
        navLinks.forEach((a) => a.addEventListener('click', () => isMobile() && close()));
        document.addEventListener('click', onDocClick);
        window.addEventListener('resize', onResize);
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') close();
        });
      }
    };
  })();

  /* =========================
     Smooth Anchor Scrolling
     ========================= */
  const SmoothAnchors = (() => {
    const links = $$('a[href^="#"]');
    const getHeader = () => $('.site-header') || $('.navbar');

    const getOffset = () => {
      const header = getHeader();
      return (header ? header.offsetHeight : 0) + 12;
    };

    const onClick = (e) => {
      const href = e.currentTarget.getAttribute('href');
      if (!href || href === '#') return;

      const target = document.getElementById(href.slice(1));
      if (!target) return;

      e.preventDefault();
      smoothScrollTo(target, getOffset());
      history.pushState(null, '', href);
    };

    return {
      init() {
        links.forEach((link) => link.addEventListener('click', onClick));
      }
    };
  })();

  /* =========================
     Active Nav Link by Section
     ========================= */
  const ActiveSection = (() => {
    const links = $$('.nav__link, .nav a, .navbar-nav a').filter((a) =>
      a.getAttribute('href')?.startsWith('#')
    );

    if (!links.length) return { init() {} };

    const sections = links
      .map((a) => document.getElementById(a.getAttribute('href').slice(1)))
      .filter(Boolean);

    if (!sections.length) return { init() {} };

    let activeId = null;

    const setActive = (id) => {
      if (activeId === id) return;
      activeId = id;

      links.forEach((a) => {
        const isActive = a.getAttribute('href') === `#${id}`;
        a.classList.toggle('is-active', isActive);
        a.classList.toggle('active', isActive);
        if (isActive) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: [0.2, 0.4, 0.7] }
    );

    return {
      init() {
        sections.forEach((s) => observer.observe(s));
      }
    };
  })();

  /* =========================
     Scroll Top Button
     ========================= */
  const ScrollTop = (() => {
    const btn = $('.scroll-top');
    if (!btn) return { init() {} };

    const update = () => {
      const y = window.scrollY || window.pageYOffset;
      btn.classList.toggle('is-visible', y > 300);
    };

    const goTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    return {
      init() {
        update();
        window.addEventListener('scroll', update, { passive: true });
        btn.addEventListener('click', goTop);
      }
    };
  })();

  /* =========================
     Accordion
     ========================= */
  const Accordion = (() => {
    const items = $$('.accordion-item');
    if (!items.length) return { init() {} };

    const closeAll = () => {
      $$('.accordion-header').forEach((h) => h.classList.remove('active'));
      $$('.accordion-body').forEach((b) => b.classList.remove('open'));
    };

    const open = (header, body) => {
      header.classList.add('active');
      body.classList.add('open');
      header.setAttribute('aria-expanded', 'true');
    };

    const close = (header, body) => {
      header.classList.remove('active');
      body.classList.remove('open');
      header.setAttribute('aria-expanded', 'false');
    };

    const toggle = (header, body) => {
      const isOpen = body.classList.contains('open');
      closeAll();
      if (!isOpen) open(header, body);
    };

    return {
      init() {
        items.forEach((item) => {
          const header = $('.accordion-header', item);
          const body = $('.accordion-body', item);
          if (!header || !body) return;

          // دسترسی‌پذیری
          header.setAttribute('role', 'button');
          header.setAttribute('aria-expanded', 'false');
          header.setAttribute('tabindex', '0');

          header.addEventListener('click', () => toggle(header, body));

          // پشتیبانی از کیبورد
          header.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggle(header, body);
            }
            if (e.key === 'Escape') close(header, body);
          });
        });
      }
    };
  })();

  /* =========================
     Gallery Modal Slider
     ========================= */
  const GalleryModal = (() => {
    // پشتیبانی از هر دو ساختار: #galleryModal و .lightbox
    const modal = $('#galleryModal') || $('.lightbox');
    const modalImg = $('#modalImg') || $('img', modal || document);
    const modalCaption = $('#modalCaption') || $('.lightbox-caption');
    const closeBtn = $('.modal__close, .modal-close, .lightbox-close', modal || document);
    const prevBtn = $('.modal-nav--prev', modal || document);
    const nextBtn = $('.modal-nav--next', modal || document);

    // پشتیبانی از هر دو کلاس: .gallery__item و .gallery-item
    const items = $$('.gallery__item, .gallery-item');

    if (!modal || !modalImg || !items.length) return { init() {} };

    const images = items.map((item) => {
      const img = $('img', item);
      return {
        src: img?.getAttribute('src') || '',
        alt: img?.getAttribute('alt') || ''
      };
    });

    let index = 0;
    let startX = 0;
    let endX = 0;

    const setImage = (i) => {
      index = clamp(i, 0, images.length - 1);
      const current = images[index];

      // انیمیشن fade هنگام تغییر تصویر
      modalImg.style.opacity = '0';
      setTimeout(() => {
        modalImg.src = current.src;
        modalImg.alt = current.alt || 'تصویر بزرگ‌شده';
        modalImg.style.opacity = '1';
      }, 150);

      if (modalCaption) modalCaption.textContent = current.alt || '';
      modal.setAttribute('data-index', String(index));

      // وضعیت دکمه‌های ناوبری
      if (prevBtn) prevBtn.disabled = index === 0;
      if (nextBtn) nextBtn.disabled = index === images.length - 1;
    };

    const open = (i = 0) => {
      setImage(i);
      modal.classList.add('is-open', 'active');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      modal.focus?.();
    };

    const close = () => {
      modal.classList.remove('is-open', 'active');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
    };

    const next = () => setImage((index + 1) % images.length);
    const prev = () => setImage((index - 1 + images.length) % images.length);

    const onKey = (e) => {
      if (!modal.classList.contains('is-open') && !modal.classList.contains('active')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') prev();
      if (e.key === 'ArrowLeft') next();
    };

    const onOverlayClick = (e) => {
      // کلیک روی پس‌زمینه modal (نه محتوا)
      if (e.target === modal) close();
    };

    const onTouchStart = (e) => {
      startX = e.changedTouches[0].clientX;
    };

    const onTouchEnd = (e) => {
      endX = e.changedTouches[0].clientX;
      const diff = endX - startX;
      if (Math.abs(diff) < 40) return;
      if (diff > 0) prev();
      else next();
    };

    return {
      init() {
        items.forEach((item, i) => {
          item.addEventListener('click', () => open(i));
          item.setAttribute('tabindex', '0');
          item.setAttribute('role', 'button');
          item.setAttribute('aria-label', `باز کردن تصویر ${i + 1}`);
          item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              open(i);
            }
          });
        });

        closeBtn?.addEventListener('click', close);
        prevBtn?.addEventListener('click', prev);
        nextBtn?.addEventListener('click', next);

        modal.addEventListener('click', onOverlayClick);
        document.addEventListener('keydown', onKey);

        modal.addEventListener('touchstart', onTouchStart, { passive: true });
        modal.addEventListener('touchend', onTouchEnd, { passive: true });

        // transition برای fade تصویر
        modalImg.style.transition = 'opacity 0.15s ease';
      }
    };
  })();

  /* =========================
     Reduced Motion Support
     ========================= */
  const MotionSafety = (() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');

    const apply = () => {
      document.documentElement.classList.toggle('reduced-motion', media.matches);
    };

    return {
      init() {
        apply();
        media.addEventListener?.('change', apply);
      }
    };
  })();

  /* =========================
     App Init
     ========================= */
  const App = {
    init() {
      MotionSafety.init();
      ThemeSwitcher.init();
      HeaderState.init();
      MobileNav.init();
      SmoothAnchors.init();
      ActiveSection.init();
      ScrollTop.init();
      Accordion.init();
      GalleryModal.init();

      if (location.hash) {
        const target = document.getElementById(location.hash.slice(1));
        if (target) {
          setTimeout(() => {
            const header = $('.site-header') || $('.navbar');
            const offset = (header ? header.offsetHeight : 0) + 12;
            smoothScrollTo(target, offset);
          }, 120);
        }
      }

      console.log('✅ main.js loaded');
    }
  };

  document.addEventListener('DOMContentLoaded', App.init);
})();
