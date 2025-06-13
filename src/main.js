const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let currentBrush = 'vortex';
let brushCursor = { x: -100, y: -100 };
let backgroundImage = null;
let workingImageData = null;
let initialImageData = null;

let holdInterval = null;
let holdPosition = null;
let pulsePhase = 0;
let isDragging = false;
let lastBrushPos = null;


// Canvas setup - start here
const displayHeight = window.innerHeight;
const scaleFactor = 2;

canvas.height = displayHeight * scaleFactor;
canvas.style.height = `${displayHeight}px`;
let totalPixels = canvas.width * canvas.height;

async function loadSVGtoCanvasHighRes(url, themeBaseColor = 'white') {
    return new Promise(async (resolve, reject) => {
        try {
            const response = await fetch(url);
            const svgText = await response.text();
            const svgBlob = new Blob([svgText], { type: 'image/svg+xml' });
            const urlObject = URL.createObjectURL(svgBlob);
            const img = new Image();

            img.onload = () => {
                const aspectRatio = img.width / img.height;

                const displayHeight = window.innerHeight;
                const displayWidth = displayHeight * aspectRatio;

                canvas.style.width = `${displayWidth}px`;
                canvas.width = displayWidth * scaleFactor;
                canvas.height = displayHeight * scaleFactor;

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = themeBaseColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                URL.revokeObjectURL(urlObject);
                backgroundImage = img;

                initialImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                workingImageData = ctx.createImageData(initialImageData);
                workingImageData.data.set(initialImageData.data);

                totalPixels = canvas.width * canvas.height;

                resolve();  // <- resolves only after all drawing is done
            };

            img.onerror = () => {
                console.error("Image failed to load:", url);
                reject(new Error("Image load failed"));
            };

            img.src = urlObject;
        } catch (err) {
            reject(err);
        }
    });
}

const brushButtonMapping = {
    vortex: { default: '../../svgs/buttons/vortex.svg', selected: 'vortex_chosen.svg' },
    pucker: { default: '../../svgs/buttons/pucker.svg', selected: 'pucker_chosen.svg' },
    smudge: { default: '../../svgs/buttons/smudge.svg', selected: 'smudge_chosen.svg' },
    bloat: { default: '../../svgs/buttons/bloat.svg', selected: 'bloat_chosen.svg' },
    reconstruct: { default: '../../svgs/buttons/reconstruct.svg', selected: 'reconstruct_chosen.svg' },
};

function updateBrushButtonMappingFromTheme(theme) {
    if (!theme || !theme.brushes) {
        console.error('Invalid theme object');
        return;
    }

    for (const brush in brushButtonMapping) {
        if (theme.brushes[brush]) {
            brushButtonMapping[brush].selected = theme.brushes[brush];
        }
    }
}

function selectBrush(brushName) {
    // Update brush state
    currentBrush = brushName;

    // Update button images
    Object.keys(brushButtonMapping).forEach(name => {
        const button = document.querySelector(`.brush-button[onclick="selectBrush('${name}')"] img`);
        if (button) {
            button.src = `${name === brushName ? brushButtonMapping[name].selected : brushButtonMapping[name].default}`;
        }
    });
}

async function applyTheme(groupName) {
    const theme = themes[groupName];
    if (!theme) {
        console.error(`Theme "${groupName}" not found`);
        return;
    }

    // 1. Update background color
    document.body.style.backgroundColor = theme.backgroundColor;

    // 2. Update tooltip colors
    const style = document.documentElement.style;
    style.setProperty('--tooltip-bg', theme.tooltipBackground);
    style.setProperty('--tooltip-text', theme.tooltipTextColor);

    // 3. Update brush chosen SVGs
    updateBrushButtonMappingFromTheme(theme)

    // 4. Update body SVG on canvas
    await loadSVGtoCanvasHighRes(theme.bodySVG, theme.backgroundColor);

    // 5. Update "I'm Ready" button SVG
    const imReadyButton = document.getElementById('im-ready-button');
    const imReadyBtnImg = imReadyButton.querySelector('img');

    imReadyButton.onmouseenter = () => {
        imReadyBtnImg.src = theme.imReadyHoverButton;
    };
    imReadyButton.onmouseleave = () => {
        imReadyBtnImg.src = theme.imReadyButton;
    };

}

