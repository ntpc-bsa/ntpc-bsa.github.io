// 照片輪播功能
let currentPhotoSlideIndex = 0;
let photoSlides = [];

// 初始化照片輪播
document.addEventListener('DOMContentLoaded', function() {
    photoSlides = document.querySelectorAll('.photo-carousel-slide');
    const dots = document.querySelectorAll('.photo-carousel-dot');
    
    if (photoSlides.length > 0) {
        showPhotoSlide(0);
        // 自動輪播 - 每5秒切換一次
        setInterval(() => {
            movePhotoCarousel(1);
        }, 5000);
    }
});

// 顯示指定照片幻燈片
function showPhotoSlide(n) {
    const wrapper = document.querySelector('.photo-carousel-wrapper');
    const dots = document.querySelectorAll('.photo-carousel-dot');
    
    if (!wrapper || photoSlides.length === 0) return;
    
    currentPhotoSlideIndex = n;
    
    // 循環輪播
    if (currentPhotoSlideIndex >= photoSlides.length) {
        currentPhotoSlideIndex = 0;
    }
    if (currentPhotoSlideIndex < 0) {
        currentPhotoSlideIndex = photoSlides.length - 1;
    }
    
    // 移動輪播
    wrapper.style.transform = `translateX(-${currentPhotoSlideIndex * 100}%)`;
    
    // 更新指示器
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentPhotoSlideIndex);
    });
}

// 移動照片輪播
function movePhotoCarousel(direction) {
    showPhotoSlide(currentPhotoSlideIndex + direction);
}

// 點擊指示器切換照片幻燈片
function goToPhotoSlide(n) {
    showPhotoSlide(n - 1);
} 