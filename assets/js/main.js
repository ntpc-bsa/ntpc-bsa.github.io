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

// 動態分頁功能
class DynamicPagination {
    constructor(containerId, paginationId, itemsPerPage = 8) {
        this.container = document.getElementById(containerId);
        this.pagination = document.getElementById(paginationId);
        this.itemsPerPage = itemsPerPage;
        this.currentPage = 1;
        this.items = [];
        
        if (this.container && this.pagination) {
            this.init();
        }
    }
    
    init() {
        // 獲取所有項目
        this.items = Array.from(this.container.querySelectorAll('.lesson-item'));
        
        if (this.items.length === 0) {
            this.pagination.style.display = 'none';
            return;
        }
        
        this.totalPages = Math.ceil(this.items.length / this.itemsPerPage);
        
        // 如果只有一頁，隱藏分頁
        if (this.totalPages <= 1) {
            this.pagination.style.display = 'none';
            return;
        }
        
        this.renderPagination();
        this.showPage(1);
    }
    
    renderPagination() {
        let paginationHTML = '';
        
        // 上一頁按鈕
        paginationHTML += `
            <a href="#" class="pagination-btn" data-page="prev" ${this.currentPage === 1 ? 'disabled' : ''}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/>
                </svg>
            </a>
        `;
        
        // 頁面數字按鈕
        for (let i = 1; i <= this.totalPages; i++) {
            if (i === this.currentPage) {
                paginationHTML += `<span class="current">${i}</span>`;
            } else {
                paginationHTML += `<a href="#" class="pagination-btn" data-page="${i}">${i}</a>`;
            }
        }
        
        // 下一頁按鈕
        paginationHTML += `
            <a href="#" class="pagination-btn" data-page="next" ${this.currentPage === this.totalPages ? 'disabled' : ''}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                </svg>
            </a>
        `;
        
        this.pagination.innerHTML = paginationHTML;
        this.bindEvents();
    }
    
    bindEvents() {
        const buttons = this.pagination.querySelectorAll('.pagination-btn');
        
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                
                if (button.hasAttribute('disabled')) {
                    return;
                }
                
                const page = button.dataset.page;
                
                if (page === 'prev') {
                    this.goToPage(this.currentPage - 1);
                } else if (page === 'next') {
                    this.goToPage(this.currentPage + 1);
                } else {
                    this.goToPage(parseInt(page));
                }
            });
        });
    }
    
    goToPage(page) {
        if (page < 1 || page > this.totalPages) {
            return;
        }
        
        this.currentPage = page;
        this.showPage(page);
        this.renderPagination();
        
        // 滾動到容器頂部
        this.container.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
    
    showPage(page) {
        const startIndex = (page - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        
        this.items.forEach((item, index) => {
            if (index >= startIndex && index < endIndex) {
                item.style.display = '';
                // 添加淡入動畫
                item.style.opacity = '0';
                item.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    item.style.transition = 'all 0.3s ease';
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0)';
                }, index * 50);
            } else {
                item.style.display = 'none';
            }
        });
    }
}

// 初始化分頁功能
document.addEventListener('DOMContentLoaded', function() {
    // 分頁功能已準備就緒
}); 