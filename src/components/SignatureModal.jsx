import { useRef } from 'react';
import { Eraser, Check, Save } from 'lucide-react';

/**
 * SignatureModal - Modal for drawing or uploading signatures
 */
const SignatureModal = ({
    isOpen,
    onClose,
    activeTab,
    setActiveTab,
    penColor,
    setPenColor,
    penSize,
    setPenSize,
    signPadRef,
    startDrawing,
    draw,
    stopDrawing,
    clearPad,
    saveToGallery,
    addSignatureToDoc,
    t // translation function
}) => {
    const sigImageInputRef = useRef(null);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                {/* Tabs */}
                <div className="flex border-b">
                    <button
                        onClick={() => setActiveTab('draw')}
                        className={`flex-1 p-3 text-sm font-medium ${activeTab === 'draw' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'bg-gray-50 text-gray-500'}`}
                    >
                        {t('drawTab')}
                    </button>
                    <button
                        onClick={() => setActiveTab('upload')}
                        className={`flex-1 p-3 text-sm font-medium ${activeTab === 'upload' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'bg-gray-50 text-gray-500'}`}
                    >
                        {t('uploadTab')}
                    </button>
                </div>

                {activeTab === 'draw' ? (
                    <>
                        {/* Drawing Controls */}
                        <div className="p-3 bg-gray-50 border-b flex justify-between items-center gap-4 flex-wrap text-gray-800">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPenColor('#000080')}
                                    className={`w-6 h-6 rounded-full bg-blue-900 border-2 ${penColor === '#000080' ? 'border-blue-400 scale-110' : 'border-transparent'}`}
                                    title={t('blue')}
                                />
                                <button
                                    onClick={() => setPenColor('#000000')}
                                    className={`w-6 h-6 rounded-full bg-black border-2 ${penColor === '#000000' ? 'border-gray-400 scale-110' : 'border-transparent'}`}
                                    title={t('black')}
                                />
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-600 flex-1 min-w-[150px]">
                                <span>{t('thickness')}:</span>
                                <input
                                    type="range"
                                    min="1"
                                    max="8"
                                    step="0.5"
                                    value={penSize}
                                    onChange={(e) => setPenSize(parseFloat(e.target.value))}
                                    className="h-2 bg-gray-300 rounded-lg flex-1"
                                />
                            </div>
                        </div>

                        {/* Drawing Canvas */}
                        <div
                            className="relative bg-white flex-1 min-h-[250px] touch-none"
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                        >
                            <canvas ref={signPadRef} width={500} height={300} className="cursor-crosshair w-full h-full block" />
                            <div className="absolute bottom-2 left-0 w-full text-center text-gray-300 text-xs pointer-events-none select-none">
                                {t('signHere')}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="p-4 bg-gray-50 border-t flex justify-between items-center">
                            <button
                                onClick={clearPad}
                                className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1"
                            >
                                <Eraser size={16} /> {t('clear')}
                            </button>
                            <div className="flex gap-2">
                                <button
                                    onClick={saveToGallery}
                                    className="px-3 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg text-sm font-medium flex items-center gap-1 border border-purple-200"
                                >
                                    <Save size={16} /> {t('save')}
                                </button>
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    onClick={() => addSignatureToDoc(signPadRef.current.toDataURL('image/png'))}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-1"
                                >
                                    <Check size={16} /> {t('use')}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    /* Upload Tab */
                    <div className="p-8 flex flex-col items-center justify-center min-h-[300px] text-gray-500">
                        <input
                            type="file"
                            accept="image/*"
                            ref={sigImageInputRef}
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (ev) => addSignatureToDoc(ev.target.result);
                                    reader.readAsDataURL(file);
                                }
                            }}
                        />
                        <button
                            onClick={() => sigImageInputRef.current.click()}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium"
                        >
                            {t('selectImage')}
                        </button>
                        <button
                            onClick={onClose}
                            className="mt-4 text-gray-400 text-xs hover:text-gray-600"
                        >
                            {t('cancel')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SignatureModal;
