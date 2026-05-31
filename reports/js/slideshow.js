document.addEventListener("DOMContentLoaded", () => {
  /* =========================
     Slideshow
     ========================= */
  const slideshows = document.querySelectorAll(".slides");
  const slideshowControllers = [];

  slideshows.forEach((slidesEl) => {
    const slides = Array.from(slidesEl.querySelectorAll(".slide"));
    if (slides.length <= 1) return;

    const interval = parseInt(slidesEl.dataset.interval || "3000", 10);

    let current = slides.findIndex((s) => s.classList.contains("is-active"));
    if (current === -1) current = 0;

    slides.forEach((s, i) => s.classList.toggle("is-active", i === current));

    let timerId = null;

    const goTo = (index) => {
      slides[current].classList.remove("is-active");
      current = (index + slides.length) % slides.length;
      slides[current].classList.add("is-active");
    };

    const next = () => goTo(current + 1);

    const start = () => {
      stop();
      timerId = window.setInterval(next, interval);
    };

    const stop = () => {
      if (timerId !== null) {
        window.clearInterval(timerId);
        timerId = null;
      }
    };

    const viewport =
      slidesEl.closest(".slideshow")?.querySelector(".slideshow__viewport") || slidesEl;

    viewport.addEventListener("mouseenter", stop);
    viewport.addEventListener("mouseleave", start);

    start();

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else start();
    });

    slideshowControllers.push({ start, stop });
  });

  /* =========================
     Modal Gallery (Scoped + Counter + Swipe + Fade)
     ========================= */

  const pauseAllSlideshows = () => slideshowControllers.forEach((c) => c.stop());
  const resumeAllSlideshows = () => slideshowControllers.forEach((c) => c.start());

  const ensureModal = () => {
    let modal = document.querySelector(".modal");
    if (modal) return modal;

    modal = document.createElement("div");
    modal.className = "modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "نمایش تصویر");

    modal.innerHTML = `
      <div class="modal__dialog" role="document">
        <div class="modal__header">
          <p class="modal__title">نمایش تصویر</p>
          <p class="modal__meta" aria-live="polite"></p>
          <button class="modal__close" type="button" aria-label="بستن">×</button>
        </div>
        <div class="modal__body">
          <div class="modal__stage">
            <button class="modal__nav modal__nav--prev" type="button" aria-label="تصویر قبلی">‹</button>
            <img class="modal__img" alt="">
            <button class="modal__nav modal__nav--next" type="button" aria-label="تصویر بعدی">›</button>
          </div>
          <div class="modal__caption" hidden></div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    return modal;
  };

  const modal = ensureModal();
  const modalImg = modal.querySelector(".modal__img");
  const modalCaption = modal.querySelector(".modal__caption");
  const modalMeta = modal.querySelector(".modal__meta");
  const closeBtn = modal.querySelector(".modal__close");
  const prevBtn = modal.querySelector(".modal__nav--prev");
  const nextBtn = modal.querySelector(".modal__nav--next");
  const stage = modal.querySelector(".modal__stage");

  let modalOpen = false;
  let lastFocusedEl = null;

  let currentGallery = []; // HTMLImageElement[]
  let currentIndex = 0;

  const getImgSrc = (imgEl) => imgEl.currentSrc || imgEl.src;

  const setMeta = () => {
    const total = currentGallery.length;
    modalMeta.textContent = total > 1 ? `${currentIndex + 1} / ${total}` : "";
  };

  const setCaptionFrom = (imgEl) => {
    const alt = (imgEl.getAttribute("alt") || "").trim();
    modalImg.alt = alt || "تصویر";

    if (alt) {
      modalCaption.textContent = alt;
      modalCaption.hidden = false;
    } else {
      modalCaption.textContent = "";
      modalCaption.hidden = true;
    }
  };

  const toggleNavVisibility = () => {
    const hasMultiple = currentGallery.length > 1;
    prevBtn.hidden = !hasMultiple;
    nextBtn.hidden = !hasMultiple;
  };

  const updateModalImage = (withFade = true) => {
    const imgEl = currentGallery[currentIndex];
    if (!imgEl) return;

    const src = getImgSrc(imgEl);

    const apply = () => {
      modalImg.src = src;
      setCaptionFrom(imgEl);
      setMeta();
      toggleNavVisibility();
    };

    if (!withFade) return apply();

    modalImg.classList.add("is-fading");
    window.setTimeout(() => {
      apply();
      modalImg.classList.remove("is-fading");
    }, 160);
  };

  const openModal = ({ gallery, index }) => {
    if (!gallery || gallery.length === 0) return;

    currentGallery = gallery;
    currentIndex = (index + currentGallery.length) % currentGallery.length;
    lastFocusedEl = document.activeElement;

    updateModalImage(false);

    modal.classList.add("is-open");
    modalOpen = true;
    document.documentElement.style.overflow = "hidden";

    pauseAllSlideshows();
    closeBtn.focus();
  };

  const closeModal = () => {
    if (!modalOpen) return;

    modal.classList.remove("is-open");
    modalOpen = false;
    document.documentElement.style.overflow = "";

    modalImg.removeAttribute("src");

    resumeAllSlideshows();

    if (lastFocusedEl && typeof lastFocusedEl.focus === "function") {
      lastFocusedEl.focus();
    }
  };

  const showPrev = () => {
    if (currentGallery.length <= 1) return;
    currentIndex = (currentIndex - 1 + currentGallery.length) % currentGallery.length;
    updateModalImage(true);
  };

  const showNext = () => {
    if (currentGallery.length <= 1) return;
    currentIndex = (currentIndex + 1) % currentGallery.length;
    updateModalImage(true);
  };

  /* -------------------------
     Scoping logic (matches your HTML)
     ------------------------- */
  const buildScopedGallery = (clickedImg) => {
    // If inside slideshow -> only images of slides
    const slideshowRoot = clickedImg.closest(".slideshow");
    if (slideshowRoot) {
      return Array.from(slideshowRoot.querySelectorAll(".slides .slide img"))
        .filter((img) => img.src || img.currentSrc);
    }

    // If inside poster -> only poster images
    const posterRoot = clickedImg.closest(".poster");
    if (posterRoot) {
      return Array.from(posterRoot.querySelectorAll("img"))
        .filter((img) => img.src || img.currentSrc);
    }

    return [clickedImg];
  };

  // Clickable images: poster image + slideshow images
  const clickableImages = Array.from(
    document.querySelectorAll(".poster img, .slideshow .slides .slide img")
  );

  clickableImages.forEach((img) => {
    img.classList.add("modal-trigger");
    img.addEventListener("click", () => {
      const gallery = buildScopedGallery(img);
      const index = Math.max(0, gallery.indexOf(img));
      openModal({ gallery, index });
    });
  });

  /* -------------------------
     Close interactions
     ------------------------- */
  closeBtn.addEventListener("click", closeModal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  prevBtn.addEventListener("click", showPrev);
  nextBtn.addEventListener("click", showNext);

  document.addEventListener("keydown", (e) => {
    if (!modalOpen) return;

    if (e.key === "Escape") closeModal();

    // حالت استاندارد (LTR): Left=Prev / Right=Next
    else if (e.key === "ArrowLeft") showPrev();
    else if (e.key === "ArrowRight") showNext();

    // اگر برای RTL خواستی طبیعی‌تر شود، این دو خط بالا را کامنت کن و این دو تا را فعال کن:
    // else if (e.key === "ArrowLeft") showNext();
    // else if (e.key === "ArrowRight") showPrev();
  });

  /* -------------------------
     Swipe support (touch)
     ------------------------- */
  let touchStartX = 0;
  let touchStartY = 0;
  let touchActive = false;

  stage.addEventListener(
    "touchstart",
    (e) => {
      if (!modalOpen) return;
      const t = e.touches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;
      touchActive = true;
    },
    { passive: true }
  );

  stage.addEventListener(
    "touchend",
    (e) => {
      if (!modalOpen || !touchActive) return;
      touchActive = false;

      const t = e.changedTouches[0];
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;

      if (Math.abs(dy) > Math.abs(dx)) return;

      const threshold = 40;
      if (dx > threshold) showPrev();
      else if (dx < -threshold) showNext();
    },
    { passive: true }
  );
});
