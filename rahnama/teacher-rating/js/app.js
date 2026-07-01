/* =====================================================
   سامانه ارزیابی اساتید — منطق برنامه
   هماهنگ با ساختار HTML و CSS بازطراحی‌شده
===================================================== */

"use strict";

/* ------------------------------
   تنظیمات Supabase
------------------------------ */
const SUPABASE_URL = "https://suxuwbqjfuozahbdmbol.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_A3-m3J9kIcl1SEyvXd1HGw_VSql7OB6";
const SUPABASE_REST_URL = `${SUPABASE_URL}/rest/v1`;

/* ------------------------------
   شناسه دستگاه (Device ID)
------------------------------ */
function getDeviceId() {
  let deviceId = localStorage.getItem("device_id");
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem("device_id", deviceId);
  }
  return deviceId;
}

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
  selectedRating: 0,
  currentTeacher: null,
  existingUserRating: null,
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

  // امتیازدهی
  ratingStars: document.querySelectorAll(".star-rating__star"),
  userComment: document.getElementById("userComment"),
  submitRating: document.getElementById("submitRating"),
};

/* ------------------------------
   نگاشت کلاس badge برای سختی و حضورغیاب
------------------------------ */
const difficultyClass = {
  آسان: "badge--success",
  متوسط: "badge--warning",
  سخت: "badge--danger",
};

