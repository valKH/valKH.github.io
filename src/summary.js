function roundToNearest5(value) {
    return Math.floor(value / 5) * 5;
}

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

    document.querySelectorAll('img[src]').forEach(img => {
        const src = img.getAttribute('src');
        // Avoid rebusting already busted URLs
        if (!src.includes('?t=')) {
            img.setAttribute('src', `${src}?t=${Date.now()}`);
        }
    });

    const bgColor = sessionStorage.getItem('themeBackground');
    if (bgColor) {
        document.body.style.backgroundColor = bgColor;
    }

    const canvas = document.getElementById('summary-canvas');
    const ctx = canvas.getContext('2d');
    const imageDataUrl = sessionStorage.getItem('editedImage');

    if (!imageDataUrl) {
        console.error("No image data found.");
        return;
    }

    const img = new Image();
    img.onload = () => {
        // Resize canvas to match an image ratio within height constraint
        const maxHeight = window.innerHeight;
        const maxWidth = window.innerWidth;
        const ratio = img.width / img.height;

        const targetHeight = Math.min(maxHeight, maxWidth / ratio);

        canvas.width = targetHeight * ratio;
        canvas.height = targetHeight;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = imageDataUrl;


    const distortion = parseInt(sessionStorage.getItem('distortionScore'), 10);
    const scaleEl = document.querySelector('.scale-value');
    const textImg = document.getElementById('summary-text-svg');

    if (!isNaN(distortion)) {
        scaleEl.textContent = `${distortion}%`;

        const textMap = [
            { min: 0, max: 9, file: '0-10.svg' },
            { min: 10, max: 19, file: '10-20.svg' },
            { min: 20, max: 29, file: '20-30.svg' },
            { min: 30, max: 39, file: '30-40.svg' },
            { min: 40, max: 49, file: '40-50.svg' },
            { min: 50, max: 59, file: '50-60.svg' },
            { min: 60, max: 69, file: '60-70.svg' },
            { min: 70, max: 79, file: '70-80.svg' },
            { min: 80, max: 89, file: '80-90.svg' },
            { min: 90, max: 100, file: '90-100.svg' },
        ];

        const match = textMap.find(entry => distortion >= entry.min && distortion <= entry.max);
        if (match) {
            textImg.src = `../svgs/texts/${match.file}?t=${Date.now()}`;
        } else {
            console.warn("No matching text range found");
        }

        const barImg = document.getElementById('bar-fill-img');
        const rounded = roundToNearest5(distortion);
        barImg.src = `../svgs/barfilling/${rounded}.svg?t=${Date.now()}`;
    }

    const doneButton = document.getElementById('done-button')
    const doneImg = doneButton.querySelector('img');

    const defaultSrc = doneImg.dataset.src;
    const hoverSrc = doneImg.dataset.hover;

    doneButton.addEventListener('mouseenter', () => {
        doneImg.src = hoverSrc;
    });

    doneButton.addEventListener('mouseleave', () => {
        doneImg.src = defaultSrc;
    });


    doneButton.addEventListener('click', () => {
        console.log("Done button clicked, redirecting to gallery.html");
        window.location.href = 'gallery.html';
    });

    const logo = document.querySelector('#page-title');
    if (logo) {
        logo.addEventListener('click', () => {
            window.location.href = '../index.html';
        });
    }
});

