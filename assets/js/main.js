/* ============================================================
   NANO TECHNOLOGY SOCIETY — main.js
   Companion script for style.css
   ============================================================ */

;(function () {
  'use strict'

  /* ─── Utility Helpers ─── */
  const $ = (sel, ctx = document) => ctx.querySelector(sel)
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)]

  function debounce(fn, ms = 150) {
    let t
    return (...args) => {
      clearTimeout(t)
      t = setTimeout(() => fn(...args), ms)
    }
  }

  /* ─── DOM Ready ─── */
  document.addEventListener('DOMContentLoaded', init)

  function init() {
    initNavToggle()
    initStickyHeader()
    initScrollReveal()
    initScrollTop()
    initTabs()
    initAccordion()
    initModal()
    initCountUp()
    initTooltips()
    initLangSwitch()
    initSmoothScroll()
  }

  /* ═══════════════════════════════════════════════════════════
     1. Mobile Navigation Toggle
     ═══════════════════════════════════════════════════════════ */
  function initNavToggle() {
    const toggle = $('.nav-toggle')
    const nav = $('.nav')
    if (!toggle || !nav) return

    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true'
      toggle.setAttribute('aria-expanded', String(!expanded))
      nav.classList.toggle('is-open')
      document.body.classList.toggle('nav-open')
    })

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && !toggle.contains(e.target)) {
        nav.classList.remove('is-open')
        toggle.setAttribute('aria-expanded', 'false')
        document.body.classList.remove('nav-open')
      }
    })

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open')
        toggle.setAttribute('aria-expanded', 'false')
        toggle.focus()
        document.body.classList.remove('nav-open')
      }
    })
  }

  /* ═══════════════════════════════════════════════════════════
     2. Sticky Header — add class on scroll
     ═══════════════════════════════════════════════════════════ */
  function initStickyHeader() {
    const header = $('.site-header')
    if (!header) return

    const onScroll = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 60)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
  }

  /* ═══════════════════════════════════════════════════════════
     3. Scroll Reveal (IntersectionObserver)
     ═══════════════════════════════════════════════════════════ */
  function initScrollReveal() {
    const items = $$('.reveal')
    if (!items.length) return

    // Respect reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items.forEach((el) => el.classList.add('is-visible'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target
            const delay = el.dataset.revealDelay || 0
            setTimeout(() => el.classList.add('is-visible'), Number(delay))
            observer.unobserve(el)
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    )

    items.forEach((el) => observer.observe(el))
  }

  /* ═══════════════════════════════════════════════════════════
     4. Scroll-to-Top Button
     ═══════════════════════════════════════════════════════════ */
  function initScrollTop() {
    const btn = $('.scroll-top')
    if (!btn) return

    const toggle = () => {
      btn.classList.toggle('is-visible', window.scrollY > 400)
    }

    window.addEventListener('scroll', toggle, { passive: true })
    toggle()

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }

  /* ═══════════════════════════════════════════════════════════
     5. Tabs
     ═══════════════════════════════════════════════════════════ */
  function initTabs() {
    $$('.tabs').forEach((tabGroup) => {
      const buttons = $$('[data-tab]', tabGroup)
      const panels = $$('.tab-panel', tabGroup)

      buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
          const target = btn.dataset.tab

          // Deactivate all
          buttons.forEach((b) => {
            b.classList.remove('active')
            b.setAttribute('aria-selected', 'false')
          })
          panels.forEach((p) => p.classList.remove('active'))

          // Activate target
          btn.classList.add('active')
          btn.setAttribute('aria-selected', 'true')
          const panel = $(`#${target}`, tabGroup)
          if (panel) panel.classList.add('active')
        })

        // Keyboard navigation (arrow keys)
        btn.addEventListener('keydown', (e) => {
          const idx = buttons.indexOf(btn)
          let next = -1
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            const dir = e.key === 'ArrowRight' ? 1 : -1
            next = (idx + dir + buttons.length) % buttons.length
          }
          if (next >= 0) {
            e.preventDefault()
            buttons[next].focus()
            buttons[next].click()
          }
        })
      })
    })
  }

  /* ═══════════════════════════════════════════════════════════
     6. Accordion / FAQ
     ═══════════════════════════════════════════════════════════ */
  function initAccordion() {
    $$('.accordion').forEach((acc) => {
      const items = $$('.accordion-item', acc)

      items.forEach((item) => {
        const trigger = $('.accordion-trigger', item)
        if (!trigger) return

        trigger.addEventListener('click', () => {
          const isOpen = item.classList.contains('is-open')

          // Close all in this accordion
          items.forEach((i) => {
            i.classList.remove('is-open')
            const t = $('.accordion-trigger', i)
            if (t) t.setAttribute('aria-expanded', 'false')
          })

          // Toggle current
          if (!isOpen) {
            item.classList.add('is-open')
            trigger.setAttribute('aria-expanded', 'true')
          }
        })

        // Keyboard
        trigger.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            trigger.click()
          }
        })
      })
    })
  }

  /* ═══════════════════════════════════════════════════════════
     7. Modal
     ═══════════════════════════════════════════════════════════ */
  function initModal() {
    let lastFocused = null

    // Open
    $$('[data-modal-open]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.modalOpen
        const modal = $(`#${id}`)
        if (!modal) return
        lastFocused = document.activeElement
        openModal(modal)
      })
    })

    // Close
    $$('[data-modal-close]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal-overlay')
        if (modal) closeModal(modal)
      })
    })

    // Close on overlay click
    $$('.modal-overlay').forEach((overlay) => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal(overlay)
      })
    })

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const active = $('.modal-overlay.is-active')
        if (active) closeModal(active)
      }
    })

    function openModal(modal) {
      modal.classList.add('is-active')
      modal.setAttribute('aria-hidden', 'false')
      document.body.style.overflow = 'hidden'

      // Focus trap
      const focusable = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', modal)
      if (focusable.length) focusable[0].focus()

      modal.addEventListener('keydown', trapFocus)
    }

    function closeModal(modal) {
      modal.classList.remove('is-active')
      modal.setAttribute('aria-hidden', 'true')
      document.body.style.overflow = ''
      modal.removeEventListener('keydown', trapFocus)
      if (lastFocused) lastFocused.focus()
    }

    function trapFocus(e) {
      if (e.key !== 'Tab') return
      const modal = e.currentTarget
      const focusable = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', modal)
      if (!focusable.length) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════
     8. Count-Up Animation (Stats)
     ═══════════════════════════════════════════════════════════ */
  function initCountUp() {
    const counters = $$('[data-count]')
    if (!counters.length) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      counters.forEach((el) => {
        el.textContent = Number(el.dataset.count).toLocaleString('fa-IR')
      })
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCount(entry.target)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.5 }
    )

    counters.forEach((el) => observer.observe(el))

    function animateCount(el) {
      const target = Number(el.dataset.count)
      const duration = Number(el.dataset.duration) || 2000
      const start = performance.now()
      const isRtl = getComputedStyle(el).direction === 'rtl'

      function step(now) {
        const progress = Math.min((now - start) / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
        const current = Math.floor(eased * target)

        el.textContent = isRtl
          ? current.toLocaleString('fa-IR')
          : current.toLocaleString()

        if (progress < 1) requestAnimationFrame(step)
      }

      requestAnimationFrame(step)
    }
  }

  /* ═══════════════════════════════════════════════════════════
     9. Tooltips (keyboard + hover)
     ═══════════════════════════════════════════════════════════ */
  function initTooltips() {
    $$('.tooltip-wrap').forEach((wrap) => {
      const trigger = wrap.firstElementChild
      if (!trigger) return

      trigger.setAttribute('tabindex', trigger.getAttribute('tabindex') || '0')

      trigger.addEventListener('focus', () => wrap.classList.add('is-active'))
      trigger.addEventListener('blur', () => wrap.classList.remove('is-active'))
      trigger.addEventListener('mouseenter', () => wrap.classList.add('is-active'))
      trigger.addEventListener('mouseleave', () => wrap.classList.remove('is-active'))

      trigger.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          wrap.classList.remove('is-active')
          trigger.blur()
        }
      })
    })
  }

  /* ═══════════════════════════════════════════════════════════
     10. Language / Direction Switch
     ═══════════════════════════════════════════════════════════ */
  function initLangSwitch() {
    const btn = $('[data-lang-toggle]')
    if (!btn) return

    btn.addEventListener('click', () => {
      const html = document.documentElement
      const isRtl = html.getAttribute('dir') !== 'ltr'

      if (isRtl) {
        html.setAttribute('dir', 'ltr')
        html.classList.add('ltr')
        html.classList.remove('rtl')
        document.body.classList.add('lang-en')
        document.body.classList.remove('lang-fa')
        btn.textContent = 'فا'
      } else {
        html.setAttribute('dir', 'rtl')
        html.classList.remove('ltr')
        html.classList.add('rtl')
        document.body.classList.remove('lang-en')
        document.body.classList.add('lang-fa')
        btn.textContent = 'EN'
      }

      // Persist preference
      try {
        localStorage.setItem('nano-lang', isRtl ? 'en' : 'fa')
      } catch (e) { /* silent */ }
    })

    // Restore preference
    try {
      const saved = localStorage.getItem('nano-lang')
      if (saved === 'en') btn.click()
    } catch (e) { /* silent */ }
  }

  /* ═══════════════════════════════════════════════════════════
     11. Smooth Scroll for Anchor Links
     ═══════════════════════════════════════════════════════════ */
  function initSmoothScroll() {
    $$('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const id = link.getAttribute('href')
        if (id === '#' || id === '#!') return

        const target = $(id)
        if (!target) return

        e.preventDefault()

        const header = $('.site-header')
        const offset = header ? header.offsetHeight + 16 : 16

        const top = target.getBoundingClientRect().top + window.scrollY - offset
        window.scrollTo({ top, behavior: 'smooth' })

        // Close mobile nav if open
        const nav = $('.nav')
        if (nav && nav.classList.contains('is-open')) {
          nav.classList.remove('is-open')
          const toggle = $('.nav-toggle')
          if (toggle) toggle.setAttribute('aria-expanded', 'false')
          document.body.classList.remove('nav-open')
        }

        // Set focus for accessibility
        target.setAttribute('tabindex', '-1')
        target.focus({ preventScroll: true })
      })
    })
  }

  /* ═══════════════════════════════════════════════════════════
     12. Toast Notifications (Public API)
     ═══════════════════════════════════════════════════════════ */
  window.NanoToast = {
    show(message, { type = 'info', duration = 4000 } = {}) {
      let container = $('.toast-container')
      if (!container) {
        container = document.createElement('div')
        container.className = 'toast-container'
        container.setAttribute('aria-live', 'polite')
        container.setAttribute('aria-atomic', 'true')
        document.body.appendChild(container)
      }

      const toast = document.createElement('div')
      toast.className = `toast toast--${type}`
      toast.setAttribute('role', 'status')
      toast.textContent = message

      // Close button
      const closeBtn = document.createElement('button')
      closeBtn.className = 'toast-close'
      closeBtn.setAttribute('aria-label', 'بستن')
      closeBtn.innerHTML = '&times;'
      closeBtn.addEventListener('click', () => dismiss(toast))
      toast.appendChild(closeBtn)

      container.appendChild(toast)

      // Trigger animation
      requestAnimationFrame(() => toast.classList.add('is-visible'))

      // Auto dismiss
      if (duration > 0) {
        setTimeout(() => dismiss(toast), duration)
      }

      function dismiss(el) {
        el.classList.remove('is-visible')
        el.addEventListener('transitionend', () => el.remove(), { once: true })
        // Fallback removal
        setTimeout(() => { if (el.parentNode) el.remove() }, 500)
      }

      return toast
    },

    success(msg, opts) { return this.show(msg, { ...opts, type: 'success' }) },
    error(msg, opts) { return this.show(msg, { ...opts, type: 'error' }) },
    warning(msg, opts) { return this.show(msg, { ...opts, type: 'warning' }) },
    info(msg, opts) { return this.show(msg, { ...opts, type: 'info' }) },
  }

})()
-----------------------------------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const copyButtons = document.querySelectorAll(".copy-id");

  copyButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const text = button.getAttribute("data-copy");
      const feedback = button.parentElement.querySelector(".copy-feedback");

      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
        } else {
          const ta = document.createElement("textarea");
          ta.value = text;
          ta.style.position = "fixed";
          ta.style.left = "-9999px";
          document.body.appendChild(ta);
          ta.focus();
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }

        if (feedback) feedback.textContent = "آیدی کپی شد.";
      } catch (err) {
        if (feedback) feedback.textContent = "کپی انجام نشد.";
      }

      setTimeout(() => {
        if (feedback) feedback.textContent = "";
      }, 2000);
    });
  });
});
