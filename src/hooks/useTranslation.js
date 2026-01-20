import { useCallback } from 'react';
import { translations } from '../constants';

/**
 * Custom hook for internationalization
 */
export const useTranslation = (lang) => {
    const t = useCallback((key) => {
        return translations[lang]?.[key] || key;
    }, [lang]);

    return { t };
};
