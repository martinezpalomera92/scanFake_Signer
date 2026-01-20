// SignatureGallery component
import { Save, Trash2 } from 'lucide-react';

/**
 * SignatureGallery - Displays saved signatures with options to use or delete
 */
const SignatureGallery = ({
    savedSignatures,
    onSelectSignature,
    onDeleteSignature,
    t // translation function
}) => {
    return (
        <div className="p-6 border-b border-gray-700">
            <h2 className="font-semibold flex items-center gap-2 mb-4">
                <Save size={18} /> {t('gallery')}
            </h2>
            {savedSignatures.length === 0 ? (
                <p className="text-xs text-gray-500 italic">{t('noSignatures')}</p>
            ) : (
                <div className="grid grid-cols-2 gap-2">
                    {savedSignatures.map((img, idx) => (
                        <div
                            key={idx}
                            className="relative group border border-gray-600 rounded bg-white overflow-hidden cursor-pointer hover:border-blue-500 transition"
                            onClick={() => onSelectSignature(img)}
                        >
                            <img src={img} className="w-full h-16 object-contain" alt="saved signature" />
                            <button
                                onClick={(e) => { e.stopPropagation(); onDeleteSignature(idx); }}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                            >
                                <Trash2 size={10} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SignatureGallery;