// themes
const themes = {
    a3th_years_man: {
        bodySVG: '../svgs/themes/3th_years_man/3th_years_man.svg',
        brushes: {
            vortex: '../svgs/themes/3th_years_man/vortex_chosen.svg',
            pucker: '../svgs/themes/3th_years_man/pucker_chosen.svg',
            smudge: '../svgs/themes/3th_years_man/smudge_chosen.svg',
            bloat: '../svgs/themes/3th_years_man/bloat_chosen.svg',
            reconstruct: '../svgs/themes/3th_years_man/reconstruct_chosen.svg'
        },
        backgroundColor: '#EEBDA2',
        tooltipBackground: '#3d1f1a',
        tooltipTextColor: '#EEBDA2',
        imReadyButton: '../svgs/buttons/i_m_done.svg',
        imReadyHoverButton: '../svgs/themes/3th_years_man/i_m_done_chosen.svg'
    },
    a3th_years_woman: {
        bodySVG: '../svgs/themes/3th_years_woman/3th_years_woman.svg',
        brushes: {
            vortex: '../svgs/themes/3th_years_woman/vortex_chosen.svg',
            pucker: '../svgs/themes/3th_years_woman/pucker_chosen.svg',
            smudge: '../svgs/themes/3th_years_woman/smudge_chosen.svg',
            bloat: '../svgs/themes/3th_years_woman/bloat_chosen.svg',
            reconstruct: '../svgs/themes/3th_years_woman/reconstruct_chosen.svg'
        },
        backgroundColor: '#D59970',
        tooltipBackground: '#3D1F1A',
        tooltipTextColor: '#D59970',
        imReadyButton: '../svgs/buttons/i_m_done.svg',
        imReadyHoverButton: '../svgs/themes/3th_years_woman/i_m_done_chosen.svg'
    },
    blonde: {
        bodySVG: '../svgs/themes/blonde/blondy1.svg',
        brushes: {
            vortex: '../svgs/themes/blonde/vortex_chosen.svg',
            pucker: '../svgs/themes/blonde/pucker_chosen.svg',
            smudge: '../svgs/themes/blonde/smudge_chosen.svg',
            bloat: '../svgs/themes/blonde/bloat_chosen.svg',
            reconstruct: '../svgs/themes/blonde/reconstruct_chosen.svg'
        },
        backgroundColor: '#D2A783',
        tooltipBackground: '#3D1F1A',
        tooltipTextColor: '#D2A783',
        imReadyButton: '../svgs/buttons/i_m_done.svg',
        imReadyHoverButton: '../svgs/themes/blonde/i_m_done_chosen.svg'
    },
    fattie_black: {
        bodySVG: '../svgs/themes/fattie_black/fatty_black.svg',
        brushes: {
            vortex: '../svgs/themes/fattie_black/vortex_chosen.svg',
            pucker: '../svgs/themes/fattie_black/pucker_chosen.svg',
            smudge: '../svgs/themes/fattie_black/smudge_chosen.svg',
            bloat: '../svgs/themes/fattie_black/bloat_chosen.svg',
            reconstruct: '../svgs/themes/fattie_black/reconstruct_chosen.svg'
        },
        backgroundColor: '#BB7A58',
        tooltipBackground: '#3D1F1A',
        tooltipTextColor: '#BB7A58',
        imReadyButton: '../svgs/buttons/i_m_done.svg',
        imReadyHoverButton: '../svgs/themes/fattie_black/i_m_done_chosen.svg'
    },
    mid_years_man: {
        bodySVG: '../svgs/themes/mid_years_man/mid_years_man.svg',
        brushes: {
            vortex: '../svgs/themes/mid_years_man/vortex_chosen.svg',
            pucker: '../svgs/themes/mid_years_man/pucker_chosen.svg',
            smudge: '../svgs/themes/mid_years_man/smudge_chosen.svg',
            bloat: '../svgs/themes/mid_years_man/bloat_chosen.svg',
            reconstruct: '../svgs/themes/mid_years_man/reconstruct_chosen.svg'
        },
        backgroundColor: '#C9A195',
        tooltipBackground: '#3d1f1a',
        tooltipTextColor: '#C9A195',
        imReadyButton: '../svgs/buttons/i_m_done.svg',
        imReadyHoverButton: '../svgs/themes/mid_years_man/i_m_done_chosen.svg'
    },
    normal_girl: {
        bodySVG: '../svgs/themes/normal_girl/normal_girl.svg',
        brushes: {
            vortex: '../svgs/themes/normal_girl/vortex_chosen.svg',
            pucker: '../svgs/themes/normal_girl/pucker_chosen.svg',
            smudge: '../svgs/themes/normal_girl/smudge_chosen.svg',
            bloat: '../svgs/themes/normal_girl/bloat_chosen.svg',
            reconstruct: '../svgs/themes/normal_girl/reconstruct_chosen.svg'
        },
        backgroundColor: '#BC8970',
        tooltipBackground: '#3d1f1a',
        tooltipTextColor: '#BC8970',
        imReadyButton: '../svgs/buttons/i_m_done.svg',
        imReadyHoverButton: '../svgs/themes/normal_girl/i_m_done_chosen.svg'
    },
    shchif: {
        bodySVG: '../svgs/themes/shchif/shchif.svg',
        brushes: {
            vortex: '../svgs/themes/shchif/vortex_chosen.svg',
            pucker: '../svgs/themes/shchif/pucker_chosen.svg',
            smudge: '../svgs/themes/shchif/smudge_chosen.svg',
            bloat: '../svgs/themes/shchif/bloat_chosen.svg',
            reconstruct: '../svgs/themes/shchif/reconstruct_chosen.svg'
        },
        backgroundColor: '#E8BDA5',
        tooltipBackground: '#3d1f1a',
        tooltipTextColor: '#E8BDA5',
        imReadyButton: '../svgs/buttons/i_m_done.svg',
        imReadyHoverButton: '../svgs/themes/shchif/i_m_done_chosen.svg'
    },
    thinness: {
        bodySVG: '../svgs/themes/thinness/thinness.svg',
        brushes: {
            vortex: '../svgs/themes/thinness/vortex_chosen.svg',
            pucker: '../svgs/themes/thinness/pucker_chosen.svg',
            smudge: '../svgs/themes/thinness/smudge_chosen.svg',
            bloat: '../svgs/themes/thinness/bloat_chosen.svg',
            reconstruct: '../svgs/themes/thinness/reconstruct_chosen.svg'
        },
        backgroundColor: '#EADDD6',
        tooltipBackground: '#3D1F1A',
        tooltipTextColor: '#EADDD6',
        imReadyButton: '../svgs/buttons/i_m_done.svg',
        imReadyHoverButton: '../svgs/themes/thinness/i_m_done_chosen.svg'
    },
    young_fattie: {
        bodySVG: '../svgs/themes/young_fattie/young_fattie.svg',
        brushes: {
            vortex: '../svgs/themes/young_fattie/vortex_chosen.svg',
            pucker: '../svgs/themes/young_fattie/pucker_chosen.svg',
            smudge: '../svgs/themes/young_fattie/smudge_chosen.svg',
            bloat: '../svgs/themes/young_fattie/bloat_chosen.svg',
            reconstruct: '../svgs/themes/young_fattie/reconstruct_chosen.svg'
        },
        backgroundColor: '#C79782',
        tooltipBackground: '#3d1f1a',
        tooltipTextColor: '#C79782',
        imReadyButton: '../svgs/buttons/i_m_done.svg',
        imReadyHoverButton: '../svgs/themes/young_fattie/i_m_done_chosen.svg'
    },
};

