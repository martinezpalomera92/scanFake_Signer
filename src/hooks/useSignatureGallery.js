import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing saved signatures in localStorage
 */
export const useSignatureGallery = () => {
    const STORAGE_KEY = 'scanfake_signatures';

    const [savedSignatures, setSavedSignatures] = useState([]);

    // Load signatures from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setSavedSignatures(JSON.parse(saved));
            } catch (e) {
                console.error('Error loading saved signatures:', e);
            }
        }
    }, []);

    // Save signature to gallery
    const saveSignature = useCallback((dataUrl) => {
        const newSaved = [...savedSignatures, dataUrl];
        setSavedSignatures(newSaved);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSaved));
        return true;
    }, [savedSignatures]);

    // Delete signature from gallery
    const deleteSignature = useCallback((index) => {
        const newSaved = savedSignatures.filter((_, i) => i !== index);
        setSavedSignatures(newSaved);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSaved));
    }, [savedSignatures]);

    // Clear all signatures
    const clearAllSignatures = useCallback(() => {
        setSavedSignatures([]);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    return {
        savedSignatures,
        saveSignature,
        deleteSignature,
        clearAllSignatures
    };
};
