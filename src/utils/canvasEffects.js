/**
 * Apply scanner-like effects to a canvas
 * @param {HTMLCanvasElement} canvas - The canvas element to apply effects to
 * @param {CanvasRenderingContext2D} ctx - The canvas 2D context
 * @param {Object} scanEffect - The scan effect configuration object
 */
export const applyScanEffectToCanvas = (canvas, ctx, scanEffect) => {
    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const contrastFactor = scanEffect.contrast;
    const brightness = scanEffect.brightness;
    const noiseAmount = scanEffect.noise * 255;
    const isGray = scanEffect.grayscale;

    for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * noiseAmount;

        let r = (data[i] + noise - 128) * contrastFactor + 128;
        let g = (data[i + 1] + noise - 128) * contrastFactor + 128;
        let b = (data[i + 2] + noise - 128) * contrastFactor + 128;

        r *= brightness; g *= brightness; b *= brightness;

        if (isGray) {
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            let finalVal = gray;
            if (gray > 220) finalVal = 255; else if (gray < 60) finalVal = 40;
            finalVal = Math.min(255, Math.max(0, finalVal));
            data[i] = data[i + 1] = data[i + 2] = finalVal;
        } else {
            data[i] = Math.min(255, Math.max(0, r));
            data[i + 1] = Math.min(255, Math.max(0, g));
            data[i + 2] = Math.min(255, Math.max(0, b));
        }
    }
    ctx.putImageData(imageData, 0, 0);
};
