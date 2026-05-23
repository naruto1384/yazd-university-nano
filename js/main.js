// تابع برای باز/بسته کردن محتوای آکاردئون
function toggleContent(id) {
    const content = document.getElementById(id);
    if (!content) return;

    // بستن سایر آکاردئون‌ها
    document.querySelectorAll('.content-box').forEach(item => {
        if (item !== content) {
            item.classList.remove('active');
        }
    });
    
    // باز/بسته کردن با افکت
    content.classList.toggle('active');

    // اگر آکاردئون باز شد، کمی اسکرول به سمت آن (برای تجربه کاربری بهتر در موبایل)
    if (content.classList.contains('active')) {
        setTimeout(() => {
            content.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 300); // تأخیر کوتاه برای هماهنگی با انیمیشن CSS
    }
}

// تابع برای باز کردن تصویر در مودال
function openImage(img) {
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImg");
    
    if (modal && modalImg) {
        modalImg.src = img.src;
        // اضافه کردن یک کلاس برای انیمیشن ورود مودال
        modal.classList.add("active");
        document.body.style.overflow = 'hidden'; // جلوگیری از اسکرول صفحه اصلی
    }
}

// تابع برای بستن مودال تصویر
function closeImage() {
    const modal = document.getElementById("imageModal");
    if (modal) {
        modal.classList.remove("active");
        document.body.style.overflow = ''; // بازگرداندن اسکرول
    }
}

// بستن مودال با کلید Escape یا کلیک خارج از تصویر
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeImage(); });
