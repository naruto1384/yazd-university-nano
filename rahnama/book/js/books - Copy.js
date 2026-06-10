// ===== پیکربندی =====
const DATA_URL = "data/books.json";
const THEME_KEY = "library-theme";

// ===== وضعیت برنامه =====
const state = {
  books: [],
  filtered: [],
  category: "all",
  query: "",
};

// ===== المان‌ها =====
const el = {
  grid: document.getElementById("booksGrid"),
  loader: document.getElementById("loader"),
  search: document.getElementById("searchBox"),
  categories: document.getElementById("categories"),
  count: document.getElementById("resultCount"),
  empty: document.getElementById("emptyState"),
  themeToggle: document.getElementById("themeToggle"),
  modal: document.getElementById("viewerModal"),
  modalBody: document.getElementById("viewerBody"),
  modalClose: document.getElementById("modalClose"),
  modalOverlay: document.querySelector("#viewerModal .modal__overlay"),
};

// ===== مدیریت تم =====
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (saved === "dark" || (!saved && prefersDark)) {
    document.body.classList.add("dark");
  }
}

function toggleTheme() {
  document.body.classList.toggle("dark");
  const mode = document.body.classList.contains("dark") ? "dark" : "light";
  localStorage.setItem(THEME_KEY, mode);
}

// ===== بارگذاری داده‌ها =====
async function loadBooks() {
  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    state.books = Array.isArray(data) ? data : data.books || [];
    buildCategories();
    applyFilters();
  } catch (err) {
    console.error("خطا در بارگذاری منابع:", err);
    el.grid.innerHTML = "";
    el.empty.textContent = "خطا در بارگذاری منابع. لطفاً دوباره تلاش کنید.";
    el.empty.hidden = false;
  } finally {
    el.loader.hidden = true;
  }
}

// ===== ساخت دکمه‌های دسته‌بندی =====
function buildCategories() {
  const cats = ["all", ...new Set(state.books.map((b) => b.category).filter(Boolean))];
  el.categories.innerHTML = cats
    .map(
      (c) =>
        `<button class="category-btn${c === "all" ? " active" : ""}" data-cat="${c}">${
          c === "all" ? "همه" : c
        }</button>`
    )
    .join("");

  el.categories.addEventListener("click", (e) => {
    const btn = e.target.closest(".category-btn");
    if (!btn) return;
    state.category = btn.dataset.cat;
    el.categories
      .querySelectorAll(".category-btn")
      .forEach((b) => b.classList.toggle("active", b === btn));
    applyFilters();
  });
}

// ===== فیلتر و جستجو =====
function applyFilters() {
  const q = state.query.trim().toLowerCase();
  state.filtered = state.books.filter((b) => {
    const matchCat = state.category === "all" || b.category === state.category;
    const matchQuery =
      !q ||
      (b.title && b.title.toLowerCase().includes(q)) ||
      (b.author && b.author.toLowerCase().includes(q));
    return matchCat && matchQuery;
  });
  render();
}

// ===== رندر کارت‌ها =====
function render() {
  el.count.textContent = `${state.filtered.length} منبع یافت شد`;

  if (state.filtered.length === 0) {
    el.grid.innerHTML = "";
    el.empty.textContent = "موردی مطابق جستجوی شما یافت نشد.";
    el.empty.hidden = false;
    return;
  }

  el.empty.hidden = true;
  el.grid.innerHTML = state.filtered.map(cardTemplate).join("");
}

function cardTemplate(book) {
  const cover = book.cover || "assets/placeholder-cover.png";
  const fileUrl = book.fileUrl || "#";
  return `
    <article class="book-card">
      <img class="book-card__cover" src="${escapeHtml(cover)}"
           alt="${escapeHtml(book.title || "")}" loading="lazy"
           onerror="this.src='assets/placeholder-cover.png'">
      <div class="book-card__body">
        <h3 class="book-card__title">${escapeHtml(book.title || "بدون عنوان")}</h3>
        <p class="book-card__author">${escapeHtml(book.author || "ناشناس")}</p>
        ${
          book.category
            ? `<span class="book-card__category">${escapeHtml(book.category)}</span>`
            : ""
        }
        <div class="book-card__actions">
          <button class="btn btn--outline" data-view="${escapeHtml(fileUrl)}"
                  data-title="${escapeHtml(book.title || "")}">مشاهده آنلاین</button>
          <a class="btn btn--primary" href="${escapeHtml(fileUrl)}" download>دانلود</a>
        </div>
      </div>
    </article>`;
}

// ===== مودال مشاهده آنلاین =====
function openViewer(url, title) {
  el.modalBody.innerHTML = `
    <h3 style="margin:0 2.5rem 0 0;">${escapeHtml(title)}</h3>
    <iframe src="${escapeHtml(url)}" title="${escapeHtml(title)}"></iframe>`;
  el.modal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeViewer() {
  el.modal.hidden = true;
  el.modalBody.innerHTML = "";
  document.body.style.overflow = "";
}

// ===== جلوگیری از XSS =====
function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ===== رویدادها =====
function bindEvents() {
  el.themeToggle.addEventListener("click", toggleTheme);

  let timer;
  el.search.addEventListener("input", (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      state.query = e.target.value;
      applyFilters();
    }, 250);
  });

  el.grid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-view]");
    if (!btn) return;
    openViewer(btn.dataset.view, btn.dataset.title);
  });

  el.modalClose.addEventListener("click", closeViewer);
  el.modalOverlay.addEventListener("click", closeViewer);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !el.modal.hidden) closeViewer();
  });
}

// ===== شروع =====
function init() {
  initTheme();
  bindEvents();
  loadBooks();
}

document.addEventListener("DOMContentLoaded", init);