const answersToThemeMapping = new Map([
    ['a1,a1,a1', 'young_fattie'],
    ['a1,a1,a2', 'mid_years_man'],
    ['a1,a1,a3', 'thinness'],
    ['a1,a1,a4', 'a3th_years_man'],
    ['a1,a2,a1', 'young_fattie'],
    ['a1,a2,a2', 'mid_years_man'],
    ['a1,a2,a3', 'thinness'],
    ['a1,a2,a4', 'a3th_years_man'],
    ['a1,a3,a1', 'young_fattie'],
    ['a1,a3,a2', 'mid_years_man'],
    ['a1,a3,a3', 'shchif'],
    ['a1,a3,a4', 'a3th_years_man'],
    ['a1,a4,a1', 'young_fattie'],
    ['a1,a4,a2', 'mid_years_man'],
    ['a1,a4,a3', 'shchif'], // missing theme
    ['a1,a4,a4', 'a3th_years_man'],
    ['a2,a1,a1', 'fattie_black'],
    ['a2,a1,a2', 'blonde'],
    ['a2,a1,a3', 'normal_girl'],
    ['a2,a1,a4', 'a3th_years_woman'],
    ['a2,a2,a1', 'young_fattie'],
    ['a2,a2,a2', 'blonde'],
    ['a2,a2,a3', 'normal_girl'],
    ['a2,a2,a4', 'a3th_years_woman'],
    ['a2,a3,a1', 'young_fattie'],
    ['a2,a3,a2', 'blonde'],
    ['a2,a3,a3', 'shchif'],
    ['a2,a3,a4', 'a3th_years_woman'],
    ['a2,a4,a1', 'young_fattie'],
    ['a2,a4,a2', 'blonde'],
    ['a2,a4,a3', 'shchif'],
    ['a2,a4,a4', 'a3th_years_woman'],
])

