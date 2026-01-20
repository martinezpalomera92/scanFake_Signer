// Header component
import { FileText, Upload } from 'lucide-react';

/**
 * Header - Application header with logo, language switcher, and upload button
 */
const Header = ({
    lang,
    setLang,
    statusMsg,
    pdfDoc,
    onUploadClick,
    t // translation function
}) => {
    return (
        <header className="bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center shadow-md z-10">
            <div className="flex items-center gap-2">
                <FileText className="text-blue-400" />
                <h1 className="text-xl font-bold tracking-wider">
                    Scan<span className="text-blue-400">Fake</span>
                </h1>
            </div>
            <div className="flex items-center gap-4">
                {/* Language Switcher */}
                <div className="flex items-center gap-2 bg-gray-700 p-1 rounded-lg border border-gray-600">
                    <button
                        onClick={() => setLang('es')}
                        className={`px-3 py-1 rounded text-xs transition ${lang === 'es' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        ES
                    </button>
                    <button
                        onClick={() => setLang('en')}
                        className={`px-3 py-1 rounded text-xs transition ${lang === 'en' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        EN
                    </button>
                </div>

                {/* Status Message */}
                <span className="text-sm text-gray-400 hidden sm:inline">{statusMsg}</span>

                {/* Upload Button */}
                {!pdfDoc && (
                    <button
                        onClick={onUploadClick}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition text-sm"
                    >
                        <Upload size={16} /> {t('uploadPdf')}
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;
