document.addEventListener('DOMContentLoaded', () => {
    // Delay rendering until all images are fully loaded
    document.body.classList.add('hidden');

    const images = Array.from(document.images);
    const unloaded = images.filter(img => !img.complete);

    if (unloaded.length === 0) {
        document.body.classList.remove('hidden');
        document.body.classList.add('ready');
    } else {
        let loadedCount = 0;
        unloaded.forEach(img => {
            img.addEventListener('load', checkAllLoaded, { once: true });
            img.addEventListener('error', checkAllLoaded, { once: true });
        });

        function checkAllLoaded() {
            loadedCount++;
            if (loadedCount === unloaded.length) {
                document.body.classList.remove('hidden');
                document.body.classList.add('ready');
            }
        }
    }

    const button = document.querySelector('.intro-button');
    const defaultSrc = button.dataset.src;
    const hoverSrc = button.dataset.hover;

    button.addEventListener('mouseenter', () => {
        button.src = hoverSrc;
    });

    button.addEventListener('mouseleave', () => {
        button.src = defaultSrc;
    });

    button.addEventListener('click', () => {
        window.location.href = 'pages/question1.html';
    });
});
