import React, { useRef, useState, useEffect } from 'react';
import { Upload, X, FileImage, Trash2, Download, Wand2, Loader2, CheckCircle2 } from 'lucide-react';
import { ImageItem, A4_SPECS } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { processImageBackground } from '../utils/imageProcessor';

interface SidebarProps {
  images: ImageItem[];
  onAddImages: (newImages: ImageItem[]) => void;
  onRemoveImage: (id: string) => void;
  onUpdateImage: (id: string, updates: Partial<ImageItem>) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  onClear: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ images, onAddImages, onRemoveImage, onUpdateImage, onGenerate, isGenerating, onClear }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => { if (confirmClear) { const timer = setTimeout(() => setConfirmClear(false), 3000); return () => clearTimeout(timer); } }, [confirmClear]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(Array.from(e.target.files));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFiles = (files: File[]) => {
    const newImages: Promise<ImageItem>[] = files.filter(f => f.type.startsWith('image/')).map(file => {
        return new Promise((resolve) => {
          const img = new Image();
          const url = URL.createObjectURL(file);
          img.onload = () => {
            const aspect = img.width / img.height;
            let w = 8, h = w / aspect;
            if (w > A4_SPECS.printWidth) { w = A4_SPECS.printWidth; h = w / aspect; }
            resolve({ id: uuidv4(), file, url, widthCm: parseFloat(w.toFixed(1)), heightCm: parseFloat(h.toFixed(1)), aspectRatio: aspect });
          };
          img.src = url;
        });
      });
    Promise.all(newImages).then(items => onAddImages(items));
  };

  const handleRemoveBg = async (item: ImageItem) => {
    if (processingId) return;
    setProcessingId(item.id);
    try {
      const result = await processImageBackground(item);
      onUpdateImage(item.id, { file: result.file, url: result.url, widthCm: result.widthCm, heightCm: result.heightCm, aspectRatio: result.aspectRatio });
    } catch (error) { console.error("BG Removal failed", error); alert("Не удалось удалить фон"); } finally { setProcessingId(null); }
  };

  const handleClearClick = () => {
    if (confirmClear) { onClear(); setConfirmClear(false); } else { setConfirmClear(true); }
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full shadow-xl z-10">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2"><FileImage className="w-5 h-5 text-blue-600" />Docx Layout</h1>
        <p className="text-xs text-gray-500 mt-1">Разместите картинки компактно</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-blue-200 bg-blue-50 rounded-lg p-6 text-center cursor-pointer hover:bg-blue-100 transition-colors group">
          <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
          <div className="flex justify-center mb-2"><Upload className="w-8 h-8 text-blue-400 group-hover:text-blue-600" /></div>
          <p className="text-sm font-medium text-blue-600">Добавить картинки</p>
          <p className="text-xs text-blue-400 mt-1">или перетащите сюда</p>
        </div>
        <div className="space-y-3">
          {images.map((img, idx) => (
            <div key={img.id} className="bg-white border border-gray-200 rounded-md p-3 shadow-sm flex gap-3 group hover:border-blue-300 transition-all">
              <div className="relative w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0 border border-gray-100">
                <img src={img.url} alt="thumb" className="w-full h-full object-contain" />
                {processingId === img.id && (<div className="absolute inset-0 bg-white/80 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-blue-600" /></div>)}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <p className="text-xs font-medium text-gray-700 truncate w-20" title={img.file.name}>{img.file.name}</p>
                  <div className="flex gap-1">
                    <button onClick={() => handleRemoveBg(img)} title="Сделать фон прозрачным (без обрезки)" className="text-gray-300 hover:text-purple-600 transition-colors p-0.5" disabled={!!processingId}><Wand2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => onRemoveImage(img.id)} className="text-gray-300 hover:text-red-500 transition-colors p-0.5"><X className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] text-gray-400 uppercase">Ширина</label>
                    <input type="number" step="0.1" min="0.1" max={A4_SPECS.printWidth} value={img.widthCm} onChange={(e) => { const w = parseFloat(e.target.value) || 0; onUpdateImage(img.id, { widthCm: w, heightCm: parseFloat((w / img.aspectRatio).toFixed(2)) }); }} className="w-full text-xs bg-white text-gray-900 border border-gray-200 rounded px-1 py-0.5 focus:border-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[9px] text-gray-400 uppercase">Высота</label>
                    <input type="number" step="0.1" value={img.heightCm} onChange={(e) => { const h = parseFloat(e.target.value) || 0; onUpdateImage(img.id, { heightCm: h, widthCm: parseFloat((h * img.aspectRatio).toFixed(2)) }); }} className="w-full text-xs bg-white text-gray-900 border border-gray-200 rounded px-1 py-0.5 focus:border-blue-500 focus:outline-none" />
                  </div>
                </div>
              </div>
            </div>
          ))}
          {images.length === 0 && (<div className="text-center text-gray-400 text-sm py-4">Нет картинок</div>)}
        </div>
      </div>
      <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-2">
        <button onClick={onGenerate} disabled={images.length === 0 || isGenerating} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
          {isGenerating ? (<span className="animate-pulse flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Создание...</span>) : (<><Download className="w-4 h-4" />Скачать .docx</>)}
        </button>
        {images.length > 0 && (
          <button onClick={handleClearClick} className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition-colors ${confirmClear ? 'bg-red-600 text-white hover:bg-red-700' : 'text-gray-500 hover:text-red-600 hover:bg-red-50'}`}>
            {confirmClear ? (<><CheckCircle2 className="w-3 h-3" />Подтвердить удаление?</>) : (<><Trash2 className="w-3 h-3" />Очистить все</>)}
          </button>
        )}
      </div>
    </div>
  );
};