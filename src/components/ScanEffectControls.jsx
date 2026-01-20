// ScanEffectControls component
import { Sliders, Droplet } from 'lucide-react';

/**
 * ScanEffectControls - Controls for scanner effect settings
 */
const ScanEffectControls = ({
    scanEffect,
    onScanEffectChange,
    t // translation function
}) => {
    const updateEffect = (key, value) => {
        onScanEffectChange({ ...scanEffect, [key]: value });
    };

    return (
        <div className="p-6 border-b border-gray-700">
            <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold flex items-center gap-2">
                    <Sliders size={18} /> {t('scannerEffect')}
                </h2>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={scanEffect.enabled}
                        onChange={(e) => updateEffect('enabled', e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                </label>
            </div>

            {scanEffect.enabled && (
                <div className="space-y-4 text-sm">
                    {/* Grayscale Toggle */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">{t('grayscale')}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={scanEffect.grayscale}
                                onChange={(e) => updateEffect('grayscale', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                        </label>
                    </div>

                    {/* Ink Thickness */}
                    <div>
                        <div className="flex justify-between mb-1 text-xs text-gray-400 items-center gap-1">
                            <span className="flex items-center gap-1">
                                <Droplet size={12} /> {t('inkThickness')}
                            </span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="5"
                            step="0.5"
                            value={scanEffect.inkThickness}
                            onChange={(e) => updateEffect('inkThickness', parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    {/* Noise */}
                    <div>
                        <div className="flex justify-between mb-1 text-xs text-gray-400">
                            <span>{t('noise')}</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="0.5"
                            step="0.01"
                            value={scanEffect.noise}
                            onChange={(e) => updateEffect('noise', parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    {/* Contrast */}
                    <div>
                        <div className="flex justify-between mb-1 text-xs text-gray-400">
                            <span>{t('contrast')}</span>
                        </div>
                        <input
                            type="range"
                            min="0.5"
                            max="3"
                            step="0.1"
                            value={scanEffect.contrast}
                            onChange={(e) => updateEffect('contrast', parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    {/* Page Rotation */}
                    <div>
                        <div className="flex justify-between mb-1 text-xs text-gray-400">
                            <span>{t('pageRotation')}</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="2"
                            step="0.1"
                            value={scanEffect.rotation}
                            onChange={(e) => updateEffect('rotation', parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScanEffectControls;
