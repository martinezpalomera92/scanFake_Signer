import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, PenTool, Download, RotateCcw, FileText, Check, Eraser, Move, Sun, Type, Sliders, Edit3, Trash2, Maximize, ZoomIn, ZoomOut, Save, Image as ImageIcon, Plus, Wand2, Palette, Scaling, Droplet, RefreshCw, RotateCw, MousePointer2, Languages } from 'lucide-react';

// CDN Links for PDF libraries
const PDFJS_CDN = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
const PDFJS_WORKER_CDN = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
const JSPDF_CDN = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";

// Google Fonts for Handwriting Simulation
const HANDWRITING_FONTS = [
  'Caveat',
  'Dancing Script',
  'Homemade Apple',
  'Just Another Hand',
  'Reenie Beanie',
  'Shadows Into Light'
];

// --- TRADUCCIONES ---
const translations = {
  es: {
    uploadPdf: "Subir PDF",
    readyToLoad: "Listo para cargar documento",
    loadingLibs: "Cargando librerías gráficas...",
    errorLibs: "Error cargando librerías.",
    pdfLoaded: "PDF cargado",
    errorPdf: "Error al analizar PDF.",
    edit: "Editar",
    text: "Texto",
    signature: "Firma",
    content: "Contenido",
    humanize: "Humanizar Texto",
    font: "Tipografía",
    digital: "Digital (Helvetica)",
    size: "Tamaño",
    color: "Color",
    rotation: "Rotación",
    delete: "Eliminar",
    gallery: "Galería de Firmas",
    noSignatures: "No tienes firmas guardadas.",
    scannerEffect: "Efecto Escáner",
    grayscale: "Blanco y Negro",
    inkThickness: "Grosor Tinta",
    noise: "Ruido",
    contrast: "Contraste",
    pageRotation: "Rotación Hoja",
    newSignature: "Nueva Firma",
    addText: "Agregar Texto",
    download: "Descargar PDF",
    processing: "Procesando...",
    prev: "Anterior",
    next: "Siguiente",
    noDoc: "No hay documento cargado",
    selectFile: "Seleccionar archivo",
    drawTab: "Dibujar Firma",
    uploadTab: "Subir Imagen",
    blue: "Azul",
    black: "Negro",
    thickness: "Grosor",
    signHere: "Firma aquí",
    clear: "Borrar",
    save: "Guardar",
    cancel: "Cancelar",
    use: "Usar",
    selectImage: "Seleccionar Imagen",
    statusReady: "Listo para cargar documento",
    processingPage: "Procesando página",
    downloadComplete: "Descarga completada.",
    exportError: "Error exportando PDF.",
    savedGallery: "Firma guardada en galería"
  },
  en: {
    uploadPdf: "Upload PDF",
    readyToLoad: "Ready to load document",
    loadingLibs: "Loading graphic libraries...",
    errorLibs: "Error loading libraries.",
    pdfLoaded: "PDF loaded",
    errorPdf: "Error parsing PDF.",
    edit: "Edit",
    text: "Text",
    signature: "Signature",
    content: "Content",
    humanize: "Humanize Text",
    font: "Font Family",
    digital: "Digital (Helvetica)",
    size: "Size",
    color: "Color",
    rotation: "Rotation",
    delete: "Delete",
    gallery: "Signature Gallery",
    noSignatures: "No saved signatures.",
    scannerEffect: "Scanner Effect",
    grayscale: "Grayscale",
    inkThickness: "Ink Thickness",
    noise: "Noise",
    contrast: "Contrast",
    pageRotation: "Page Rotation",
    newSignature: "New Signature",
    addText: "Add Text",
    download: "Download PDF",
    processing: "Processing...",
    prev: "Previous",
    next: "Next",
    noDoc: "No document loaded",
    selectFile: "Select file",
    drawTab: "Draw Signature",
    uploadTab: "Upload Image",
    blue: "Blue",
    black: "Black",
    thickness: "Thickness",
    signHere: "Sign here",
    clear: "Clear",
    save: "Save",
    cancel: "Cancel",
    use: "Use",
    selectImage: "Select Image",
    statusReady: "Ready to load document",
    processingPage: "Processing page",
    downloadComplete: "Download complete.",
    exportError: "Error exporting PDF.",
    savedGallery: "Signature saved to gallery"
  }
};

