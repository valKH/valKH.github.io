function parseRGBString(rgbString) {
    return rgbString
        .match(/\d+/g) // extract all numeric values
        .map(Number);  // convert to integers
}

// function processEditedImage() {
//     const dataUrl = sessionStorage.getItem('editedImage');
//     if (!dataUrl) {
//         console.error('No edited image found in sessionStorage');
//         return;
//     }
//     const cacheBuster = `#t=${Date.now()}`; // trick the browser
//
//     const replaceFrom = parseRGBString(sessionStorage.getItem('themeBackground'));
//     const replaceTo = [0, 0, 0, 255]
//     const img = new Image();
//
//     img.onload = () => {
//         const canvas = document.createElement('canvas');
//         canvas.width = img.width;
//         canvas.height = img.height;
//
//         const ctx = canvas.getContext('2d');
//         ctx.drawImage(img, 0, 0);
//
//         // Replace pixels
//         const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
//         const data = imageData.data;
//
//         for (let i = 0; i < data.length; i += 4) {
//             const r = data[i];
//             const g = data[i + 1];
//             const b = data[i + 2];
//             const a = data[i + 3];
//
//             if (
//                 r === replaceFrom[0] &&
//                 g === replaceFrom[1] &&
//                 b === replaceFrom[2] &&
//                 a === (replaceFrom[3] ?? 255)
//             ) {
//                 data[i]     = replaceTo[0];
//                 data[i + 1] = replaceTo[1];
//                 data[i + 2] = replaceTo[2];
//                 data[i + 3] = replaceTo[3] ?? 255;
//             }
//         }
//
//         ctx.putImageData(imageData, 0, 0);
//
//         // For use later: save modified image as new base64
//         const newDataUrl = canvas.toDataURL('image/png');
//         sessionStorage.setItem('editedImageProcessed', newDataUrl);
//
//         // Optional: inject into DOM
//         const preview = document.createElement('img');
//         preview.src = newDataUrl;
//         document.body.appendChild(preview);
//     };
//     img.src = dataUrl + cacheBuster;
// }

function processEditedImage() {
    return new Promise((resolve, reject) => {
        const dataUrl = sessionStorage.getItem('editedImage');
        if (!dataUrl) {
            console.error('No edited image found in sessionStorage');
            reject();
            return;
        }

        const cacheBuster = `#t=${Date.now()}`;
        const replaceFrom = parseRGBString(sessionStorage.getItem('themeBackground'));
        const replaceTo = [0, 0, 0, 255];
        const img = new Image();

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                const [r, g, b, a] = data.slice(i, i + 4);
                if (
                    r === replaceFrom[0] &&
                    g === replaceFrom[1] &&
                    b === replaceFrom[2] &&
                    a === (replaceFrom[3] ?? 255)
                ) {
                    data[i]     = replaceTo[0];
                    data[i + 1] = replaceTo[1];
                    data[i + 2] = replaceTo[2];
                    data[i + 3] = replaceTo[3] ?? 255;
                }
            }

            ctx.putImageData(imageData, 0, 0);
            const newDataUrl = canvas.toDataURL('image/png');
            sessionStorage.setItem('editedImageProcessed', newDataUrl);

            resolve(newDataUrl);
        };

        img.onerror = reject;
        img.src = dataUrl + cacheBuster;
    });
}


document.addEventListener('DOMContentLoaded', async () => {
    // // Delay rendering until all images are fully loaded
    // document.body.classList.add('hidden');
    //
    // const images = Array.from(document.images);
    // const unloaded = images.filter(img => !img.complete);
    //
    // if (unloaded.length === 0) {
    //     document.body.classList.remove('hidden');
    //     document.body.classList.add('ready');
    // } else {
    //     let loadedCount = 0;
    //     unloaded.forEach(img => {
    //         img.addEventListener('load', checkAllLoaded, { once: true });
    //         img.addEventListener('error', checkAllLoaded, { once: true });
    //     });
    //
    //     function checkAllLoaded() {
    //         loadedCount++;
    //         if (loadedCount === unloaded.length) {
    //             document.body.classList.remove('hidden');
    //             document.body.classList.add('ready');
    //         }
    //     }
    // }

    // document.querySelectorAll('img[src]').forEach(img => {
    //     const src = img.getAttribute('src');
    //     // Avoid rebusting already busted URLs
    //     if (!src.includes('?t=')) {
    //         img.setAttribute('src', `${src}?t=${Date.now()}`);
    //     }
    // });

    const grid = document.getElementById('gallery-grid');

    const imageUrls = [];

    await processEditedImage()
    // 1st image: last result from sessionStorage
    const lastResult = sessionStorage.getItem('editedImageProcessed');
    const cacheBuster = `#t=${Date.now()}`; // trick the browser
    if (lastResult) {
        imageUrls.push(lastResult + cacheBuster);
    }

    // Remaining 16 images: placeholders or preloaded
    for (let i = 1; i <= 17; i++) {
        imageUrls.push(`../svgs/gallery/preloaded_${i}.svg`);
    }

    // Render rows
    for (let row = 0; row < 3; row++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'gallery-row';

        for (let col = 0; col < 6; col++) {
            const index = row * 6 + col;
            if (index > imageUrls.length) {
                break; // No more images to display
            }
            const img = document.createElement('img');
            img.className = 'gallery-image';
            img.src = imageUrls[index];
            rowDiv.appendChild(img);
        }

        grid.appendChild(rowDiv);
    }

    document.querySelectorAll('img[src]').forEach(img => {
        const src = img.getAttribute('src');
        // Avoid rebusting already busted URLs
        if (!src.includes('?t=')) {
            img.setAttribute('src', `${src}?t=${Date.now()}`);
        }
    });

    const logo = document.querySelector('#gallery-title');
    if (logo) {
        logo.addEventListener('click', () => {
            window.location.href = '../index.html';
        });
    }
});