const attendanceClass = {
  آزاد: "badge--success",
  معمولی: "badge--warning",
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
   مدیریت ستاره‌های امتیازدهی
------------------------------ */
function highlightStars(rating) {
  els.ratingStars.forEach((star, idx) => {
    star.classList.toggle("active", idx < rating);
  });
}

function setupStarRating() {
  els.ratingStars.forEach((star, idx) => {
    star.addEventListener("click", () => {
      state.selectedRating = idx + 1;
      highlightStars(state.selectedRating);
    });
  });
}

/* ------------------------------
   بارگذاری امتیاز قبلی کاربر
------------------------------ */
async function loadUserRating(teacherId) {
  const deviceId = getDeviceId();
  const url = `${SUPABASE_REST_URL}/student_ratings?teacher_id=eq.${teacherId}&device_id=eq.${deviceId}&select=score,comment`;

  try {
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.length > 0 ? data[0] : null;
  } catch {
    return null;
  }
}

/* ------------------------------
   ارسال/ویرایش امتیاز
------------------------------ */
async function submitRating() {
  if (!state.currentTeacher) return;

  const teacherId = state.currentTeacher.id;
  const deviceId = getDeviceId();
  const score = state.selectedRating;
  const comment = els.userComment.value.trim();

  if (!score) {
    alert("لطفاً امتیاز را انتخاب کنید.");
    return;
  }

  const method = state.existingUserRating ? "PATCH" : "POST";
  const url = state.existingUserRating
    ? `${SUPABASE_REST_URL}/student_ratings?teacher_id=eq.${teacherId}&device_id=eq.${deviceId}`
    : `${SUPABASE_REST_URL}/student_ratings`;

  const body = { teacher_id: teacherId, device_id: deviceId, score, comment };

  try {
    const res = await fetch(url, {
      method,
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error("خطا در ثبت امتیاز");

    alert(
      state.existingUserRating ? "امتیاز شما ویرایش شد." : "امتیاز شما ثبت شد."
    );
    closeModal();
    await loadTeachers();
  } catch (err) {
    console.error(err);
    alert("خطا در ثبت امتیاز.");
  }
}

/* ------------------------------
   بارگذاری داده‌ها از Supabase
------------------------------ */
async function loadTeachers() {
  showLoading(true);

  try {
    const url = `${SUPABASE_REST_URL}/teachers?select=*`;

    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();

    state.teachers = data.map((t) => ({
      id: t.id,
      name: t.name,
      department: t.department,
      courses: t.courses || [],
      difficulty: t.difficulty_level,
      attendance: t.attendance_policy,
      description: t.description,
      rating: t.rating || 0,
      reviewsCount: t.reviews_count || 0,
      totalScoreSum: t.total_score_sum || 0,
    }));

    showLoading(false);
    populateDepartments();
    applyFilters();
  } catch (err) {
    console.error("خطا در بارگذاری اساتید از Supabase:", err);
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
  const unique = [...new Set(state.teachers.map((t) => t.department))].sort();

  const currentVal = els.departmentFilter.value;
  els.departmentFilter.innerHTML = '<option value="all">همه گروه‌ها</option>';

  unique.forEach((dep) => {
    const opt = document.createElement("option");
    opt.value = dep;
    opt.textContent = dep;
    els.departmentFilter.appendChild(opt);
  });

  if (unique.includes(currentVal)) {
    els.departmentFilter.value = currentVal;
  } else {
    els.departmentFilter.value = "all";
  }
}

/* ------------------------------
   اعمال فیلترها
------------------------------ */
function applyFilters() {
  const searchTerm = state.search.toLowerCase();
  const dept = state.department;

  state.filtered = state.teachers.filter((t) => {
    const matchSearch =
      searchTerm === "" || t.name.toLowerCase().includes(searchTerm);
    const matchDept = dept === "all" || t.department === dept;
    return matchSearch && matchDept;
  });

  state.currentPage = 1;
  updateStats();
  renderTeachers();
  renderPagination();
}

/* ------------------------------
   به‌روزرسانی آمار
------------------------------ */
function updateStats() {
  const total = state.filtered.length;
  setText(els.teachersCount, toFa(total));

  let filterLabel = "همه اساتید";
  if (state.department !== "all") {
    filterLabel = state.department;
  }
  if (state.search) {
    filterLabel += ` · جستجو: "${state.search}"`;
  }
  setText(els.currentFilterLabel, filterLabel);
}

/* ------------------------------
   رندر کارت‌های اساتید
------------------------------ */
function renderTeachers() {
  hideAllStates();
  hide(els.pagination);

  if (state.filtered.length === 0) {
    els.grid.innerHTML = "";
    show(els.emptyState);
    return;
  }

  const start = (state.currentPage - 1) * state.pageSize;
  const end = start + state.pageSize;
  const page = state.filtered.slice(start, end);

  els.grid.innerHTML = "";

  page.forEach((teacher) => {
    const clone = els.cardTemplate.content.cloneNode(true);

    const card = clone.querySelector(".teacher-card");
    card.dataset.teacherId = teacher.id;

    setText(clone.querySelector(".teacher-card__name"), teacher.name);
    setText(clone.querySelector(".teacher-card__department"), teacher.department);
    setText(clone.querySelector(".teacher-card__rating-value"), formatScore(teacher.rating));

    const difficultyBadge = clone.querySelector(".teacher-card__difficulty");
    difficultyBadge.textContent = teacher.difficulty;
    difficultyBadge.classList.add(
      difficultyClass[teacher.difficulty] || "badge--success"
    );

    const attendanceBadge = clone.querySelector(".teacher-card__attendance");
    attendanceBadge.textContent = teacher.attendance;
    attendanceBadge.classList.add(
      attendanceClass[teacher.attendance] || "badge--success"
    );

    setText(
      clone.querySelector(".teacher-card__courses"),
      teacher.courses.length > 0 ? `${toFa(teacher.courses.length)} درس` : "—"
    );
    setText(
      clone.querySelector(".teacher-card__reviews"),
      `${toFa(teacher.reviewsCount)} نظر`
    );

    els.grid.appendChild(clone);
  });

  show(els.pagination);
}

/* ------------------------------
   رندر صفحه‌بندی
------------------------------ */
function renderPagination() {
  const total = state.filtered.length;
  const totalPages = Math.ceil(total / state.pageSize);

  if (totalPages <= 1) {
    hide(els.pagination);
    return;
  }

  els.pagination.innerHTML = "";

  // دکمه قبلی
  const prevBtn = document.createElement("button");
  prevBtn.textContent = "قبلی";
  prevBtn.disabled = state.currentPage === 1;
  prevBtn.addEventListener("click", () => {
    if (state.currentPage > 1) {
      state.currentPage--;
      renderTeachers();
      renderPagination();
    }
  });
  els.pagination.appendChild(prevBtn);

  // شماره صفحات
  for (let i = 1; i <= totalPages; i++) {
    const pageBtn = document.createElement("button");
    if (i === state.currentPage) {
      pageBtn.classList.add("is-active");
    }
    pageBtn.textContent = toFa(i);
    pageBtn.addEventListener("click", () => {
      state.currentPage = i;
      renderTeachers();
      renderPagination();
    });
    els.pagination.appendChild(pageBtn);
  }

  // دکمه بعدی
  const nextBtn = document.createElement("button");
  nextBtn.textContent = "بعدی";
  nextBtn.disabled = state.currentPage === totalPages;
  nextBtn.addEventListener("click", () => {
    if (state.currentPage < totalPages) {
      state.currentPage++;
      renderTeachers();
      renderPagination();
    }
  });
  els.pagination.appendChild(nextBtn);

  show(els.pagination);
}

/* ------------------------------
   باز کردن مودال
------------------------------ */
async function openModal(teacher) {
  state.currentTeacher = teacher;

  setText(els.modalTeacherName, teacher.name);
  setText(els.modalDepartment, teacher.department);
  setText(els.modalScore, formatScore(teacher.rating));
  setText(els.modalReviewCount, `${toFa(teacher.reviewsCount)} نظر`);

  const descEl = els.modal.querySelector(".modal__description-text");
  if (descEl) {
    descEl.textContent = teacher.description || "توضیحی ثبت نشده است.";
  }

  // دروس
  els.modalCoursesList.innerHTML = "";
  if (teacher.courses && teacher.courses.length > 0) {
    teacher.courses.forEach((course) => {
      const li = document.createElement("li");
      li.textContent = course;
      els.modalCoursesList.appendChild(li);
    });
  } else {
    const li = document.createElement("li");
    li.textContent = "بدون درس ثبت‌شده";
    els.modalCoursesList.appendChild(li);
  }

  // بارگذاری امتیاز قبلی کاربر
  state.existingUserRating = await loadUserRating(teacher.id);

  if (state.existingUserRating) {
    state.selectedRating = state.existingUserRating.score;
    els.userComment.value = state.existingUserRating.comment || "";
    highlightStars(state.selectedRating);
  } else {
    state.selectedRating = 0;
    els.userComment.value = "";
    highlightStars(0);
  }

  els.modal.classList.add("is-open");
}

/* ------------------------------
   بستن مودال
------------------------------ */
function closeModal() {
  els.modal.classList.remove("is-open");
  state.currentTeacher = null;
  state.existingUserRating = null;
  state.selectedRating = 0;
  els.userComment.value = "";
  highlightStars(0);
}

/* ------------------------------
   اتصال event listenerها
------------------------------ */
function attachListeners() {
  // تغییر تم
  if (els.themeToggle) {
    els.themeToggle.addEventListener("click", toggleTheme);
  }

  // جستجو
  if (els.searchInput) {
    els.searchInput.addEventListener("input", (e) => {
      state.search = e.target.value.trim();
      applyFilters();
    });
  }

  // فیلتر گروه
  if (els.departmentFilter) {
    els.departmentFilter.addEventListener("change", (e) => {
      state.department = e.target.value;
      applyFilters();
    });
  }

  // تعداد در صفحه
  if (els.pageSizeSelect) {
    els.pageSizeSelect.addEventListener("change", (e) => {
      state.pageSize = parseInt(e.target.value, 10);
      state.currentPage = 1;
      renderTeachers();
      renderPagination();
    });
  }

  // بستن مودال
  if (els.modal) {
    els.modal.addEventListener("click", (e) => {
      if (
        e.target === els.modal ||
        e.target.classList.contains("modal__close") ||
        e.target.closest(".modal__close")
      ) {
        closeModal();
      }
    });
  }

  // ثبت امتیاز
  if (els.submitRating) {
    els.submitRating.addEventListener("click", submitRating);
  }

  // event delegation برای دکمه «مشاهده جزئیات»
  if (els.grid) {
    els.grid.addEventListener("click", (e) => {
      const btn = e.target.closest(".teacher-card__button");
      if (!btn) return;

      const card = btn.closest(".teacher-card");
      if (!card) return;

      const id = parseInt(card.dataset.teacherId, 10);
      const teacher = state.teachers.find((t) => t.id === id);
      if (teacher) {
        openModal(teacher);
      }
    });
  }
}

/* ------------------------------
   راه‌اندازی
------------------------------ */
async function init() {
  initTheme();
  setupStarRating();
  attachListeners();
  await loadTeachers();
}

/* ------------------------------
   اجرا
------------------------------ */
document.addEventListener("DOMContentLoaded", init);