function getThemeFromAnswers() {
    // Reconstruct theme from stored answers
    const a1 = localStorage.getItem('answer1');
    const a2 = localStorage.getItem('answer2');
    const a3 = localStorage.getItem('answer3');

    let selectedTheme = null;
    if (a1 && a2 && a3) {
        const key = [a1, a2, a3].join(',');
        selectedTheme = answersToThemeMapping.get(key) ; // default fallback
    }

    if (!selectedTheme) {
        console.warn('No matching theme found for the provided answers. Defaulting to "thinness".');
        selectedTheme = 'thinness'; // Default theme if no match found
    }
    console.log(`Selected theme based on answers: ${selectedTheme}`);
    return selectedTheme;
}

let modifiedPixels = new Set();

// Mark a pixel as modified
function markPixelAsModified(x, y) {
    const index = y * canvas.width + x;
    modifiedPixels.add(index);
}

function unmarkPixel(x, y) {
    const index = y * canvas.width + x;
    modifiedPixels.delete(index);
}

// Calculate the distortion score (0–100)
function calculateDistortionScore() {
    const fraction = modifiedPixels.size / totalPixels;

    return Math.min(100, Math.max(0, Math.round(fraction * 100)));
}

function isWithinBrush(x, y, cx, cy, radius) {
    const dx = x - cx;
    const dy = y - cy;
    return dx * dx + dy * dy <= radius * radius;
}

function markAllAffectedPixels(cx, cy) {
    // Example loop through affected pixels
    for (let y = Math.max(0, cy - brushRadius); y < Math.min(canvas.height, cy + brushRadius); y++) {
        for (let x = Math.max(0, cx - brushRadius); x < Math.min(canvas.width, cx + brushRadius); x++) {
            if (isWithinBrush(x, y, cx, cy, brushRadius)) {
                if (currentBrush === 'reconstruct') {
                    unmarkPixel(x,y)
                }
                else {
                    markPixelAsModified(x, y);
                }
            }
        }
    }
}

function applyBrushEffect(x, y, delta = { dx: 0, dy: 0 }) {
    if (!workingImageData) return;

    const imageData = workingImageData;
    let result = null;
    markAllAffectedPixels(x, y);
    switch (currentBrush) {
        case 'vortex':
            result = applyVortexSwirl(imageData, x, y, brushRadius, Math.PI / 8);
            break;
        case 'smudge':
            result = applySmudgeWarp(imageData, x, y, brushRadius, delta, 1.0);
            break;
        case 'reconstruct':
            result = applyReconstruct(workingImageData, initialImageData, x, y, brushRadius);
            break;
    }
    if (result) {
        workingImageData = result;
        ctx.putImageData(workingImageData, 0, 0);
        drawBrushCursor();

        let distortionScore = calculateDistortionScore();
        updateScaleArrow(distortionScore);
    }
}

canvas.addEventListener('mouseleave', () => {
    brushCursor = { x: -1000, y: -1000 };
    drawBrushCursor();
});

