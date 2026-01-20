// Toolbar component
import { PenTool, Type, Download, RotateCcw } from 'lucide-react';

/**
 * Toolbar - Bottom action buttons in the sidebar
 */
const Toolbar = ({
    pdfDoc,
    isProcessing,
    onNewSignature,
    onAddText,
    onDownload,
    t // translation function
}) => {
    return (
        <div className="p-6 space-y-3">
            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={onNewSignature}
                    disabled={!pdfDoc}
                    className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white p-3 rounded-lg flex flex-col items-center justify-center gap-1 transition text-xs"
                >
                    <PenTool size={20} /> {t('newSignature')}
                </button>
                <button
                    onClick={onAddText}
                    disabled={!pdfDoc}
                    className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white p-3 rounded-lg flex flex-col items-center justify-center gap-1 transition text-xs"
                >
                    <Type size={20} /> {t('addText')}
                </button>
            </div>
            <button
                onClick={onDownload}
                disabled={!pdfDoc || isProcessing}
                className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:opacity-50 text-white p-3 rounded-lg flex items-center justify-center gap-2 shadow-lg transition"
            >
                {isProcessing ? <RotateCcw className="animate-spin" size={18} /> : <Download size={18} />}
                {isProcessing ? t('processing') : t('download')}
            </button>
        </div>
    );
};

export default Toolbar;
