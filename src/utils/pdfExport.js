import { jsPDF } from 'jspdf';

/**
 * Render elements onto an offscreen canvas
 */
const renderElementsToCanvas = async (offCtx, elements, targetScale, scanEffect) => {
    for (const el of elements) {
        offCtx.save();

        const x = el.x * targetScale;
        const y = el.y * targetScale;
        const width = el.width * targetScale;
        const height = el.height * targetScale;

        // Rotation Pivot: Center (Matching UI transform-origin: center)
        const centerX = x + width / 2;
        const centerY = y + height / 2;

        offCtx.translate(centerX, centerY);
        offCtx.rotate((el.rotation * Math.PI) / 180);
        // Translate back but keep (0,0) as the top-left of the original element box relative to center
        offCtx.translate(-width / 2, -height / 2);

        if (el.type === 'image') {
            const img = new Image();
            img.src = el.image;
            await new Promise(r => img.onload = r);

            if (scanEffect.inkThickness > 0) {
                const thickness = scanEffect.inkThickness * targetScale * 0.4;
                const steps = 8;
                offCtx.globalAlpha = 0.8;
                for (let angle = 0; angle < Math.PI * 2; angle += (Math.PI * 2) / steps) {
                    const dx = Math.cos(angle) * thickness;
                    const dy = Math.sin(angle) * thickness;
                    offCtx.drawImage(img, dx, dy, width, height);
                }
                offCtx.globalAlpha = 1.0;
            }
            offCtx.drawImage(img, 0, 0, width, height);
        }
        else if (el.type === 'text') {
            offCtx.font = `${el.fontSize * targetScale}px ${el.fontFamily || 'Helvetica'}`;
            offCtx.fillStyle = el.color;
            offCtx.textBaseline = 'top';
            offCtx.textAlign = 'left';

            // UI Padding Fine-tuning: Matches Tailwind px-2/py-1 + LineHeight 1.2 rendering
            const paddingX = 9 * targetScale;
            const paddingY = 8.5 * targetScale;

            if (scanEffect.inkThickness > 0) {
                offCtx.strokeStyle = el.color;
                offCtx.lineWidth = scanEffect.inkThickness * targetScale * 0.2;
                offCtx.strokeText(el.content, paddingX, paddingY);
            }
            offCtx.fillText(el.content, paddingX, paddingY);
        }
        offCtx.restore();
    }
};

/**
 * Apply scan effect to canvas for export
 */
const applyScanEffectForExport = (offCanvas, scanEffect) => {
    const rotCanvas = document.createElement('canvas');
    rotCanvas.width = offCanvas.width;
    rotCanvas.height = offCanvas.height;
    const rotCtx = rotCanvas.getContext('2d');

    rotCtx.fillStyle = '#FFFFFF';
    rotCtx.fillRect(0, 0, rotCanvas.width, rotCanvas.height);

    const angle = (Math.random() - 0.5) * 2 * scanEffect.rotation * (Math.PI / 180);
    rotCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
    rotCtx.rotate(angle);
    rotCtx.drawImage(offCanvas, -offCanvas.width / 2, -offCanvas.height / 2);
    rotCtx.setTransform(1, 0, 0, 1, 0, 0);

    const imgData = rotCtx.getImageData(0, 0, rotCanvas.width, rotCanvas.height);
    const d = imgData.data;
    const noiseAmt = scanEffect.noise * 255;

    for (let j = 0; j < d.length; j += 4) {
        const noise = (Math.random() - 0.5) * noiseAmt;
        let r = (d[j] + noise - 128) * scanEffect.contrast + 128;
        let g = (d[j + 1] + noise - 128) * scanEffect.contrast + 128;
        let b = (d[j + 2] + noise - 128) * scanEffect.contrast + 128;
        r *= scanEffect.brightness;
        g *= scanEffect.brightness;
        b *= scanEffect.brightness;

        if (scanEffect.grayscale) {
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            const val = gray > 220 ? 255 : (gray < 70 ? 30 : gray);
            d[j] = d[j + 1] = d[j + 2] = Math.min(255, Math.max(0, val));
        } else {
            d[j] = Math.min(255, Math.max(0, r));
            d[j + 1] = Math.min(255, Math.max(0, g));
            d[j + 2] = Math.min(255, Math.max(0, b));
        }
    }
    rotCtx.putImageData(imgData, 0, 0);

    return rotCanvas;
};

/**
 * Export PDF with all elements and effects
 * @param {Object} pdfDoc - The loaded PDF document from pdf.js
 * @param {number} totalPages - Total number of pages
 * @param {Array} elements - Array of elements (text/images) to render
 * @param {Object} scanEffect - Scan effect configuration
 * @param {Function} onProgress - Callback for progress updates (pageNum)
 * @returns {Promise<void>}
 */
export const exportPDF = async (pdfDoc, totalPages, elements, scanEffect, onProgress) => {
    const doc = new jsPDF();
    const targetScale = 2.0;

    for (let i = 1; i <= totalPages; i++) {
        if (i > 1) doc.addPage();
        if (onProgress) onProgress(i);

        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: targetScale });

        // Create offscreen canvas
        const offCanvas = document.createElement('canvas');
        offCanvas.width = viewport.width;
        offCanvas.height = viewport.height;
        const offCtx = offCanvas.getContext('2d');

        // Fill with white background
        offCtx.fillStyle = '#FFFFFF';
        offCtx.fillRect(0, 0, offCanvas.width, offCanvas.height);

        // Render PDF page
        await page.render({ canvasContext: offCtx, viewport }).promise;

        // Render elements for this page
        const pageElements = elements.filter(e => e.page === i);
        await renderElementsToCanvas(offCtx, pageElements, targetScale, scanEffect);

        // Apply scan effect if enabled
        let finalCanvas = offCanvas;
        if (scanEffect.enabled) {
            finalCanvas = applyScanEffectForExport(offCanvas, scanEffect);
        }

        // Add to PDF
        const finalImg = finalCanvas.toDataURL('image/jpeg', scanEffect.enabled ? 0.8 : 0.95);
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = (finalCanvas.height * pdfWidth) / finalCanvas.width;
        doc.addImage(finalImg, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    }

    doc.save('signed_document.pdf');
};