const App = () => {
  // --- ESTADO ---
  const [lang, setLang] = useState('es'); // Idioma actual
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);

  const [elements, setElements] = useState([]);
  const [savedSignatures, setSavedSignatures] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [rotatingElementId, setRotatingElementId] = useState(null);

  const [textDefaults, setTextDefaults] = useState({
    fontFamily: 'Helvetica',
    fontSize: 24,
    color: '#000000'
  });

  const [isSigning, setIsSigning] = useState(false);
  const [activeTab, setActiveTab] = useState('draw');

  const [penColor, setPenColor] = useState('#000080');
  const [penSize, setPenSize] = useState(2);
  const [penSmoothing, setPenSmoothing] = useState(true);

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

  // --- REFS ---
  const canvasRef = useRef(null);
  const signPadRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const sigImageInputRef = useRef(null);
  const interactionRef = useRef(null);
  const renderTaskRef = useRef(null);
  const pointsRef = useRef([]);
  const isDrawingRef = useRef(false);

  // Helper de traducción
  const t = (key) => translations[lang][key] || key;

  // --- INICIALIZACIÓN ---
  useEffect(() => {
    const saved = localStorage.getItem('scanfake_signatures');
    if (saved) {
      try { setSavedSignatures(JSON.parse(saved)); } catch (e) { console.error(e); }
    }

    const fontId = 'scanfake-handwriting-fonts';
    if (!document.getElementById(fontId)) {
      const link = document.createElement('link');
      link.id = fontId;
      link.href = 'https://fonts.googleapis.com/css2?family=Caveat&family=Dancing+Script&family=Homemade+Apple&family=Just+Another+Hand&family=Reenie+Beanie&family=Shadows+Into+Light&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }

    const loadLibs = async () => {
      try {
        setStatusMsg(t('loadingLibs'));
        if (!window.pdfjsLib) {
          await loadScript(PDFJS_CDN);
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;
        }
        if (!window.jspdf) {
          await loadScript(JSPDF_CDN);
        }
        setLibrariesLoaded(true);
        setStatusMsg(t('readyToLoad'));
      } catch (err) {
        setStatusMsg(t('errorLibs'));
        console.error(err);
      }
    };
    loadLibs();
  }, [lang]); // Recargar statusMsg si cambia el idioma

  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const handleZoomIn = (e) => {
    e.stopPropagation();
    setScale(prev => Math.min(3.0, prev + 0.1));
  };

  const handleZoomOut = (e) => {
    e.stopPropagation();
    setScale(prev => Math.max(0.5, prev - 0.1));
  };

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
      } catch (error) { }
    }

    try {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = { canvasContext: context, viewport: viewport };
      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;

      await renderTask.promise;
      renderTaskRef.current = null;

      if (scanEffect.enabled) applyScanEffectToCanvas(canvas, context);

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
        } catch (e) { }
      }
    };
  }, [renderPage]);

  const applyScanEffectToCanvas = (canvas, ctx) => {
    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const contrastFactor = scanEffect.contrast;
    const brightness = scanEffect.brightness;
    const noiseAmount = scanEffect.noise * 255;
    const isGray = scanEffect.grayscale;

    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * noiseAmount;

      let r = (data[i] + noise - 128) * contrastFactor + 128;
      let g = (data[i + 1] + noise - 128) * contrastFactor + 128;
      let b = (data[i + 2] + noise - 128) * contrastFactor + 128;

      r *= brightness; g *= brightness; b *= brightness;

      if (isGray) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        let finalVal = gray;
        if (gray > 220) finalVal = 255; else if (gray < 60) finalVal = 40;
        finalVal = Math.min(255, Math.max(0, finalVal));
        data[i] = data[i + 1] = data[i + 2] = finalVal;
      } else {
        data[i] = Math.min(255, Math.max(0, r));
        data[i + 1] = Math.min(255, Math.max(0, g));
        data[i + 2] = Math.min(255, Math.max(0, b));
      }
    }
    ctx.putImageData(imageData, 0, 0);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { alert('PDF only.'); return; }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const loadedPdf = await window.pdfjsLib.getDocument(new Uint8Array(ev.target.result)).promise;
        setPdfDoc(loadedPdf);
        setTotalPages(loadedPdf.numPages);
        setPageNum(1);
        setScale(1.0);
        setElements([]);
        setStatusMsg(`${t('pdfLoaded')}: ${file.name}`);
      } catch (err) { console.error(err); setStatusMsg(t('errorPdf')); }
    };
    reader.readAsArrayBuffer(file);
  };

  const getCoords = (e) => {
    const canvas = signPadRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    return { x, y, time: Date.now() };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    isDrawingRef.current = true;
    const point = getCoords(e);
    pointsRef.current = [point];
  };

  const draw = (e) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const point = getCoords(e);
    pointsRef.current.push(point);
    const canvas = signPadRef.current;
    const ctx = canvas.getContext('2d');

    if (!penSmoothing) {
      const prev = pointsRef.current[pointsRef.current.length - 2];
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(point.x, point.y);
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penSize;
      ctx.lineCap = 'round';
      ctx.stroke();
      return;
    }
    if (pointsRef.current.length < 3) return;
    const p1 = pointsRef.current[pointsRef.current.length - 3];
    const p2 = pointsRef.current[pointsRef.current.length - 2];
    const p3 = pointsRef.current[pointsRef.current.length - 1];
    const cp1 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    const cp2 = { x: (p2.x + p3.x) / 2, y: (p2.y + p3.y) / 2 };
    const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    const timeDiff = p2.time - p1.time || 16;
    const velocity = dist / timeDiff;
    const dynamicWidth = Math.max(penSize * 0.4, Math.min(penSize * 1.5, penSize * (1.5 - velocity * 0.15)));
    ctx.beginPath();
    ctx.moveTo(cp1.x, cp1.y);
    ctx.quadraticCurveTo(p2.x, p2.y, cp2.x, cp2.y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = dynamicWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => { isDrawingRef.current = false; };
  const clearPad = () => {
    const canvas = signPadRef.current;
    if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    pointsRef.current = [];
  };

  const saveToGallery = () => {
    if (!signPadRef.current) return;
    const dataUrl = signPadRef.current.toDataURL('image/png');
    const newSaved = [...savedSignatures, dataUrl];
    setSavedSignatures(newSaved);
    localStorage.setItem('scanfake_signatures', JSON.stringify(newSaved));
    setStatusMsg(t('savedGallery'));
  };

  const deleteFromGallery = (index) => {
    const newSaved = savedSignatures.filter((_, i) => i !== index);
    setSavedSignatures(newSaved);
    localStorage.setItem('scanfake_signatures', JSON.stringify(newSaved));
  };

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
    setElements([...elements, newItem]);
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
    setElements([...elements, newItem]);
    setSelectedId(newItem.id);
    setEditingId(newItem.id);
  };

  // --- LÓGICA DE INTERACCIÓN ---
  const handleMouseDown = (e, id) => {
    if (scanEffect.enabled || editingId) return;
    e.stopPropagation();
    e.preventDefault();

    const el = elements.find(el => el.id === id);
    if (!el) return;

    setSelectedId(id);

    interactionRef.current = {
      mode: 'move',
      id,
      startX: e.clientX,
      startY: e.clientY
    };

    document.addEventListener('mousemove', handleInteractionMove);
    document.addEventListener('mouseup', handleInteractionUp);
  };

  const handleResizeStart = (e, id) => {
    if (scanEffect.enabled) return;
    e.stopPropagation();
    e.preventDefault();

    const el = elements.find(el => el.id === id);
    if (!el) return;

    setSelectedId(id);

    interactionRef.current = {
      mode: 'resize',
      id,
      startX: e.clientX,
      startY: e.clientY,
      initialParams: el.type === 'text'
        ? { fontSize: el.fontSize }
        : { width: el.width, height: el.height }
    };

    document.addEventListener('mousemove', handleInteractionMove);
    document.addEventListener('mouseup', handleInteractionUp);
  };

  const handleRotationSliderStart = (e, id) => {
    if (scanEffect.enabled) return;
    e.stopPropagation();
    e.preventDefault();

    const el = elements.find(el => el.id === id);
    if (!el) return;

    setSelectedId(id);
    setRotatingElementId(id);

    interactionRef.current = {
      mode: 'rotate-slider',
      id,
      startY: e.clientY,
      startRotation: el.rotation
    };

    document.addEventListener('mousemove', handleInteractionMove);
    document.addEventListener('mouseup', handleInteractionUp);
  };

  const handleInteractionMove = (e) => {
    if (!interactionRef.current) return;
    const { mode, id, startX, startY, initialParams, startRotation } = interactionRef.current;

    const dx = (e.clientX - startX) / scale;
    const dy = (e.clientY - startY) / scale;

    setElements(prev => prev.map(el => {
      if (el.id !== id) return el;

      if (mode === 'move') {
        return { ...el, x: el.x + dx, y: el.y + dy };
      }
      else if (mode === 'resize') {
        if (el.type === 'text') {
          const newSize = Math.max(8, initialParams.fontSize + (dy * 0.5));
          return { ...el, fontSize: newSize, height: newSize * 1.35 };
        } else {
          const aspect = initialParams.width / initialParams.height;
          const newWidth = Math.max(20, initialParams.width + dx);
          const newHeight = newWidth / aspect;
          return { ...el, width: newWidth, height: newHeight };
        }
      }
      else if (mode === 'rotate-slider') {
        const verticalDiff = (e.clientY - startY);
        let nextRotation = startRotation - verticalDiff;

        nextRotation = ((nextRotation + 180) % 360);
        if (nextRotation < 0) nextRotation += 360;
        nextRotation -= 180;

        return { ...el, rotation: nextRotation };
      }
      return el;
    }));

    if (mode === 'move') {
      interactionRef.current.startX = e.clientX;
      interactionRef.current.startY = e.clientY;
    }
  };

  const handleInteractionUp = () => {
    interactionRef.current = null;
    setRotatingElementId(null);
    document.removeEventListener('mousemove', handleInteractionMove);
    document.removeEventListener('mouseup', handleInteractionUp);
  };

  const handleContainerClick = () => {
    if (!interactionRef.current) {
      setSelectedId(null);
      setEditingId(null);
    }
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

  const downloadProcessedPDF = async () => {
    if (!pdfDoc) return;
    setIsProcessing(true);
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      for (let i = 1; i <= totalPages; i++) {
        if (i > 1) doc.addPage();
        setStatusMsg(`${t('processingPage')} ${i}...`);
        const page = await pdfDoc.getPage(i);
        const targetScale = 2.0;
        const viewport = page.getViewport({ scale: targetScale });

        const offCanvas = document.createElement('canvas');
        offCanvas.width = viewport.width;
        offCanvas.height = viewport.height;
        const offCtx = offCanvas.getContext('2d');

        offCtx.fillStyle = '#FFFFFF';
        offCtx.fillRect(0, 0, offCanvas.width, offCanvas.height);

        await page.render({ canvasContext: offCtx, viewport }).promise;

        const pageElements = elements.filter(e => e.page === i);
        for (let el of pageElements) {
          offCtx.save();
          const yOffsetCorrection = el.type === 'text' ? (el.fontSize * targetScale * 0.15) : 0;
          const centerX = (el.x + el.width / 2) * targetScale;
          const centerY = (el.y + el.height / 2) * targetScale;

          offCtx.translate(centerX, centerY);
          offCtx.rotate((el.rotation * Math.PI) / 180);

          if (el.type === 'image') {
            const img = new Image();
            img.src = el.image;
            await new Promise(r => img.onload = r);
            const w = el.width * targetScale;
            const h = el.height * targetScale;

            if (scanEffect.inkThickness > 0) {
              const thickness = scanEffect.inkThickness * targetScale * 0.4;
              const steps = 8;
              offCtx.globalAlpha = 0.8;
              for (let angle = 0; angle < Math.PI * 2; angle += (Math.PI * 2) / steps) {
                const dx = Math.cos(angle) * thickness;
                const dy = Math.sin(angle) * thickness;
                offCtx.drawImage(img, -w / 2 + dx, -h / 2 + dy, w, h);
              }
              offCtx.globalAlpha = 1.0;
            }
            offCtx.drawImage(img, -w / 2, -h / 2, w, h);
          }
          else if (el.type === 'text') {
            offCtx.font = `${el.fontSize * targetScale}px ${el.fontFamily || 'Helvetica'}`;
            offCtx.fillStyle = el.color;
            offCtx.textBaseline = 'middle';
            offCtx.textAlign = 'center';

            if (scanEffect.inkThickness > 0) {
              offCtx.strokeStyle = el.color;
              offCtx.lineWidth = scanEffect.inkThickness * targetScale * 0.2;
              offCtx.strokeText(el.content, 0, yOffsetCorrection);
            }
            offCtx.fillText(el.content, 0, yOffsetCorrection);
          }
          offCtx.restore();
        }

        if (scanEffect.enabled) {
          const rotCanvas = document.createElement('canvas');
          rotCanvas.width = offCanvas.width;
          rotCanvas.height = offCanvas.height;
          const rotCtx = rotCanvas.getContext('2d');
          rotCtx.fillStyle = '#FFFFFF';
          rotCtx.fillRect(0, 0, rotCanvas.width, rotCanvas.height);
          const angle = (Math.random() - 0.5) * 2 * scanEffect.rotation * (Math.PI / 180);
          rotCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
          rotCtx.rotate(angle);
          rotCtx.drawImage(offCanvas, -offCanvas.width / 2, -offCanvas.height / 2);
          rotCtx.setTransform(1, 0, 0, 1, 0, 0);

          const imgData = rotCtx.getImageData(0, 0, rotCanvas.width, rotCanvas.height);
          const d = imgData.data;
          const noiseAmt = scanEffect.noise * 255;
          for (let j = 0; j < d.length; j += 4) {
            const noise = (Math.random() - 0.5) * noiseAmt;
            let r = (d[j] + noise - 128) * scanEffect.contrast + 128;
            let g = (d[j + 1] + noise - 128) * scanEffect.contrast + 128;
            let b = (d[j + 2] + noise - 128) * scanEffect.contrast + 128;
            r *= scanEffect.brightness; g *= scanEffect.brightness; b *= scanEffect.brightness;
            if (scanEffect.grayscale) {
              const gray = 0.299 * r + 0.587 * g + 0.114 * b;
              let val = gray > 220 ? 255 : (gray < 70 ? 30 : gray);
              d[j] = d[j + 1] = d[j + 2] = Math.min(255, Math.max(0, val));
            } else {
              d[j] = Math.min(255, Math.max(0, r));
              d[j + 1] = Math.min(255, Math.max(0, g));
              d[j + 2] = Math.min(255, Math.max(0, b));
            }
          }
          rotCtx.putImageData(imgData, 0, 0);
          const finalImg = rotCanvas.toDataURL('image/jpeg', 0.8);
          const pdfWidth = doc.internal.pageSize.getWidth();
          doc.addImage(finalImg, 'JPEG', 0, 0, pdfWidth, (rotCanvas.height * pdfWidth) / rotCanvas.width);
        } else {
          const finalImg = offCanvas.toDataURL('image/jpeg', 1.0);
          const pdfWidth = doc.internal.pageSize.getWidth();
          doc.addImage(finalImg, 'JPEG', 0, 0, pdfWidth, (offCanvas.height * pdfWidth) / offCanvas.width);
        }
      }
      doc.save('signed_document.pdf');
      setStatusMsg(t('downloadComplete'));
    } catch (err) { console.error(err); setStatusMsg(t('exportError')); }
    finally { setIsProcessing(false); }
  };

  const selectedElement = elements.find(s => s.id === selectedId);

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
      `}</style>

      <header className="bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center shadow-md z-10">
        <div className="flex items-center gap-2">
          <FileText className="text-blue-400" />
          <h1 className="text-xl font-bold tracking-wider">Scan<span className="text-blue-400">Fake</span></h1>
        </div>
        <div className="flex items-center gap-4">
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
          <span className="text-sm text-gray-400 hidden sm:inline">{statusMsg}</span>
          {!pdfDoc && (
            <button onClick={() => fileInputRef.current.click()} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition text-sm">
              <Upload size={16} /> {t('uploadPdf')}
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <input type="file" accept="application/pdf" ref={fileInputRef} className="hidden" onChange={handleFileChange} />

        <aside className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col overflow-y-auto custom-scrollbar">
          {selectedElement && !scanEffect.enabled && (
            <div className="p-6 border-b border-gray-700 bg-blue-900/10">
              <h2 className="font-semibold flex items-center gap-2 mb-4 text-blue-400">
                <Edit3 size={18} /> {t('edit')} {selectedElement.type === 'text' ? t('text') : t('signature')}
              </h2>

              {selectedElement.type === 'text' && (
                <div className="mb-4">
                  <label className="text-xs text-gray-400 mb-1 block">{t('content')}</label>
                  <input
                    type="text"
                    value={selectedElement.content}
                    onChange={(e) => updateSelected({ content: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-sm text-white focus:border-blue-500 outline-none"
                  />

                  <button
                    onClick={humanizeText}
                    className="w-full mt-3 bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded flex items-center justify-center gap-2 text-xs transition shadow-sm border border-indigo-500"
                  >
                    <Wand2 size={14} /> {t('humanize')}
                  </button>

                  <div className="mt-4">
                    <label className="text-xs text-gray-400 mb-1 block">{t('font')}</label>
                    <select
                      value={selectedElement.fontFamily || 'Helvetica'}
                      onChange={(e) => updateSelected({ fontFamily: e.target.value })}
                      className="w-full bg-gray-700 border border-gray-600 rounded p-1 text-sm text-white"
                    >
                      <option value="Helvetica">{t('digital')}</option>
                      {HANDWRITING_FONTS.map(font => (
                        <option key={font} value={font}>{font}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-gray-400 mb-1 block">{t('size')}</label>
                      <input type="number" value={selectedElement.fontSize} onChange={(e) => updateSelected({ fontSize: parseInt(e.target.value) })} className="w-full bg-gray-700 border border-gray-600 rounded p-1 text-sm" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-400 mb-1 block">{t('color')}</label>
                      <input type="color" value={selectedElement.color} onChange={(e) => updateSelected({ color: e.target.value })} className="w-full h-8 bg-gray-700 rounded cursor-pointer" />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4 text-sm">
                <div>
                  <div className="flex justify-between mb-1 text-xs text-gray-400">
                    <span>{t('rotation')}</span> <span>{Math.round(selectedElement.rotation)}°</span>
                  </div>
                  <input type="range" min="-180" max="180" value={selectedElement.rotation} onChange={(e) => updateSelected({ rotation: parseInt(e.target.value) })} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                </div>

                {selectedElement.type !== 'text' && (
                  <div>
                    <div className="flex justify-between mb-1 text-xs text-gray-400"><span>{t('size')}</span></div>
                    <input type="range" min="50" max="500" value={selectedElement.width} onChange={(e) => { const w = parseInt(e.target.value); updateSelected({ width: w, height: w / 2 }); }} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                  </div>
                )}

                <button onClick={() => deleteElement(selectedId)} className="w-full mt-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 p-2 rounded flex items-center justify-center gap-2 text-xs transition">
                  <Trash2 size={14} /> {t('delete')}
                </button>
              </div>
            </div>
          )}

          <div className="p-6 border-b border-gray-700">
            <h2 className="font-semibold flex items-center gap-2 mb-4">
              <Save size={18} /> {t('gallery')}
            </h2>
            {savedSignatures.length === 0 ? (
              <p className="text-xs text-gray-500 italic">{t('noSignatures')}</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {savedSignatures.map((img, idx) => (
                  <div key={idx} className="relative group border border-gray-600 rounded bg-white overflow-hidden cursor-pointer hover:border-blue-500 transition" onClick={() => addSignatureToDoc(img)}>
                    <img src={img} className="w-full h-16 object-contain" alt="saved" />
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteFromGallery(idx); }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 border-b border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Sliders size={18} /> {t('scannerEffect')}
              </h2>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={scanEffect.enabled} onChange={(e) => setScanEffect({ ...scanEffect, enabled: e.target.checked })} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {scanEffect.enabled && (
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{t('grayscale')}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={scanEffect.grayscale} onChange={(e) => setScanEffect({ ...scanEffect, grayscale: e.target.checked })} className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div>
                  <div className="flex justify-between mb-1 text-xs text-gray-400 flex items-center gap-1">
                    <span className="flex items-center gap-1"><Droplet size={12} /> {t('inkThickness')}</span>
                  </div>
                  <input type="range" min="0" max="5" step="0.5" value={scanEffect.inkThickness} onChange={(e) => setScanEffect({ ...scanEffect, inkThickness: parseFloat(e.target.value) })} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                </div>
                <div>
                  <div className="flex justify-between mb-1 text-xs text-gray-400"><span>{t('noise')}</span></div>
                  <input type="range" min="0" max="0.5" step="0.01" value={scanEffect.noise} onChange={(e) => setScanEffect({ ...scanEffect, noise: parseFloat(e.target.value) })} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                </div>
                <div>
                  <div className="flex justify-between mb-1 text-xs text-gray-400"><span>{t('contrast')}</span></div>
                  <input type="range" min="0.5" max="3" step="0.1" value={scanEffect.contrast} onChange={(e) => setScanEffect({ ...scanEffect, contrast: parseFloat(e.target.value) })} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                </div>
                <div>
                  <div className="flex justify-between mb-1 text-xs text-gray-400"><span>{t('pageRotation')}</span></div>
                  <input type="range" min="0" max="2" step="0.1" value={scanEffect.rotation} onChange={(e) => setScanEffect({ ...scanEffect, rotation: parseFloat(e.target.value) })} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                </div>
              </div>
            )}
          </div>

          <div className="p-6 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setIsSigning(true)} disabled={!pdfDoc} className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white p-3 rounded-lg flex flex-col items-center justify-center gap-1 transition text-xs">
                <PenTool size={20} /> {t('newSignature')}
              </button>
              <button onClick={addTextToDoc} disabled={!pdfDoc} className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white p-3 rounded-lg flex flex-col items-center justify-center gap-1 transition text-xs">
                <Type size={20} /> {t('addText')}
              </button>
            </div>
            <button onClick={downloadProcessedPDF} disabled={!pdfDoc || isProcessing} className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:opacity-50 text-white p-3 rounded-lg flex items-center justify-center gap-2 shadow-lg transition">
              {isProcessing ? <RotateCcw className="animate-spin" size={18} /> : <Download size={18} />}
              {isProcessing ? t('processing') : t('download')}
            </button>
          </div>
        </aside>

        <section className="flex-1 bg-gray-950 relative flex flex-col items-center justify-start p-8 overflow-auto" ref={containerRef} onClick={handleContainerClick}>

          {!pdfDoc && (
            <div className="mt-20 flex flex-col items-center text-gray-500">
              <FileText size={64} className="mb-4 opacity-20" />
              <p className="text-lg">{t('noDoc')}</p>
              <button onClick={(e) => { e.stopPropagation(); fileInputRef.current.click() }} className="mt-4 text-blue-400 hover:underline">{t('selectFile')}</button>
            </div>
          )}

          <div className="relative shadow-2xl transition-all duration-300 origin-top" style={{
            width: pdfDoc ? canvasRef.current?.width : 'auto',
            height: pdfDoc ? canvasRef.current?.height : 'auto',
            filter: scanEffect.enabled ? `blur(${scanEffect.blur}px)` : 'none',
            transform: scanEffect.enabled ? `rotate(${Math.random() * 0.4 - 0.2}deg)` : 'none'
          }}>
            <canvas ref={canvasRef} className="bg-white block" />

            {elements.filter(el => el.page === pageNum).map((el) => {
              const isSelected = selectedId === el.id;
              const isEditing = editingId === el.id;
              const isBeingRotated = rotatingElementId === el.id;

              const style = {
                left: el.x * scale,
                top: el.y * scale,
                zIndex: 10,
                transform: `rotate(${el.rotation}deg)`,
                transformOrigin: 'center center',
                position: 'absolute',
                cursor: scanEffect.enabled ? 'default' : (isEditing ? 'text' : 'move')
              };

              const uiWrapperStyle = {
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                pointerEvents: 'none'
              };

              const controlBaseStyle = {
                pointerEvents: 'auto',
                transform: `rotate(${-el.rotation}deg)`,
                transformOrigin: 'center center',
                position: 'absolute'
              };

              // SLIDER DE ROTACIÓN MEJORADO
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
                      <button key={c} onClick={() => updateSelected({ color: c })} className="w-5 h-5 rounded-full border border-gray-300 hover:scale-110 transition-transform" style={{ background: c }} />
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

              if (el.type === 'image') {
                return (
                  <div key={el.id}
                    onMouseDown={(e) => handleMouseDown(e, el.id)}
                    onClick={(e) => e.stopPropagation()}
                    className={`group select-none ${isSelected && !scanEffect.enabled ? 'ring-2 ring-blue-500 ring-offset-4 ring-offset-transparent' : ''}`}
                    style={{ ...style, width: el.width * scale, height: el.height * scale, mixBlendMode: 'multiply' }}
                  >
                    <div style={uiWrapperStyle}>
                      {rotationSlider}
                      {topMenu}
                      {resizeHandle}
                    </div>
                    <img src={el.image} className="w-full h-full pointer-events-none object-contain" alt="sign" />
                  </div>
                );
              } else if (el.type === 'text') {
                return (
                  <div key={el.id}
                    onMouseDown={(e) => handleMouseDown(e, el.id)}
                    onClick={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => { e.stopPropagation(); setEditingId(el.id); setSelectedId(el.id); }}
                    className={`group whitespace-nowrap px-3 py-1 ${isSelected && !scanEffect.enabled && !isEditing ? 'ring-2 ring-blue-500 ring-offset-4 ring-offset-transparent' : 'border border-transparent hover:border-dashed hover:border-gray-400'}`}
                    style={{
                      ...style,
                      color: el.color,
                      fontSize: `${el.fontSize * scale}px`,
                      fontFamily: el.fontFamily || 'Helvetica',
                      lineHeight: '1.2',
                      textAlign: 'center',
                      minWidth: '50px'
                    }}
                  >
                    <div style={uiWrapperStyle}>
                      {rotationSlider}
                      {topMenu}
                      {bottomMenu}
                      {resizeHandle}
                    </div>
                    {isEditing ? (
                      <input
                        autoFocus
                        onFocus={(e) => e.target.select()}
                        value={el.content}
                        onChange={(e) => setElements(prev => prev.map(item => item.id === el.id ? { ...item, content: e.target.value } : item))}
                        onBlur={() => setEditingId(null)}
                        onKeyDown={(e) => { if (e.key === 'Enter') setEditingId(null); }}
                        style={{
                          font: 'inherit', color: 'inherit', background: 'transparent',
                          border: 'none', outline: 'none', padding: 0, margin: 0,
                          width: 'auto', textAlign: 'center'
                        }}
                      />
                    ) : (
                      el.content
                    )}
                  </div>
                );
              }
              return null;
            })}
          </div>

          {pdfDoc && (
            <div className="fixed bottom-8 bg-gray-800/90 backdrop-blur text-white px-2 py-2 rounded-full shadow-lg flex items-center gap-2 z-20 border border-gray-700">
              <button onClick={(e) => { e.stopPropagation(); setPageNum(p => Math.max(1, p - 1)) }} disabled={pageNum <= 1} className="p-2 hover:bg-gray-700 rounded-full disabled:opacity-50 text-xs px-3">{t('prev')}</button>
              <span className="text-sm font-mono mx-2">{pageNum} / {totalPages}</span>
              <button onClick={(e) => { e.stopPropagation(); setPageNum(p => Math.min(totalPages, p + 1)) }} disabled={pageNum >= totalPages} className="p-2 hover:bg-gray-700 rounded-full disabled:opacity-50 text-xs px-3">{t('next')}</button>
              <div className="w-px h-6 bg-gray-600 mx-2"></div>
              <button onClick={handleZoomOut} className="p-2 hover:bg-gray-700 rounded-full"><ZoomOut size={18} /></button>
              <span className="text-xs w-12 text-center">{Math.round(scale * 100)}%</span>
              <button onClick={handleZoomIn} className="p-2 hover:bg-gray-700 rounded-full"><ZoomIn size={18} /></button>
            </div>
          )}
        </section>
      </main>

      {/* MODAL FIRMA */}
      {isSigning && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex border-b">
              <button onClick={() => setActiveTab('draw')} className={`flex-1 p-3 text-sm font-medium ${activeTab === 'draw' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'bg-gray-50 text-gray-500'}`}>{t('drawTab')}</button>
              <button onClick={() => setActiveTab('upload')} className={`flex-1 p-3 text-sm font-medium ${activeTab === 'upload' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'bg-gray-50 text-gray-500'}`}>{t('uploadTab')}</button>
            </div>

            {activeTab === 'draw' ? (
              <>
                <div className="p-3 bg-gray-50 border-b flex justify-between items-center gap-4 flex-wrap text-gray-800">
                  <div className="flex gap-2">
                    <button onClick={() => setPenColor('#000080')} className={`w-6 h-6 rounded-full bg-blue-900 border-2 ${penColor === '#000080' ? 'border-blue-400 scale-110' : 'border-transparent'}`} title={t('blue')}></button>
                    <button onClick={() => setPenColor('#000000')} className={`w-6 h-6 rounded-full bg-black border-2 ${penColor === '#000000' ? 'border-gray-400 scale-110' : 'border-transparent'}`} title={t('black')}></button>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-600 flex-1 min-w-[150px]">
                    <span>{t('thickness')}:</span>
                    <input type="range" min="1" max="8" step="0.5" value={penSize} onChange={(e) => setPenSize(parseFloat(e.target.value))} className="h-2 bg-gray-300 rounded-lg flex-1" />
                  </div>
                </div>

                <div className="relative bg-white flex-1 min-h-[250px] touch-none"
                  onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                >
                  <canvas ref={signPadRef} width={500} height={300} className="cursor-crosshair w-full h-full block" />
                  <div className="absolute bottom-2 left-0 w-full text-center text-gray-300 text-xs pointer-events-none select-none">{t('signHere')}</div>
                </div>

                <div className="p-4 bg-gray-50 border-t flex justify-between items-center">
                  <button onClick={clearPad} className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1"><Eraser size={16} /> {t('clear')}</button>
                  <div className="flex gap-2">
                    <button onClick={saveToGallery} className="px-3 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg text-sm font-medium flex items-center gap-1 border border-purple-200">
                      <Save size={16} /> {t('save')}
                    </button>
                    <button onClick={() => setIsSigning(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm">{t('cancel')}</button>
                    <button onClick={() => addSignatureToDoc(signPadRef.current.toDataURL('image/png'))} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-1">
                      <Check size={16} /> {t('use')}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 flex flex-col items-center justify-center min-h-[300px] text-gray-500">
                <input type="file" accept="image/*" ref={sigImageInputRef} className="hidden" onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => addSignatureToDoc(ev.target.result);
                    reader.readAsDataURL(file);
                  }
                }} />
                <button onClick={() => sigImageInputRef.current.click()} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium">{t('selectImage')}</button>
                <button onClick={() => setIsSigning(false)} className="mt-4 text-gray-400 text-xs hover:text-gray-600">{t('cancel')}</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;