import { useState, useRef, useEffect, useCallback } from 'react';
import { FileText, RotateCw, MousePointer2, Trash2, Wand2 } from 'lucide-react';

import * as pdfjsLib from 'pdfjs-dist';
import './fonts/fonts.css';

// Import constants
import { translations, HANDWRITING_FONTS } from './constants';

// Import utilities
import { applyScanEffectToCanvas, exportPDF } from './utils';

// Import hooks
import { useSignatureDrawing, useSignatureGallery, useTranslation } from './hooks';

// Import components
import {
  TextElement,
  ImageElement,
  SignatureModal,
  PageNavigator,
  SignatureGallery,
  ScanEffectControls,
  ElementEditor,
  Header,
  Toolbar
} from './components';

const App = () => {
  // --- STATE ---
  const [lang, setLang] = useState('es');

  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);

  const [elements, setElements] = useState([]);
  const [pdfDimensions, setPdfDimensions] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [rotatingElementId, setRotatingElementId] = useState(null);

  // Pan/drag state for zoomed view
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const isPanningRef = useRef(false);
  const lastPanRef = useRef({ x: 0, y: 0 });

  const [textDefaults, setTextDefaults] = useState({
    fontFamily: 'Helvetica',
    fontSize: 24,
    color: '#000000'
  });

  const [isSigning, setIsSigning] = useState(false);
  const [activeTab, setActiveTab] = useState('draw');

  const [penColor, setPenColor] = useState('#000080');
  const [penSize, setPenSize] = useState(2);

  const [scanEffect, setScanEffect] = useState({
    enabled: false,
    grayscale: true,
    noise: 0.15,
    blur: 0.4,
    contrast: 1.2,
    brightness: 1.0,
    rotation: 0.8,
    inkThickness: 0
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [librariesLoaded, setLibrariesLoaded] = useState(false);

  // --- CUSTOM HOOKS ---
  const { t } = useTranslation(lang);
  const { savedSignatures, saveSignature, deleteSignature } = useSignatureGallery();
  const {
    signPadRef,
    startDrawing,
    draw,
    stopDrawing,
    clearPad,
    getSignatureDataUrl
  } = useSignatureDrawing(penColor, penSize);

  // --- REFS ---
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const sectionRef = useRef(null);
  const contentRef = useRef(null);
  const panStartRef = useRef({ x: 0, y: 0 });
  const renderTaskRef = useRef(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    const loadLibs = async () => {
      try {
        setStatusMsg(t('loadingLibs'));
        pdfjsLib.GlobalWorkerOptions.workerSrc = './pdf.worker.mjs';
        setLibrariesLoaded(true);
        setStatusMsg(t('readyToLoad'));
      } catch (err) {
        setStatusMsg(t('errorLibs'));
        console.error(err);
      }
    };
    loadLibs();
  }, [lang, t]);

  // --- ZOOM HANDLERS ---
  const handleZoomIn = () => {
    setScale(prev => Math.min(5.0, prev + 0.1));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(0.1, prev - 0.1));
  };

  // Wheel zoom (Ctrl + Wheel)
  const handleWheel = (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const zoomSensitivity = 0.001;
      const delta = -e.deltaY * zoomSensitivity;
      const newScale = Math.min(Math.max(0.1, scale + delta), 5.0);

      // Calculate zoom to cursor
      const rect = contentRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Adjust pan to keep cursor relative to content constant
      // This is complicated without a proper transform matrix, simplify for now:
      // Just zoom center or naive zoom
      setScale(newScale);
    } else {
      // Normal pan on wheel if not ctrl
      // e.preventDefault();
      // setPanPosition(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    }
  };

  // --- PDF RENDERING ---
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !librariesLoaded) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (renderTaskRef.current) {
      try {
        const cancelReturn = renderTaskRef.current.cancel();
        if (cancelReturn && typeof cancelReturn.catch === 'function') {
          await cancelReturn.catch(() => { });
        }
      } catch (error) { /* ignore cancel errors */ }
    }

    try {
      const page = await pdfDoc.getPage(pageNum);
      // High-res rendering viewport
      const viewport = page.getViewport({ scale });
      // Base viewport for layout dimensions
      const baseViewport = page.getViewport({ scale: 1.0 });

      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Ensure canvas fits the container which will be sized to baseViewport
      canvas.style.width = '100%';
      canvas.style.height = '100%';

      if (!pdfDimensions || pdfDimensions.width !== baseViewport.width) {
        setPdfDimensions({ width: baseViewport.width, height: baseViewport.height });
      }

      const renderContext = { canvasContext: context, viewport };
      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;

      await renderTask.promise;
      renderTaskRef.current = null;

      if (scanEffect.enabled) {
        applyScanEffectToCanvas(canvas, context, scanEffect);
      }
    } catch (err) {
      if (err?.name === 'RenderingCancelledException') return;
      console.error("Render error:", err);
    }
  }, [pdfDoc, pageNum, scale, scanEffect, librariesLoaded]);

  useEffect(() => {
    renderPage();
    return () => {
      if (renderTaskRef.current) {
        try {
          const cancelReturn = renderTaskRef.current.cancel();
          if (cancelReturn && typeof cancelReturn.catch === 'function') {
            cancelReturn.catch(() => { });
          }
        } catch (e) { /* ignore */ }
      }
    };
  }, [renderPage]);

  // --- FILE HANDLING ---
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('PDF only.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const loadedPdf = await pdfjsLib.getDocument({
          data: new Uint8Array(ev.target.result),
          verbosity: 0
        }).promise;
        setPdfDoc(loadedPdf);
        setTotalPages(loadedPdf.numPages);
        setPageNum(1);
        setScale(1.0);
        setElements([]);
        setStatusMsg(`${t('pdfLoaded')}: ${file.name}`);
      } catch (err) {
        console.error(err);
        setStatusMsg(t('errorPdf'));
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // --- SIGNATURE GALLERY ACTIONS ---
  const saveToGallery = () => {
    const dataUrl = getSignatureDataUrl();
    if (dataUrl) {
      saveSignature(dataUrl);
      setStatusMsg(t('savedGallery'));
    }
  };

  // --- ELEMENT MANAGEMENT ---
  const addSignatureToDoc = (sourceImage) => {
    const newItem = {
      id: Date.now(),
      type: 'image',
      page: pageNum,
      x: 100,
      y: 100,
      rotation: 0,
      image: sourceImage,
      width: 200,
      height: 100
    };
    setElements(prev => [...prev, newItem]);
    setSelectedId(newItem.id);
    setIsSigning(false);
  };

  const addTextToDoc = () => {
    const newItem = {
      id: Date.now(),
      type: 'text',
      page: pageNum,
      content: lang === 'es' ? 'Escribe aquí' : 'Type here',
      fontSize: textDefaults.fontSize,
      fontFamily: textDefaults.fontFamily,
      color: textDefaults.color,
      x: 150,
      y: 150,
      rotation: 0,
      width: 200,
      height: 35
    };
    setElements(prev => [...prev, newItem]);
    setSelectedId(newItem.id);
    setEditingId(newItem.id);
  };

  // --- PAN HANDLERS (Transform based) ---
  const handlePanStart = (e) => {
    if (!sectionRef.current) return;

    // Check if clicking on background or pan-area
    const target = e.target;
    // Allow panning if clicking directly on section, content wrapper, or canvas (if strictly background)
    const isBackground =
      target === sectionRef.current ||
      target === contentRef.current ||
      target.tagName === 'CANVAS' ||
      target.closest('.pan-area');

    if (!isBackground) return;

    // If we clicked on an interactive element, don't pan
    if (target.closest('button') || target.closest('input')) return;

    e.preventDefault();
    isPanningRef.current = true;
    setIsPanning(true);

    panStartRef.current = { x: e.clientX, y: e.clientY };
    lastPanRef.current = { ...panPosition };

    const onMouseMove = (moveEvent) => {
      if (!isPanningRef.current) return;

      const dx = moveEvent.clientX - panStartRef.current.x;
      const dy = moveEvent.clientY - panStartRef.current.y;

      setPanPosition({
        x: lastPanRef.current.x + dx,
        y: lastPanRef.current.y + dy
      });
    };

    const onMouseUp = () => {
      isPanningRef.current = false;
      setIsPanning(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // --- INTERACTION HANDLERS ---
  const handleMouseDown = (e, id) => {
    if (scanEffect.enabled || editingId || isPanningRef.current) return;
    e.stopPropagation();
    // e.preventDefault(); // allow focus

    const el = elements.find(el => el.id === id);
    if (!el) return;

    setSelectedId(id);

    const startX = e.clientX;
    const startY = e.clientY;

    // We work in "screen" coordinates for validity, but updates are relative
    // To move properly, we just need delta / scale.

    let lastX = startX;
    let lastY = startY;

    const onMouseMove = (moveEvent) => {
      const dx = (moveEvent.clientX - lastX) / scale;
      const dy = (moveEvent.clientY - lastY) / scale;
      lastX = moveEvent.clientX;
      lastY = moveEvent.clientY;

      setElements(prev => prev.map(item =>
        item.id === id ? { ...item, x: item.x + dx, y: item.y + dy } : item
      ));
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // Handler for dragging text while in editing mode
  const handleEditingDrag = (e, id) => {
    e.stopPropagation();
    e.preventDefault();

    const el = elements.find(el => el.id === id);
    if (!el) return;

    let lastX = e.clientX;
    let lastY = e.clientY;

    const onMouseMove = (moveEvent) => {
      const dx = (moveEvent.clientX - lastX) / scale;
      const dy = (moveEvent.clientY - lastY) / scale;
      lastX = moveEvent.clientX;
      lastY = moveEvent.clientY;

      setElements(prev => prev.map(item =>
        item.id === id ? { ...item, x: item.x + dx, y: item.y + dy } : item
      ));
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleResizeStart = (e, id) => {
    if (scanEffect.enabled) return;
    e.stopPropagation();
    e.preventDefault();

    const el = elements.find(el => el.id === id);
    if (!el) return;

    setSelectedId(id);

    const startX = e.clientX;
    const startY = e.clientY;
    const initialWidth = el.width;
    const initialHeight = el.height;
    const initialFontSize = el.fontSize;
    const aspect = el.type !== 'text' ? initialWidth / initialHeight : 1;

    const onMouseMove = (moveEvent) => {
      const dx = (moveEvent.clientX - startX) / scale;
      const dy = (moveEvent.clientY - startY) / scale;

      setElements(prev => prev.map(item => {
        if (item.id !== id) return item;

        if (item.type === 'text') {
          const newSize = Math.max(8, initialFontSize + (dy * 0.5));
          return { ...item, fontSize: newSize, height: newSize * 1.35 };
        }
        const newWidth = Math.max(20, initialWidth + dx);
        return { ...item, width: newWidth, height: newWidth / aspect };
      }));
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleRotationSliderStart = (e, id) => {
    if (scanEffect.enabled) return;
    e.stopPropagation();
    e.preventDefault();

    const el = elements.find(el => el.id === id);
    if (!el) return;

    setSelectedId(id);
    setRotatingElementId(id);

    const startY = e.clientY;
    const startRotation = el.rotation;

    const onMouseMove = (moveEvent) => {
      const verticalDiff = moveEvent.clientY - startY;
      let nextRotation = startRotation - verticalDiff;
      nextRotation = ((nextRotation + 180) % 360);
      if (nextRotation < 0) nextRotation += 360;
      nextRotation -= 180;

      setElements(prev => prev.map(item =>
        item.id === id ? { ...item, rotation: nextRotation } : item
      ));
    };

    const onMouseUp = () => {
      setRotatingElementId(null);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleContainerClick = () => {
    setSelectedId(null);
    setEditingId(null);
  };

  const updateSelected = (updates) => {
    if (!selectedId) return;

    setElements(prev => prev.map(el => {
      if (el.id === selectedId) {
        const updated = { ...el, ...updates };
        if (el.type === 'text') {
          setTextDefaults({
            fontFamily: updated.fontFamily,
            fontSize: updated.fontSize,
            color: updated.color
          });
        }
        return updated;
      }
      return el;
    }));
  };

  const humanizeText = () => {
    if (!selectedId) return;
    const randomFont = HANDWRITING_FONTS[Math.floor(Math.random() * HANDWRITING_FONTS.length)];
    const randomRotation = (Math.random() - 0.5) * 4;
    updateSelected({
      fontFamily: randomFont,
      rotation: randomRotation,
      fontSize: 30
    });
  };

  const deleteElement = (id) => {
    setElements(prev => prev.filter(e => e.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  // --- PDF EXPORT ---
  const downloadProcessedPDF = async () => {
    if (!pdfDoc) return;
    setIsProcessing(true);

    try {
      await exportPDF(
        pdfDoc,
        totalPages,
        elements,
        scanEffect,
        (pageNum) => setStatusMsg(`${t('processingPage')} ${pageNum}...`)
      );
      setStatusMsg(t('downloadComplete'));
    } catch (err) {
      console.error(err);
      setStatusMsg(t('exportError'));
    } finally {
      setIsProcessing(false);
    }
  };

  // --- RENDER HELPERS ---
  const selectedElement = elements.find(s => s.id === selectedId);

  const renderElementControls = (el) => {
    const isSelected = selectedId === el.id;
    const isEditing = editingId === el.id;
    const isBeingRotated = rotatingElementId === el.id;

    const controlBaseStyle = {
      pointerEvents: 'auto',
      transform: `rotate(${-el.rotation}deg)`,
      transformOrigin: 'center center',
      position: 'absolute'
    };

    const rotationSlider = isSelected && !scanEffect.enabled && !isEditing && (
      <div
        className={`w-8 flex flex-col items-center justify-center z-30 h-full transition-opacity duration-200 ${isBeingRotated ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        style={{
          ...controlBaseStyle,
          right: '-55px', top: '50%',
          transform: `translateY(-50%) rotate(${-el.rotation}deg)`
        }}
      >
        <div className={`w-1.5 h-32 bg-blue-500/10 rounded-full relative flex items-center justify-center transition-all ${isBeingRotated ? 'bg-blue-500/30 h-48' : ''}`}>
          <div
            className="relative group/btn cursor-ns-resize"
            onMouseDown={(e) => handleRotationSliderStart(e, el.id)}
          >
            <div className="w-7 h-7 bg-white border-2 border-blue-500 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-50 transition-colors">
              <RotateCw size={14} className="text-blue-500" />
            </div>
            {!isBeingRotated && (
              <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-8 h-full pointer-events-none opacity-0 group-hover/btn:opacity-100 transition-opacity">
                <div className="sample-cursor-anim absolute left-1/2 -translate-x-1/2 text-blue-500/60 drop-shadow-sm">
                  <MousePointer2 size={16} fill="currentColor" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );

    const topMenu = isSelected && !scanEffect.enabled && !isEditing && (
      <div
        className={`flex items-center gap-1 bg-white shadow-xl rounded-md p-1 z-50 border border-gray-200 transition-opacity duration-200 ${isBeingRotated ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          ...controlBaseStyle,
          top: '-60px', left: '50%',
          transform: `translateX(-50%) rotate(${-el.rotation}deg)`
        }}
      >
        {el.type === 'text' && (
          <button onClick={humanizeText} className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded" title={t('humanize')}>
            <Wand2 size={14} />
          </button>
        )}
        <button onClick={() => deleteElement(el.id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded" title={t('delete')}>
          <Trash2 size={14} />
        </button>
      </div>
    );

    const bottomMenu = isSelected && !scanEffect.enabled && !isEditing && el.type === 'text' && (
      <div
        className={`flex items-center gap-1 bg-white shadow-xl rounded-md p-1 z-50 border border-gray-200 transition-opacity duration-200 ${isBeingRotated ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          ...controlBaseStyle,
          bottom: '-60px', left: '50%',
          transform: `translateX(-50%) rotate(${-el.rotation}deg)`
        }}
      >
        <div className="flex gap-1">
          {['#000000', '#000080', '#FF0000', '#006400'].map(c => (
            <button
              key={c}
              onClick={() => updateSelected({ color: c })}
              className="w-5 h-5 rounded-full border border-gray-300 hover:scale-110 transition-transform"
              style={{ background: c }}
            />
          ))}
        </div>
      </div>
    );

    const resizeHandle = isSelected && !scanEffect.enabled && !isEditing && (
      <div
        className={`w-5 h-5 bg-white border-2 border-blue-500 rounded-full cursor-se-resize z-20 shadow-sm hover:scale-125 transition-all duration-200 ${isBeingRotated ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}
        onMouseDown={(e) => handleResizeStart(e, el.id)}
        style={{
          ...controlBaseStyle,
          bottom: '-10px', right: '-10px',
          transform: `rotate(${-el.rotation}deg)`
        }}
      />
    );

    return { rotationSlider, topMenu, bottomMenu, resizeHandle };
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col">
      <style>{`
        @keyframes slideUpDownSample {
          0%, 100% { transform: translateY(12px); opacity: 0; }
          20% { opacity: 1; }
          50% { transform: translateY(-12px); }
          80% { opacity: 1; }
        }
        .sample-cursor-anim {
          animation: slideUpDownSample 2s ease-in-out infinite;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 10px; }
        .cursor-grab { cursor: grab; }
        .cursor-grabbing { cursor: grabbing !important; }
        .cursor-grabbing * { cursor: grabbing !important; }
      `}</style>

      <Header
        lang={lang}
        setLang={setLang}
        statusMsg={statusMsg}
        pdfDoc={pdfDoc}
        onUploadClick={() => fileInputRef.current.click()}
        t={t}
      />

      <main className="flex-1 flex overflow-hidden">
        <input
          type="file"
          accept="application/pdf"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
        />

        <aside className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col overflow-y-auto custom-scrollbar">
          {selectedElement && !scanEffect.enabled && (
            <ElementEditor
              selectedElement={selectedElement}
              onUpdate={updateSelected}
              onHumanize={humanizeText}
              onDelete={deleteElement}
              t={t}
            />
          )}

          <SignatureGallery
            savedSignatures={savedSignatures}
            onSelectSignature={addSignatureToDoc}
            onDeleteSignature={deleteSignature}
            t={t}
          />

          <ScanEffectControls
            scanEffect={scanEffect}
            onScanEffectChange={setScanEffect}
            t={t}
          />

          <Toolbar
            pdfDoc={pdfDoc}
            isProcessing={isProcessing}
            onNewSignature={() => setIsSigning(true)}
            onAddText={addTextToDoc}
            onDownload={downloadProcessedPDF}
            t={t}
          />
        </aside>

        <section
          ref={sectionRef}
          className={`flex-1 bg-gray-950 relative overflow-hidden flex items-center justify-center ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={handlePanStart}
          onWheel={handleWheel} // Optional: Support wheel zoom/pan
        >
          {/* Infinite Canvas Container */}
          {!pdfDoc && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 pointer-events-none">
              <div className="pointer-events-auto flex flex-col items-center">
                <FileText size={64} className="mb-4 opacity-20" />
                <p className="text-lg">{t('noDoc')}</p>
                <button
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current.click(); }}
                  className="mt-4 text-blue-400 hover:underline"
                >
                  {t('selectFile')}
                </button>
              </div>
            </div>
          )}

          {pdfDoc && (
            <div
              ref={contentRef}
              className="relative shadow-2xl origin-top-left will-change-transform pan-area"
              style={{
                transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${scale})`,
                width: pdfDimensions?.width || 'auto',
                height: pdfDimensions?.height || 'auto',
                filter: scanEffect.enabled ? `blur(${scanEffect.blur}px)` : 'none',
                // Note: Rotation is handled inside, can be moved here if we want whole doc rotation
                // But user asked for scan effect rotation specifically
              }}
            >
              {/* Document Rotation Wrapper (Scan Effect) */}
              <div style={{
                transform: scanEffect.enabled ? `rotate(${scanEffect.rotation}deg)` : 'none',
                backgroundColor: 'white',
                width: '100%', height: '100%'
              }}>
                <canvas ref={canvasRef} className="block pan-area" />

                {elements.filter(el => el.page === pageNum).map((el) => {
                  const isSelected = selectedId === el.id;
                  const isEditing = editingId === el.id;
                  const controls = renderElementControls(el);

                  // ... Render logic remains same, just ensuring context
                  if (el.type === 'image') {
                    return (
                      <ImageElement
                        key={el.id}
                        el={el}
                        scale={scale} /* Scale is handled by parent transform now! OR passed down if elements calculate own size. 
                                     Actually, elements are children of scaled div, so they inherit scale. 
                                     BUT TextElement uses scale prop for fontSize... 
                                     Wait. If parent is scaled, child font size 24px becomes 24*scale visually.
                                     Previously we passed `scale` to elements. 
                                     If we use CSS scale on parent, we should pass scale={1} to elements 
                                     so they render at "native" size and let CSS scale them up. */
                        isSelected={isSelected}
                        scanEffect={scanEffect}
                        onMouseDown={handleMouseDown}
                        rotationSlider={controls.rotationSlider}
                        topMenu={controls.topMenu}
                        resizeHandle={controls.resizeHandle}
                      />
                    );
                  }
                  if (el.type === 'text') {
                    const handlers = {
                      handleMouseDown,
                      handleEditingDrag,
                      setEditingId,
                      setSelectedId,
                      onContentChange: (id, val) => setElements(prev =>
                        prev.map(item => item.id === id ? { ...item, content: val } : item)
                      ),
                      rotationSlider: controls.rotationSlider,
                      topMenu: controls.topMenu,
                      bottomMenu: controls.bottomMenu,
                      resizeHandle: controls.resizeHandle
                    };

                    return (
                      <TextElement
                        key={el.id}
                        el={el}
                        scale={scale} // Pass scale for correct bounds calculation in editing
                        isSelected={isSelected}
                        isEditing={isEditing}
                        scanEffect={scanEffect}
                        handlers={handlers}
                        onUpdate={(id, updates) => {
                          setElements(prev =>
                            prev.map(item => item.id === id ? { ...item, ...updates } : item)
                          );
                        }}
                      />
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}

          {pdfDoc && (
            <PageNavigator
              pageNum={pageNum}
              totalPages={totalPages}
              scale={scale}
              onPageChange={setPageNum}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              t={t}
            />
          )}
        </section>
      </main>

      <SignatureModal
        isOpen={isSigning}
        onClose={() => setIsSigning(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        penColor={penColor}
        setPenColor={setPenColor}
        penSize={penSize}
        setPenSize={setPenSize}
        signPadRef={signPadRef}
        startDrawing={startDrawing}
        draw={draw}
        stopDrawing={stopDrawing}
        clearPad={clearPad}
        saveToGallery={saveToGallery}
        addSignatureToDoc={addSignatureToDoc}
        t={t}
      />
    </div >
  );
};

export default App;