function drawBrushCursor() {
    if (workingImageData) {
        ctx.putImageData(workingImageData, 0, 0);
    }
    ctx.beginPath();
    ctx.arc(brushCursor.x, brushCursor.y, brushRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = scaleFactor;
    ctx.stroke();

    if (holdPosition) {
        pulsePhase += 0.1;
        const pulseRadius = brushRadius + Math.sin(pulsePhase) * (5 * scaleFactor);
        ctx.beginPath();
        ctx.arc(holdPosition.x, holdPosition.y, pulseRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2 * scaleFactor;
        ctx.stroke();
    }
}

const brushSizeStep = 5 * scaleFactor;
const minBrushRadius = 10 * scaleFactor;
const maxBrushRadius = 200 * scaleFactor;
let brushRadius = 50 * scaleFactor;

canvas.addEventListener('mousedown', (e) => {
    const pos = getMousePos(e);
    brushCursor = pos;
    holdPosition = pos;
    pulsePhase = 0;


    if (currentBrush === 'pucker' || currentBrush === 'bloat') {
        holdInterval = setInterval(() => {
            requestAnimationFrame(() => {
                const imageData = workingImageData;
                let result = currentBrush === 'pucker'
                    ? applyPucker(imageData, holdPosition.x, holdPosition.y, brushRadius, 0.5)
                    : applyBloat(imageData, holdPosition.x, holdPosition.y, brushRadius, 0.5);
                if (result) {
                    workingImageData = result;
                    ctx.putImageData(workingImageData, 0, 0);
                    drawBrushCursor();
                }
                markAllAffectedPixels(holdPosition.x, holdPosition.y);
                let distortionScore = calculateDistortionScore();
                updateScaleArrow(distortionScore);
            });
        }, 200);
    } else {
        isDragging = true;
        lastBrushPos = pos;
        applyBrushEffect(pos.x, pos.y, { dx: 0, dy: 0 });
    }
});

canvas.addEventListener('mousemove', (e) => {
    const pos = getMousePos(e);
    brushCursor = pos;
    if (isDragging && (currentBrush === 'vortex' || currentBrush === 'smudge' || currentBrush === 'reconstruct')) {
        const delta = lastBrushPos ? { dx: pos.x - lastBrushPos.x, dy: pos.y - lastBrushPos.y } : { dx: 0, dy: 0 };
        requestAnimationFrame(() => {
            applyBrushEffect(pos.x, pos.y, delta);
        });
        lastBrushPos = pos;
    } else {
        drawBrushCursor();
    }
});

window.addEventListener('mouseup', () => {
    isDragging = false;
    if (holdInterval) {
        clearInterval(holdInterval);
        holdInterval = null;
    }
    holdPosition = null;
    lastBrushPos = null;
    drawBrushCursor();
});

document.addEventListener('keydown', (e) => {
    if (e.key === '[') {
        brushRadius = Math.max(minBrushRadius, brushRadius - brushSizeStep);
        document.getElementById('brushSizeDisplay').textContent = `Brush Size: ${Math.round(brushRadius / scaleFactor)}`;
        drawBrushCursor();
    } else if (e.key === ']') {
        brushRadius = Math.min(maxBrushRadius, brushRadius + brushSizeStep);
        document.getElementById('brushSizeDisplay').textContent = `Brush Size: ${Math.round(brushRadius / scaleFactor)}`;
        drawBrushCursor();
    }
});

function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: (e.clientX - rect.left) * scaleFactor, y: (e.clientY - rect.top) * scaleFactor };
}

function applyVortexSwirl(imageData, cx, cy, radius, strength) {
    const { width, height, data } = imageData;
    const dst = ctx.createImageData(width, height);
    dst.data.set(data);

    const maxRSquared = radius * radius;
    const invMaxR = 1 / radius;

    const left = Math.max(0, Math.floor(cx - radius));
    const top = Math.max(0, Math.floor(cy - radius));
    const right = Math.min(width, Math.ceil(cx + radius));
    const bottom = Math.min(height, Math.ceil(cy + radius));

    for (let y = top; y < bottom; y++) {
        for (let x = left; x < right; x++) {
            const dx = x - cx;
            const dy = y - cy;
            const rSquared = dx * dx + dy * dy;

            if (rSquared <= maxRSquared) {
                const r = Math.sqrt(rSquared);
                const theta = Math.atan2(dy, dx);
                const twist = strength * (1 - r * invMaxR); // inner points rotate more
                const nt = theta + twist;

                const sx = cx + r * Math.cos(nt);
                const sy = cy + r * Math.sin(nt);

                // Sample source pixel with bilinear interpolation
                const srcColor = bilinearSample(data, width, height, sx, sy);
                const dstI = (y * width + x) * 4;

                // Feathering: blend amount based on distance (closer = more effect)
                const blend = 1 - r / radius;

                // Blend with original pixel
                for (let i = 0; i < 4; i++) {
                    const original = data[dstI + i];
                    const vortexed = srcColor[i];
                    dst.data[dstI + i] = Math.round(
                        vortexed * blend + original * (1 - blend)
                    );
                }
            }
        }
    }
    return dst;
}

