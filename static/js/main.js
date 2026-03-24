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
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 10) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // 滚动动画 (Reveal on Scroll)
    const revealElements = document.querySelectorAll('.reveal');
    
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // 只执行一次动画
            }
        });
    }, {
        root: null,
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });

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
