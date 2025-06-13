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

    const container = document.querySelector('.question-container');
    if (!container) return;

    const questionNumber = parseInt(container.dataset.question, 10); // fix: ensure number

    document.querySelectorAll('.answer-button').forEach(button => {
        const defaultSrc = button.dataset.src;
        const hoverSrc = button.dataset.hover;

        button.addEventListener('mouseenter', () => {
            button.src = hoverSrc;
        });

        button.addEventListener('mouseleave', () => {
            button.src = defaultSrc;
        });

        button.addEventListener('click', () => {
            const answer = button.dataset.answer;
            localStorage.setItem(`answer${questionNumber}`, answer);

            // determine next page
            if (questionNumber === 1) {
                window.location.href = 'question2.html';
            } else if (questionNumber === 2) {
                window.location.href = 'question3.html';
            } else {
                // question 3 → go to the main screen
                window.location.href = 'main.html';
            }
        });
    });
});
