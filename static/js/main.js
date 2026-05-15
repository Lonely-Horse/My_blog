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
    // 关键修复点：
    // 1) 已经在视口里/视口之上的元素，立即激活（不依赖 IntersectionObserver 触发）。
    //    这样能解决「超长文章 .article-container.reveal 因可见比过低而永远不被激活，
    //    导致整个正文 opacity:0 不显示」的问题。
    // 2) 视口下方的元素仍然走 IntersectionObserver 做入场动画，主题/动画效果不变。
    // 3) 兜底：1 秒后强制激活所有未激活的 .reveal，保证内容永远不会因为脚本异常而消失。
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
            threshold: 0,
            rootMargin: '0px 0px -50px 0px'
        });
    }

    // 与 rootMargin: '0 0 -50px 0' 对齐：顶部进入视口下沿 50px 以上才算"已可见"
    const visibleEdge = viewportH - 50;

    revealElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        // 元素顶部已越过 visibleEdge -> 立即激活
        if (rect.top < visibleEdge) {
            activate(el);
            return;
        }
        // 否则延后到滚动到视口时再激活
        if (revealObserver) {
            revealObserver.observe(el);
        } else {
            // 不支持 IntersectionObserver 的退化路径：直接全部激活
            activate(el);
        }
    });

    // 兜底定时器：1 秒后只对结构性容器（.article-container）强制显现，
    // 防止超长文章因任何原因导致整篇正文被 opacity:0 隐藏；
    // 段落级 .reveal 仍保留滚动入场动画（CSS 层已经让 .article-container 永远可见，
    // 子段落即使没激活也只是缺少入场动画，不会消失）。
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