function bilinearSample(data, width, height, x, y) {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = Math.min(x0 + 1, width - 1);
    const y1 = Math.min(y0 + 1, height - 1);

    const dx = x - x0;
    const dy = y - y0;

    const getPixel = (xx, yy) => {
        const idx = (yy * width + xx) * 4;
        return [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
    };

    const c00 = getPixel(x0, y0);
    const c10 = getPixel(x1, y0);
    const c01 = getPixel(x0, y1);
    const c11 = getPixel(x1, y1);

    const result = [0, 0, 0, 0];
    for (let i = 0; i < 4; i++) {
        const top = c00[i] * (1 - dx) + c10[i] * dx;
        const bottom = c01[i] * (1 - dx) + c11[i] * dx;
        result[i] = top * (1 - dy) + bottom * dy;
    }
    return result;
}

function applySmudgeWarp(imageData, cx, cy, radius, delta, strength) {
    const { width, height, data } = imageData;
    const dst = ctx.createImageData(width, height);
    dst.data.set(data); // start from current image

    const maxR = radius;
    const maxRSquared = radius * radius;
    const invMaxR = 1 / maxR;

    const left = Math.max(0, Math.floor(cx - radius));
    const top = Math.max(0, Math.floor(cy - radius));
    const right = Math.min(width, Math.ceil(cx + radius));
    const bottom = Math.min(height, Math.ceil(cy + radius));

    for (let y = top; y < bottom; y++) {
        for (let x = left; x < right; x++) {
            const dx = x - cx, dy = y - cy;
            const dstI = (y * width + x) * 4;
            const rSquared = dx * dx + dy * dy;

            if (rSquared <= maxRSquared) {
                const r = Math.sqrt(rSquared);
                const influence = (1 - r * invMaxR) * strength;

                const sx = x - delta.dx * influence;
                const sy = y - delta.dy * influence;

                const srcRGBA = bilinearSample(data, width, height, sx, sy);
                const dstRGBA = [data[dstI], data[dstI + 1], data[dstI + 2], data[dstI + 3]];

                const blend = 1 - r * invMaxR; // feathered blend

                const blended = featheredBlend(dstRGBA, srcRGBA, blend);

                dst.data[dstI]     = blended[0];
                dst.data[dstI + 1] = blended[1];
                dst.data[dstI + 2] = blended[2];
                dst.data[dstI + 3] = blended[3];
            }
        }
    }

    return dst;
}

function featheredBlend(original, modified, blend) {
    if (modified[3] < 255) {
        return original;
    }
    return original.map((v, i) =>
        Math.round(modified[i] * blend + v * (1 - blend))
    );
}

function applyPucker(imageData, cx, cy, radius, strength) {
    const { width, height, data } = imageData;
    const dst = ctx.createImageData(width, height);
    dst.data.set(data);

    const left = Math.max(0, Math.floor(cx - radius));
    const right = Math.min(width, Math.ceil(cx + radius));
    const top = Math.max(0, Math.floor(cy - radius));
    const bottom = Math.min(height, Math.ceil(cy + radius));
    const maxRSquared = radius * radius;

    for (let y = top; y < bottom; y++) {
        for (let x = left; x < right; x++) {
            const dx = x - cx;
            const dy = y - cy;
            const rSquared = dx * dx + dy * dy;

            if (rSquared <= maxRSquared) {
                const r = Math.sqrt(rSquared);
                const normR = r / radius;

                // Inverted Gaussian pull-in
                const scale = 1 / (1 + strength * Math.exp(-normR * normR * 4));

                const srcX = cx + dx / scale;
                const srcY = cy + dy / scale;

                const srcRGBA = bilinearSample(data, width, height, srcX, srcY);
                const dstI = (y * width + x) * 4;

                for (let i = 0; i < 4; i++) {
                    dst.data[dstI + i] = srcRGBA[i];
                }
            }
        }
    }

    return dst;
}

function applyBloat(imageData, cx, cy, radius, strength) {
    const { width, height, data } = imageData;
    const dst = ctx.createImageData(width, height);
    dst.data.set(data);

    const left = Math.max(0, Math.floor(cx - radius));
    const right = Math.min(width, Math.ceil(cx + radius));
    const top = Math.max(0, Math.floor(cy - radius));
    const bottom = Math.min(height, Math.ceil(cy + radius));
    const maxRSquared = radius * radius;

    for (let y = top; y < bottom; y++) {
        for (let x = left; x < right; x++) {
            const dx = x - cx;
            const dy = y - cy;
            const rSquared = dx * dx + dy * dy;

            if (rSquared <= maxRSquared) {
                const r = Math.sqrt(rSquared);
                const normR = r / radius;

                // Gaussian-like influence curve
                const scale = 1 + strength * Math.exp(-normR * normR * 4);

                const srcX = cx + dx / scale;
                const srcY = cy + dy / scale;

                const srcRGBA = bilinearSample(data, width, height, srcX, srcY);
                const dstI = (y * width + x) * 4;

                for (let i = 0; i < 4; i++) {
                    dst.data[dstI + i] = srcRGBA[i];
                }
            }
        }
    }

    return dst;
}

// function applyReconstruct(currentImageData, originalImageData, cx, cy, radius) {
//     const { width, height } = currentImageData;
//     const data = currentImageData.data;
//     const origData = originalImageData.data;
//     const dst = ctx.createImageData(width, height);
//     dst.data.set(data);
//     const maxRSquared = radius * radius;
//
//     const left = Math.max(0, Math.floor(cx - radius));
//     const top = Math.max(0, Math.floor(cy - radius));
//     const right = Math.min(width, Math.ceil(cx + radius));
//     const bottom = Math.min(height, Math.ceil(cy + radius));
//
//     for (let y = top; y < bottom; y++) {
//         for (let x = left; x < right; x++) {
//             const dx = x - cx, dy = y - cy;
//             const dstI = (y * width + x) * 4;
//             const rSquared = dx * dx + dy * dy;
//             if (rSquared <= maxRSquared) {
//                 dst.data[dstI] = origData[dstI];
//                 dst.data[dstI + 1] = origData[dstI + 1];
//                 dst.data[dstI + 2] = origData[dstI + 2];
//                 dst.data[dstI + 3] = origData[dstI + 3];
//             }
//         }
//     }
//     return dst;
// }

function applyReconstruct(currentImageData, originalImageData, cx, cy, radius) {
    const { width, height } = currentImageData;
    const data = currentImageData.data;
    const origData = originalImageData.data;

    const dst = ctx.createImageData(width, height);
    dst.data.set(data);

    const maxRSquared = radius * radius;

    const left = Math.max(0, Math.floor(cx - radius));
    const top = Math.max(0, Math.floor(cy - radius));
    const right = Math.min(width, Math.ceil(cx + radius));
    const bottom = Math.min(height, Math.ceil(cy + radius));

    for (let y = top; y < bottom; y++) {
        for (let x = left; x < right; x++) {
            const dx = x - cx, dy = y - cy;
            const rSquared = dx * dx + dy * dy;

            if (rSquared <= maxRSquared) {
                const r = Math.sqrt(rSquared);
                const blend = 1 - (r / radius) ** 2;

                const idx = (y * width + x) * 4;

                for (let i = 0; i < 4; i++) {
                    const current = data[idx + i];
                    const original = origData[idx + i];
                    dst.data[idx + i] = Math.round(original * blend + current * (1 - blend));
                }
            }
        }
    }

    return dst;
}

function getArrowBottom(distortionPercentage) {
    const min = -2.2;
    const max = 95.1;
    const clamped = Math.max(0, Math.min(100, distortionPercentage)); // ensure in range
    const value = min + (max - min) * (clamped / 100);
    return `${value.toFixed(2)}%`;
}

function updateScaleArrow(value) {
    const arrowBottom = getArrowBottom(value);

    document.querySelector('.scale-value-number').textContent = value;

    const indicator = document.getElementById('scale-indicator');
    indicator.style.bottom = `${arrowBottom}`;
}

document.getElementById('im-ready-button').addEventListener('click', () => {
    brushCursor = { x: -1000, y: -1000 };
    drawBrushCursor();

    const dataUrl = canvas.toDataURL('image/png');
    sessionStorage.setItem('editedImage', dataUrl);

    const bgColor = getComputedStyle(document.body).backgroundColor;
    sessionStorage.setItem('themeBackground', bgColor);

    const distortion = calculateDistortionScore();
    sessionStorage.setItem('distortionScore', distortion);

    window.location.href = 'summary.html';
});

document.addEventListener('DOMContentLoaded', async () => {
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

    // Load initial SVG
    console.log("Calling applyTheme...");
    await applyTheme(getThemeFromAnswers()); // Change to desired theme group name
    console.log("Theme applied.");
// Canvas setup - ends here
});
