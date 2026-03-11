document.addEventListener('DOMContentLoaded', () => {
    // 简单的页面载入淡入效果
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);

    console.log("Blog frontend loaded.");
});
