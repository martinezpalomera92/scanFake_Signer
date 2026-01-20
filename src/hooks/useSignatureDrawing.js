import { useState, useRef, useCallback } from 'react';

/**
 * Custom hook for signature drawing functionality
 * Encapsulates all drawing logic including smoothing and velocity-based stroke width
 */
export const useSignatureDrawing = (penColor, penSize, penSmoothing = true) => {
    const signPadRef = useRef(null);
    const pointsRef = useRef([]);
    const isDrawingRef = useRef(false);

    const getCoords = useCallback((e) => {
        const canvas = signPadRef.current;
        if (!canvas) return { x: 0, y: 0, time: Date.now() };

        const rect = canvas.getBoundingClientRect();
        const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
        const clientY = e.clientY || e.touches?.[0]?.clientY || 0;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top,
            time: Date.now()
        };
    }, []);

    const startDrawing = useCallback((e) => {
        e.preventDefault();
        isDrawingRef.current = true;
        const point = getCoords(e);
        pointsRef.current = [point];
    }, [getCoords]);

    const draw = useCallback((e) => {
        if (!isDrawingRef.current || !signPadRef.current) return;
        e.preventDefault();

        const point = getCoords(e);
        pointsRef.current.push(point);
        const canvas = signPadRef.current;
        const ctx = canvas.getContext('2d');

        // Simple line drawing (no smoothing)
        if (!penSmoothing) {
            const prev = pointsRef.current[pointsRef.current.length - 2];
            if (!prev) return;

            ctx.beginPath();
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(point.x, point.y);
            ctx.strokeStyle = penColor;
            ctx.lineWidth = penSize;
            ctx.lineCap = 'round';
            ctx.stroke();
            return;
        }

        // Smoothed drawing with velocity-based width
        if (pointsRef.current.length < 3) return;

        const p1 = pointsRef.current[pointsRef.current.length - 3];
        const p2 = pointsRef.current[pointsRef.current.length - 2];
        const p3 = pointsRef.current[pointsRef.current.length - 1];

        const cp1 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
        const cp2 = { x: (p2.x + p3.x) / 2, y: (p2.y + p3.y) / 2 };

        const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
        const timeDiff = p2.time - p1.time || 16;
        const velocity = dist / timeDiff;
        const dynamicWidth = Math.max(
            penSize * 0.4,
            Math.min(penSize * 1.5, penSize * (1.5 - velocity * 0.15))
        );

        ctx.beginPath();
        ctx.moveTo(cp1.x, cp1.y);
        ctx.quadraticCurveTo(p2.x, p2.y, cp2.x, cp2.y);
        ctx.strokeStyle = penColor;
        ctx.lineWidth = dynamicWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    }, [penColor, penSize, penSmoothing, getCoords]);

    const stopDrawing = useCallback(() => {
        isDrawingRef.current = false;
    }, []);

    const clearPad = useCallback(() => {
        const canvas = signPadRef.current;
        if (canvas) {
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        }
        pointsRef.current = [];
    }, []);

    const getSignatureDataUrl = useCallback(() => {
        if (!signPadRef.current) return null;
        return signPadRef.current.toDataURL('image/png');
    }, []);

    return {
        signPadRef,
        startDrawing,
        draw,
        stopDrawing,
        clearPad,
        getSignatureDataUrl
    };
};
