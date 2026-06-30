/* =====================================================
   سامانه ارزیابی اساتید — منطق برنامه
   هماهنگ با ساختار HTML و CSS بازطراحی‌شده
===================================================== */

"use strict";

/* ------------------------------
   وضعیت برنامه
------------------------------ */
const state = {
  teachers: [],
  filtered: [],
  search: "",
  department: "all",
  pageSize: 9,
  currentPage: 1,
};

/* ------------------------------
   ارجاع به عناصر DOM
------------------------------ */
const els = {
  themeToggle: document.getElementById("themeToggle"),

  searchInput: document.getElementById("searchInput"),
  departmentFilter: document.getElementById("departmentFilter"),
  pageSizeSelect: document.getElementById("pageSizeSelect"),

  teachersCount: document.getElementById("teachersCount"),
  currentFilterLabel: document.getElementById("currentFilterLabel"),

  loadingState: document.getElementById("loadingState"),
  errorState: document.getElementById("errorState"),
  emptyState: document.getElementById("emptyState"),

  grid: document.getElementById("teachersGrid"),
  pagination: document.getElementById("pagination"),

  cardTemplate: document.getElementById("teacherCardTemplate"),

  // مودال
  modal: document.getElementById("teacherModal"),
  modalTeacherName: document.getElementById("modalTeacherName"),
  modalDepartment: document.getElementById("modalDepartment"),
  modalScore: document.getElementById("modalScore"),
  modalReviewCount: document.getElementById("modalReviewCount"),
  modalCoursesList: document.getElementById("modalCoursesList"),
  modalDescription: document.getElementById("modalDescription"),

};

/* ------------------------------
   نگاشت کلاس badge برای سختی و حضورغیاب
------------------------------ */
const difficultyClass = {
  "آسان": "badge--success",
  "متوسط": "badge--warning",
  "سخت": "badge--danger",
};

const attendanceClass = {
  "آزاد": "badge--success",
  "معمولی": "badge--warning",
  "سخت‌گیر": "badge--danger",
};

/* ------------------------------
   ابزارهای کمکی
------------------------------ */
function toFa(num) {
  return Number(num).toLocaleString("fa-IR");
}

function setText(el, value) {
  if (el) el.textContent = value ?? "";
}

// نمایش امن امتیاز با یک رقم اعشار (به فارسی)
function formatScore(score) {
  const n = Number(score) || 0;
  return n.toFixed(1).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
}

/* ------------------------------
   ابزار نمایش/مخفی (با کلاس is-visible)
------------------------------ */
function show(el) {
  if (el) el.classList.add("is-visible");
}
function hide(el) {
  if (el) el.classList.remove("is-visible");
}

// مخفی کردن همه حالت‌ها
function hideAllStates() {
  hide(els.loadingState);
  hide(els.errorState);
  hide(els.emptyState);
}

function showLoading(isLoading) {
  if (isLoading) {
    hideAllStates();
    show(els.loadingState);
  } else {
    hide(els.loadingState);
  }
}

