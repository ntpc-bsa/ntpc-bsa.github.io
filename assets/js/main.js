// 當頁面載入完成時執行
document.addEventListener('DOMContentLoaded', function() {
    // 下拉選單切換
    const menuToggle = document.getElementById('menuToggle');
    const dropdownMenu = document.getElementById('dropdownMenu');
    
    if (menuToggle && dropdownMenu) {
        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdownMenu.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });
        
        // 點擊頁面其他地方關閉選單
        document.addEventListener('click', function(e) {
            if (!menuToggle.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownMenu.classList.remove('active');
                menuToggle.classList.remove('active');
            }
        });
        
        // 點擊選單項目後關閉選單
        const navLinks = dropdownMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                dropdownMenu.classList.remove('active');
                menuToggle.classList.remove('active');
            });
        });
    }
    
    // 回到頂部按鈕
    const backToTopBtn = document.getElementById('backToTop');
    
    if (backToTopBtn) {
        // 監聽滾動事件
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        });
        
        // 點擊回到頂部
        backToTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    // 新聞輪播功能
    initNewsCarousel();
    
    // 平滑滾動
    initSmoothScroll();
});

// 新聞輪播初始化
function initNewsCarousel() {
    const newsGrid = document.querySelector('.news-grid');
    if (!newsGrid) return;
    
    // 如果有新聞項目，可以在此處添加輪播邏輯
    const newsItems = newsGrid.querySelectorAll('.news-item');
    if (newsItems.length > 0) {
        // 為新聞項目添加動畫效果
        newsItems.forEach((item, index) => {
            item.style.animationDelay = `${index * 0.2}s`;
            item.classList.add('fade-in');
        });
    }
}

// 平滑滾動初始化
function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// 圖片懶載入
function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                observer.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// 分頁功能
function initPagination() {
    const paginationContainer = document.querySelector('.pagination');
    if (!paginationContainer) return;
    
    const paginationLinks = paginationContainer.querySelectorAll('a');
    
    paginationLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 移除所有活動狀態
            paginationContainer.querySelectorAll('.current').forEach(current => {
                current.classList.remove('current');
            });
            
            // 添加當前活動狀態
            this.classList.add('current');
            
            // 這裡可以添加載入新內容的邏輯
            loadPageContent(this.dataset.page);
        });
    });
}

// 載入頁面內容（用於分頁）
function loadPageContent(page) {
    // 這裡可以通過 AJAX 載入新的內容
    console.log('Loading page:', page);
    
    // 滾動到頂部
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// 表單驗證
function initFormValidation() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            if (!validateForm(this)) {
                e.preventDefault();
            }
        });
    });
}

function validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('error');
            isValid = false;
        } else {
            field.classList.remove('error');
        }
    });
    
    return isValid;
}

// 搜尋功能
function initSearch() {
    const searchInput = document.querySelector('.search-input');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        filterContent(searchTerm);
    });
}

function filterContent(searchTerm) {
    const items = document.querySelectorAll('.news-item, .lesson-item, .photo-item');
    
    items.forEach(item => {
        const title = item.querySelector('.news-title, .lesson-title, .photo-title');
        const content = item.querySelector('.news-excerpt, .lesson-description');
        
        if (title || content) {
            const text = (title ? title.textContent : '') + (content ? content.textContent : '');
            
            if (text.toLowerCase().includes(searchTerm) || searchTerm === '') {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        }
    });
}

// 載入更多內容
function loadMoreContent(type) {
    // 這裡可以通過 AJAX 載入更多內容
    console.log('Loading more content of type:', type);
    
    // 顯示載入指示器
    showLoadingIndicator();
    
    // 模擬 AJAX 請求
    setTimeout(() => {
        hideLoadingIndicator();
        // 添加新內容到頁面
    }, 1000);
}

function showLoadingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'loading-indicator';
    indicator.textContent = '載入中...';
    document.body.appendChild(indicator);
}

function hideLoadingIndicator() {
    const indicator = document.querySelector('.loading-indicator');
    if (indicator) {
        indicator.remove();
    }
}

// 初始化所有功能
function initializeApp() {
    initLazyLoading();
    initPagination();
    initFormValidation();
    initSearch();
}

// 等待頁面完全載入後初始化應用
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
} 