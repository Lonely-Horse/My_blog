document.addEventListener('DOMContentLoaded', () => {
    // 简单的页面载入淡入效果
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.6s ease-out';
        document.body.style.opacity = '1';
    }, 50);

    // 移动端菜单逻辑
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('nav-open');
            // 切换汉堡图标
            if (navLinks.classList.contains('nav-open')) {
                menuToggle.innerHTML = '✕';
            } else {
                menuToggle.innerHTML = '☰';
            }
        });
    }

    // Header 滚动状态
    const header = document.querySelector('.floating-header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 10) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // 💥 主题切换交互系统 (Theme Switcher Logic)
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            let targetTheme = 'light';

            if (currentTheme !== 'dark') {
                targetTheme = 'dark';
            }

            // 平滑过渡体验：在 body 上临时加过渡，之后移除防止滚动卡顿
            document.documentElement.style.setProperty('--transition', 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)');
            document.body.style.transition = 'background-color 0.5s ease, color 0.5s ease, border-color 0.5s ease';
            
            document.documentElement.setAttribute('data-theme', targetTheme);
            localStorage.setItem('theme', targetTheme);

            setTimeout(() => {
                document.body.style.transition = '';
            }, 600);
        });
    }

    // 占位图懒加载与异常降级逻辑 (Modern Lazy-load and Fallback)
    const lazyImages = document.querySelectorAll('img.lazy-img');
    
    // 创建一个本地 SVG 灰蓝色带有折线波形图的轻科技感占位矢量图，防止发起网络请求拉取默认图
    const fallbackSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450"><rect width="800" height="450" fill="%23f1f5f9"/><path d="M 0 225 C 200 120, 200 330, 400 225 C 600 120, 600 330, 800 225" fill="none" stroke="%233b82f6" stroke-width="2" opacity="0.15"/><path d="M 0 225 L 800 225" fill="none" stroke="%23e2e8f0" stroke-width="1"/></svg>`;

    const observerOptions = {
        root: null,
        rootMargin: '100px 0px 100px 0px', // 提前 100px 开始拉取真实图片
        threshold: 0
    };

    const loadImage = (img) => {
        const src = img.getAttribute('data-src');
        if (!src) return;

        // 绑定加载事件以在加载成功后移除骨架屏遮罩
        img.addEventListener('load', () => {
            img.classList.add('loaded');
            // 成功后移除父级容器的骨架抖动效果
            const parent = img.closest('.card-image-box');
            if (parent) {
                parent.classList.remove('skeleton-shimmer');
            }
        }, { once: true });

        // 绑定加载失败事件，在发生网络错误或超时时，使用漂亮的内置 SVG 作为回退占位，避免布局塌陷
        img.addEventListener('error', () => {
            img.src = fallbackSvg;
            img.classList.add('loaded');
            const parent = img.closest('.card-image-box');
            if (parent) {
                parent.classList.remove('skeleton-shimmer');
                parent.classList.add('image-failed');
            }
        }, { once: true });

        img.src = src;
    };

    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loadImage(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        lazyImages.forEach(img => imageObserver.observe(img));
    } else {
        // 退化方案：如果不兼容 Observer，立即载入所有图片
        lazyImages.forEach(img => loadImage(img));
    }

    // 滚动动画 (Reveal on Scroll)
    const revealElements = document.querySelectorAll('.reveal');
    const activate = (el) => el.classList.add('active');
    const supportsIO = 'IntersectionObserver' in window;
    const viewportH = window.innerHeight || document.documentElement.clientHeight;

    let revealObserver = null;
    if (supportsIO) {
        revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    activate(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            root: null,
            threshold: 0.05,
            rootMargin: '0px 0px -40px 0px'
        });
    }

    const visibleEdge = viewportH - 40;
    revealElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < visibleEdge) {
            activate(el);
            return;
        }
        if (revealObserver) {
            revealObserver.observe(el);
        } else {
            activate(el);
        }
    });

    setTimeout(() => {
        document.querySelectorAll('.article-container.reveal').forEach(el => {
            if (!el.classList.contains('active')) {
                activate(el);
            }
        });
    }, 1000);

    // 高亮当前导航页
    const currentPath = window.location.pathname;
    const navItems = document.querySelectorAll('.nav-links a');
    navItems.forEach(item => {
        const itemPath = item.getAttribute('href');
        if (itemPath === currentPath || (itemPath !== '/' && currentPath.startsWith(itemPath))) {
            item.classList.add('active');
        } else if (itemPath === '/' && currentPath === '/') {
            item.classList.add('active');
        }
    });

    console.log("Blog frontend optimized logic loaded.");
});
