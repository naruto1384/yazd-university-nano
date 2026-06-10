// ===== تغییر تم (بدون ذخیره‌سازی) =====
function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme') || 'dark';
  html.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
}

// ===== آکاردئون =====
function toggleContent(id) {
  const content = document.getElementById(id);
  if (!content) return;

  const willOpen = !content.classList.contains('active');

  // بستن سایر آکاردئون‌های باز، به‌جز موارد always-open
  document.querySelectorAll('.content-box.active').forEach(box => {
    if (box !== content && !box.classList.contains('always-open')) {
      setExpanded(box, false);
    }
  });

  setExpanded(content, willOpen);

  // اسکرول نرم به محتوا پس از پایان واقعی انیمیشن
  if (willOpen) {
    const onEnd = (e) => {
      if (e.propertyName === 'max-height') {
        content.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        content.removeEventListener('transitionend', onEnd);
      }
    };
    content.addEventListener('transitionend', onEnd);
  }
}

// هماهنگ‌سازی کلاس active و وضعیت aria-expanded روی کنترل‌کننده
function setExpanded(content, expanded) {
  content.classList.toggle('active', expanded);
  const controller = document.querySelector(`[aria-controls="${content.id}"]`);
  if (controller) {
    controller.setAttribute('aria-expanded', String(expanded));
  }
}

// تنظیم وضعیت باز/بسته و هماهنگ‌سازی aria-expanded روی دکمه مربوطه
function setExpanded(content, expanded) {
    content.classList.toggle('active', expanded);

    // اگر دکمه‌ای با aria-controls این محتوا را کنترل می‌کند، وضعیت را به‌روزرسانی کن
    const trigger = document.querySelector(`[aria-controls="${content.id}"]`);
    if (trigger) trigger.setAttribute('aria-expanded', String(expanded));
}

// ===== مودال تصویر =====
let lastFocusedEl = null;

function openImage(img) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImg');
    if (!modal || !modalImg) return;

    lastFocusedEl = document.activeElement; // ذخیره فوکوس فعلی برای بازگرداندن بعد از بستن

    modalImg.src = img.src;
    modalImg.alt = img.alt || 'تصویر بزرگ‌شده';
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // جلوگیری از اسکرول پس‌زمینه

    modal.focus();
}

function closeImage() {
    const modal = document.getElementById('imageModal');
    if (!modal || !modal.classList.contains('active')) return;

    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    // پاک‌سازی src بعد از پایان انیمیشن خروج
    const modalImg = document.getElementById('modalImg');
    if (modalImg) {
        setTimeout(() => { if (!modal.classList.contains('active')) modalImg.src = ''; }, 300);
    }

    // بازگرداندن فوکوس به عنصر قبلی
    if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') {
        lastFocusedEl.focus();
        lastFocusedEl = null;
    }
}

// ===== رویدادهای سراسری =====
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('imageModal');
    if (modal) {
        // بستن با کلیک روی پس‌زمینه (نه خود تصویر)
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeImage();
        });
        // قابلیت فوکوس برای دسترسی‌پذیری
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-hidden', 'true');
    }
});

// بستن مودال با کلید Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeImage();
});
