// ElementEditor component
import { Edit3, Wand2, Trash2 } from 'lucide-react';
import { HANDWRITING_FONTS } from '../constants';

/**
 * ElementEditor - Sidebar panel for editing selected text/image elements
 */
const ElementEditor = ({
    selectedElement,
    onUpdate,
    onHumanize,
    onDelete,
    t // translation function
}) => {
    if (!selectedElement) return null;

    return (
        <div className="p-6 border-b border-gray-700 bg-blue-900/10">
            <h2 className="font-semibold flex items-center gap-2 mb-4 text-blue-400">
                <Edit3 size={18} /> {t('edit')} {selectedElement.type === 'text' ? t('text') : t('signature')}
            </h2>

            {selectedElement.type === 'text' && (
                <div className="mb-4">
                    {/* Content Input */}
                    <label className="text-xs text-gray-400 mb-1 block">{t('content')}</label>
                    <input
                        type="text"
                        value={selectedElement.content}
                        onChange={(e) => onUpdate({ content: e.target.value })}
                        className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-sm text-white focus:border-blue-500 outline-none"
                    />

                    {/* Humanize Button */}
                    <button
                        onClick={onHumanize}
                        className="w-full mt-3 bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded flex items-center justify-center gap-2 text-xs transition shadow-sm border border-indigo-500"
                    >
                        <Wand2 size={14} /> {t('humanize')}
                    </button>

                    {/* Font Family */}
                    <div className="mt-4">
                        <label className="text-xs text-gray-400 mb-1 block">{t('font')}</label>
                        <select
                            value={selectedElement.fontFamily || 'Helvetica'}
                            onChange={(e) => onUpdate({ fontFamily: e.target.value })}
                            className="w-full bg-gray-700 border border-gray-600 rounded p-1 text-sm text-white"
                        >
                            <option value="Helvetica">{t('digital')}</option>
                            {HANDWRITING_FONTS.map(font => (
                                <option key={font} value={font}>{font}</option>
                            ))}
                        </select>
                    </div>

                    {/* Size and Color */}
                    <div className="mt-4 flex gap-2">
                        <div className="flex-1">
                            <label className="text-xs text-gray-400 mb-1 block">{t('size')}</label>
                            <input
                                type="number"
                                value={selectedElement.fontSize}
                                onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) })}
                                className="w-full bg-gray-700 border border-gray-600 rounded p-1 text-sm"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs text-gray-400 mb-1 block">{t('color')}</label>
                            <input
                                type="color"
                                value={selectedElement.color}
                                onChange={(e) => onUpdate({ color: e.target.value })}
                                className="w-full h-8 bg-gray-700 rounded cursor-pointer"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Common Controls */}
            <div className="space-y-4 text-sm">
                {/* Rotation */}
                <div>
                    <div className="flex justify-between mb-1 text-xs text-gray-400">
                        <span>{t('rotation')}</span>
                        <span>{Math.round(selectedElement.rotation)}°</span>
                    </div>
                    <input
                        type="range"
                        min="-180"
                        max="180"
                        value={selectedElement.rotation}
                        onChange={(e) => onUpdate({ rotation: parseInt(e.target.value) })}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                {/* Size for images */}
                {selectedElement.type !== 'text' && (
                    <div>
                        <div className="flex justify-between mb-1 text-xs text-gray-400">
                            <span>{t('size')}</span>
                        </div>
                        <input
                            type="range"
                            min="50"
                            max="500"
                            value={selectedElement.width}
                            onChange={(e) => {
                                const w = parseInt(e.target.value);
                                onUpdate({ width: w, height: w / 2 });
                            }}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                )}

                {/* Delete Button */}
                <button
                    onClick={() => onDelete(selectedElement.id)}
                    className="w-full mt-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 p-2 rounded flex items-center justify-center gap-2 text-xs transition"
                >
                    <Trash2 size={14} /> {t('delete')}
                </button>
            </div>
        </div>
    );
};

export default ElementEditor;
