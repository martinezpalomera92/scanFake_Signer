// PageNavigator component
import { ZoomIn, ZoomOut } from 'lucide-react';

/**
 * PageNavigator - Fixed bottom navigation for page and zoom controls
 */
const PageNavigator = ({
    pageNum,
    totalPages,
    scale,
    onPageChange,
    onZoomIn,
    onZoomOut,
    t // translation function
}) => {
    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-800/90 backdrop-blur text-white px-2 py-2 rounded-full shadow-lg flex items-center gap-2 z-20 border border-gray-700">
            <button
                onClick={(e) => { e.stopPropagation(); onPageChange(Math.max(1, pageNum - 1)); }}
                disabled={pageNum <= 1}
                className="p-2 hover:bg-gray-700 rounded-full disabled:opacity-50 text-xs px-3"
            >
                {t('prev')}
            </button>
            <span className="text-sm font-mono mx-2">{pageNum} / {totalPages}</span>
            <button
                onClick={(e) => { e.stopPropagation(); onPageChange(Math.min(totalPages, pageNum + 1)); }}
                disabled={pageNum >= totalPages}
                className="p-2 hover:bg-gray-700 rounded-full disabled:opacity-50 text-xs px-3"
            >
                {t('next')}
            </button>
            <div className="w-px h-6 bg-gray-600 mx-2" />
            <button onClick={onZoomOut} className="p-2 hover:bg-gray-700 rounded-full">
                <ZoomOut size={18} />
            </button>
            <span className="text-xs w-12 text-center">{Math.round(scale * 100)}%</span>
            <button onClick={onZoomIn} className="p-2 hover:bg-gray-700 rounded-full">
                <ZoomIn size={18} />
            </button>
        </div>
    );
};

export default PageNavigator;