/* ------------------------------
   تم (روشن / تاریک)
------------------------------ */
function initTheme() {
  const saved = localStorage.getItem("theme");
  const theme = saved === "light" ? "light" : "dark";
  applyTheme(theme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  if (els.themeToggle) {
    els.themeToggle.setAttribute("aria-pressed", String(theme === "light"));
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "light" ? "dark" : "light";
  localStorage.setItem("theme", next);
  applyTheme(next);
}

/* ------------------------------
   بارگذاری داده‌ها
------------------------------ */
async function loadTeachers() {
  showLoading(true);

  try {
    const res = await fetch("data/teachers.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    state.teachers = Array.isArray(data) ? data : (data.teachers || []);

    showLoading(false);
    populateDepartments();
    applyFilters();
  } catch (err) {
    console.error("خطا در بارگذاری اساتید:", err);
    hideAllStates();
    els.grid.innerHTML = "";
    hide(els.pagination);
    show(els.errorState);
  }
}

/* ------------------------------
   پر کردن فیلتر گروه‌ها
------------------------------ */
function populateDepartments() {
  const departments = [
    ...new Set(state.teachers.map((t) => t.department).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b, "fa"));

  const fragment = document.createDocumentFragment();
  departments.forEach((dep) => {
    const opt = document.createElement("option");
    opt.value = dep;
    opt.textContent = dep;
    fragment.appendChild(opt);
  });
  els.departmentFilter.appendChild(fragment);
}

/* ------------------------------
   اعمال فیلترها
------------------------------ */
function applyFilters() {
  const q = state.search.trim().toLowerCase();

  state.filtered = state.teachers.filter((t) => {
    if (state.department !== "all" && t.department !== state.department) {
      return false;
    }

    if (q) {
      const inName = (t.name || "").toLowerCase().includes(q);
      const inCourses = (t.courses || [])
        .some((c) => String(c).toLowerCase().includes(q));
      if (!inName && !inCourses) return false;
    }

    return true;
  });

  state.currentPage = 1;
  updateStats();
  renderGrid();
  renderPagination();
}

/* ------------------------------
   رندر گرید کارت‌ها
------------------------------ */
function renderGrid() {
  els.grid.innerHTML = "";
  hideAllStates();

  if (state.filtered.length === 0) {
    hide(els.pagination);
    show(els.emptyState);
    return;
  }

  const start = (state.currentPage - 1) * state.pageSize;
  const end = start + state.pageSize;
  const pageItems = state.filtered.slice(start, end);

  const fragment = document.createDocumentFragment();
  pageItems.forEach((teacher) => fragment.appendChild(buildCard(teacher)));
  els.grid.appendChild(fragment);
}

/* ------------------------------
   ساخت یک کارت از روی template
------------------------------ */
function buildCard(teacher) {
  const node = els.cardTemplate.content.cloneNode(true);
  const card = node.querySelector(".teacher-card");

  setText(node.querySelector(".teacher-card__name"), teacher.name);
  setText(node.querySelector(".teacher-card__department"), teacher.department);
  setText(node.querySelector(".teacher-card__rating-value"), formatScore(teacher.rating));

  // دروس (نمایش کوتاه‌شده)
  const courses = teacher.courses || [];
  const coursesText = courses.length
    ? courses.slice(0, 3).join("، ") + (courses.length > 3 ? " ..." : "")
    : "—";
  setText(node.querySelector(".teacher-card__courses"), coursesText);

  // تعداد نظرات
   setText(node.querySelector(".teacher-card__reviews"), toFa(teacher.reviewsCount || 0));

  // badge سختی
  const diffEl = node.querySelector(".teacher-card__difficulty");
  setText(diffEl, teacher.difficulty || "—");
  if (diffEl && difficultyClass[teacher.difficulty]) {
    diffEl.classList.add(difficultyClass[teacher.difficulty]);
  }

  // badge حضور و غیاب
  const attEl = node.querySelector(".teacher-card__attendance");
  setText(attEl, teacher.attendance || "—");
  if (attEl && attendanceClass[teacher.attendance]) {
    attEl.classList.add(attendanceClass[teacher.attendance]);
  }

  // دکمه جزئیات (هماهنگ با CSS)
  const btn = node.querySelector(".teacher-card__button");
  btn.addEventListener("click", () => openModal(teacher));

  return card;
}

/* ------------------------------
   صفحه‌بندی
------------------------------ */
function renderPagination() {
  els.pagination.innerHTML = "";

  const totalPages = Math.ceil(state.filtered.length / state.pageSize);
  if (totalPages <= 1) {
    hide(els.pagination);
    return;
  }
  show(els.pagination);

  // دکمه قبلی
  els.pagination.appendChild(
    makePageBtn("‹", state.currentPage - 1, state.currentPage === 1)
  );

  // شماره صفحات
  for (let p = 1; p <= totalPages; p++) {
    const btn = makePageBtn(toFa(p), p, false);
    if (p === state.currentPage) {
      btn.classList.add("is-active");
      btn.setAttribute("aria-current", "page");
    }
    els.pagination.appendChild(btn);
  }

  // دکمه بعدی
  els.pagination.appendChild(
    makePageBtn("›", state.currentPage + 1, state.currentPage === totalPages)
  );
}

function makePageBtn(label, targetPage, disabled) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "pagination__btn";
  btn.textContent = label;
  btn.disabled = disabled;

  if (!disabled) {
    btn.addEventListener("click", () => goToPage(targetPage));
  }
  return btn;
}

function goToPage(page) {
  state.currentPage = page;
  renderGrid();
  renderPagination();

  els.grid.scrollIntoView({ behavior: "smooth", block: "start" });
}
/* ------------------------------
   نوار آمار
------------------------------ */
function updateStats() {
  setText(els.teachersCount, toFa(state.filtered.length));
  setText(
    els.currentFilterLabel,
    state.department === "all" ? "همه گروه‌ها" : state.department
  );
}

/* ------------------------------
   مودال جزئیات
------------------------------ */
function openModal(teacher) {
  setText(els.modalTeacherName, teacher.name);
  setText(els.modalDepartment, teacher.department || "—");
  setText(els.modalScore, `${formatScore(teacher.rating)} از ۵`);
  setText(els.modalReviewCount, toFa(teacher.reviewsCount || 0));
  setText(els.modalDescription, teacher.description || "توضیحی ثبت نشده است.");

  // لیست دروس
  els.modalCoursesList.innerHTML = "";
  const courses = teacher.courses || [];
  if (courses.length === 0) {
    const li = document.createElement("li");
    li.textContent = "درسی ثبت نشده است.";
    els.modalCoursesList.appendChild(li);
  } else {
    courses.forEach((c) => {
      const li = document.createElement("li");
      li.textContent = c;
      els.modalCoursesList.appendChild(li);
    });
  }

  els.modal.classList.add("is-open");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  els.modal.classList.remove("is-open");
  document.body.style.overflow = "";
}

/* ------------------------------
   اتصال رویدادها
------------------------------ */
function bindEvents() {
  els.themeToggle?.addEventListener("click", toggleTheme);

  els.searchInput?.addEventListener("input", (e) => {
    state.search = e.target.value;
    applyFilters();
  });

  els.departmentFilter?.addEventListener("change", (e) => {
    state.department = e.target.value;
    applyFilters();
  });

  els.pageSizeSelect?.addEventListener("change", (e) => {
    state.pageSize = Number(e.target.value) || 9;
    state.currentPage = 1;
    renderGrid();
    renderPagination();
  });

  // بستن مودال (کلیک روی Overlay یا دکمه ضربدر)
  els.modal.addEventListener("click", (e) => {
    if (e.target.hasAttribute("data-close")) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && els.modal.classList.contains("is-open")) {
      closeModal();
    }
  });
}

/* ------------------------------
   راه‌اندازی
------------------------------ */
function init() {
  initTheme();
  if (els.pageSizeSelect) {
    state.pageSize = Number(els.pageSizeSelect.value) || 9;
  }
  bindEvents();
  loadTeachers();
}

document.addEventListener("DOMContentLoaded", init);
