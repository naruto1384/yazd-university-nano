document.addEventListener("DOMContentLoaded", function () {
  const body = document.body;
  const toggleButton = document.querySelector(".theme-toggle");
  const savedTheme = localStorage.getItem("theme");

  // اگر کاربر قبلاً تم انتخاب کرده باشد
  if (savedTheme === "dark") {
    body.classList.add("dark");
  } else if (savedTheme === "light") {
    body.classList.remove("dark");
  } else {
    // اگر تم ذخیره نشده بود، تم سیستم بررسی شود
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (prefersDark) {
      body.classList.add("dark");
    }
  }

  // تغییر تم با کلیک روی دکمه
  if (toggleButton) {
    toggleButton.addEventListener("click", function () {
      body.classList.toggle("dark");

      if (body.classList.contains("dark")) {
        localStorage.setItem("theme", "dark");
      } else {
        localStorage.setItem("theme", "light");
      }
    });
  }
});
