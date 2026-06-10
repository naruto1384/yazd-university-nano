"use strict";

const DATA_URL = "data/books.json";
const THEME_KEY = "library-theme";

const state = {
  books: [],
  filtered: [],
  category: "all",
  query: "",
};

// المان‌های DOM
const el = {
  grid: document.getElementById("booksGrid"),
  loader: document.getElementById("loader"),
  search: document.getElementById("searchBar"),
  resultCount: document.getElementById("resultCount"),
  emptyState: document.getElementById("emptyState"),
  modal: document.getElementById("bookModal"),
  modalOverlay: document.getElementById("modalOverlay"),
  modalBody: document.getElementById("modalBody"),
};

/* ---------------- تم روشن/تاریک ---------------- */
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (saved === "dark" || (!saved && prefersDark)) {
    document.body.classList.add("dark");
  }
}

function toggleTheme() {
  document.body.classList.toggle("dark");
  const mode = document.body.classList.contains("dark") ? "dark" : "light";
  localStorage.setItem(THEME_KEY, mode);
}

/* ---------------- بارگذاری داده ---------------- */
async function loadBooks() {
  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error("خطا در بارگذاری فایل داده");
    const data = await res.json();
    state.books = Array.isArray(data) ? data : [];
    state.filtered = state.books;
    if (el.loader) el.loader.hidden = true;
    render();
  } catch (err) {
    if (el.loader) el.loader.textContent = "خطا در بارگذاری کتاب‌ها";
    console.error(err);
  }
}

/* ---------------- فیلتر و جستجو ---------------- */
function applyFilters() {
  const q = state.query.trim().toLowerCase();

  state.filtered = state.books.filter((book) => {
    const matchCategory =
      state.category === "all" ||
      (book.category &&
        book.category.toLowerCase().includes(state.category.toLowerCase()));

    const matchQuery =
      !q ||
      (book.title && book.title.toLowerCase().includes(q)) ||
      (book.author && book.author.toLowerCase().includes(q));

    return matchCategory && matchQuery;
  });

  render();
}

function filterCategory(category, btn) {
  state.category = category;

  document
    .querySelectorAll(".category-btn")
    .forEach((b) => b.classList.remove("active"));
  if (btn) btn.classList.add("active");

  applyFilters();
}

/* ---------------- رندر ---------------- */
function render() {
  if (!el.grid) return;

  if (!state.filtered.length) {
    el.grid.innerHTML = "";
    if (el.emptyState) el.emptyState.hidden = false;
    if (el.resultCount) el.resultCount.textContent = "";
    return;
  }

  if (el.emptyState) el.emptyState.hidden = true;
  if (el.resultCount)
    el.resultCount.textContent = `${state.filtered.length} منبع یافت شد`;

  el.grid.innerHTML = state.filtered.map(cardTemplate).join("");
}

function cardTemplate(book) {
  const cover = book.cover || "assets/placeholder-cover.png";
  const viewUrl = book.viewUrl || book.fileUrl || "";
  const downloadUrl = book.downloadUrl || book.fileUrl || "#";

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
          ${
            viewUrl
              ? `<button class="btn btn--outline"
                    onclick="openModal('${escapeHtml(viewUrl)}', '${escapeHtml(
                  book.title || ""
                )}')">مشاهده آنلاین</button>`
              : ""
          }
          <a class="btn btn--primary" href="${escapeHtml(downloadUrl)}" download>دانلود</a>
        </div>
      </div>
    </article>`;
}

/* ---------------- مودال ---------------- */
function openModal(url, title) {
  if (!el.modal || !el.modalBody) return;

  el.modalBody.innerHTML = `
    <h2 class="modal__title">${escapeHtml(title)}</h2>
    <iframe
      src="${escapeHtml(url)}"
      class="modal__iframe"
      allow="autoplay"
      loading="lazy"
    ></iframe>`;

  el.modal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeModal() {
  if (!el.modal) return;
  el.modal.hidden = true;
  el.modalBody.innerHTML = "";
  document.body.style.overflow = "";
}

/* ---------------- امنیت ---------------- */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ---------------- debounce ---------------- */
function debounce(fn, delay = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(null, args), delay);
  };
}

/* ---------------- رویدادها ---------------- */
function bindEvents() {
  if (el.search) {
    el.search.addEventListener(
      "input",
      debounce((e) => {
        state.query = e.target.value;
        applyFilters();
      }, 250)
    );
  }

  if (el.modalOverlay) {
    el.modalOverlay.addEventListener("click", closeModal);
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
}

/* ---------------- شروع ---------------- */
function init() {
  initTheme();
  bindEvents();
  loadBooks();
}

document.addEventListener("DOMContentLoaded", init);
