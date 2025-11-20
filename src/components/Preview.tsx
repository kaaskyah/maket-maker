import React, { useEffect, useRef, useState } from 'react';
import { Move, RefreshCcw, RotateCw } from 'lucide-react';
import { PageLayout, A4_SPECS } from '../types';

interface PreviewProps {
  pages: PageLayout[];
  onMoveImage: (pageIndex: number, imageId: string, position: { x: number; y: number; }) => void;
  onRotateImage: (pageIndex: number, imageId: string) => void;
  onResetLayout: () => void;
  isManualEditing: boolean;
  manualMessage?: string | null;
}

interface DragState {
  pageIndex: number;
  imageId: string;
  offsetX: number;
  offsetY: number;
}

export const Preview: React.FC<PreviewProps> = ({ pages, onMoveImage, onRotateImage, onResetLayout, isManualEditing, manualMessage }) => {
  const SCALE = 24;
  const pageStyle = { width: `${A4_SPECS.width * SCALE}px`, height: `${A4_SPECS.height * SCALE}px` };
  const marginStyle = { top: `${A4_SPECS.marginTop * SCALE}px`, left: `${A4_SPECS.marginLeft * SCALE}px`, width: `${A4_SPECS.printWidth * SCALE}px`, height: `${A4_SPECS.printHeight * SCALE}px` };

  const [dragging, setDragging] = useState<DragState | null>(null);
  const marginRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!dragging) return;
      const container = marginRefs.current[dragging.pageIndex];
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / SCALE - dragging.offsetX;
      const y = (e.clientY - rect.top) / SCALE - dragging.offsetY;
      onMoveImage(dragging.pageIndex, dragging.imageId, { x, y });
    };
    const stop = () => setDragging(null);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', stop);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', stop);
    };
  }, [dragging, onMoveImage]);

  const startDrag = (e: React.MouseEvent, pageIndex: number, imageId: string) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    setDragging({ pageIndex, imageId, offsetX: (e.clientX - rect.left) / SCALE, offsetY: (e.clientY - rect.top) / SCALE });
  };

  return (
    <div className="flex-1 bg-gray-100 overflow-auto p-8 flex flex-col items-center gap-6">
      <div className="w-full max-w-6xl flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Move className="w-4 h-4 text-blue-500" />
          <span>Перетаскивайте и поворачивайте картинки прямо в превью.</span>
          {isManualEditing && (
            <span className="ml-2 rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-semibold">Ручные правки</span>
          )}
          {manualMessage && (
            <span className="ml-2 text-blue-600 text-xs bg-white px-2 py-0.5 rounded border border-blue-100">{manualMessage}</span>
          )}
        </div>
        <button onClick={onResetLayout} className="inline-flex items-center gap-2 self-start sm:self-auto px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
          <RefreshCcw className="w-4 h-4" />
          Снова авто-компоновка
        </button>
      </div>

      {pages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <div className="w-24 h-32 border-2 border-dashed border-gray-300 rounded mb-4"></div>
          <p>Добавьте картинки, чтобы увидеть макет</p>
        </div>
      )}
      {pages.map((page, idx) => (
        <div key={idx} className="relative bg-white shadow-2xl flex-shrink-0" style={pageStyle}>
          <div className="absolute -top-6 left-0 text-xs font-bold text-gray-400 uppercase tracking-wider">Страница {idx + 1}</div>
          <div className="absolute border border-dashed border-blue-200 pointer-events-none" style={marginStyle} />
          <div className="absolute" style={marginStyle} ref={(el) => (marginRefs.current[page.pageIndex] = el)}>
            {page.images.map((img) => {
              const width = (img.displayWidth || img.widthCm) * SCALE;
              const height = (img.displayHeight || img.heightCm) * SCALE;
              const isDragging = dragging?.imageId === img.id;
              return (
                <div
                  key={img.id}
                  className={`absolute overflow-hidden border bg-gray-50 group transition-all hover:border-blue-500 hover:z-10 flex items-center justify-center cursor-grab ${isDragging ? 'border-blue-400 shadow-lg' : 'border-gray-300'}`}
                  style={{ left: `${img.x * SCALE}px`, top: `${img.y * SCALE}px`, width: `${width}px`, height: `${height}px` }}
                  onMouseDown={(e) => startDrag(e, page.pageIndex, img.id)}
                >
                  <img
                    src={img.url}
                    alt=""
                    className="transition-all opacity-90 group-hover:opacity-100"
                    style={{ width: `${img.widthCm * SCALE}px`, height: `${img.heightCm * SCALE}px`, transform: img.rotated ? 'rotate(90deg)' : 'none', maxWidth: 'none', maxHeight: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onRotateImage(page.pageIndex, img.id); }}
                    className="absolute right-1 top-1 w-7 h-7 rounded-full bg-white/90 border border-gray-200 shadow-sm text-gray-600 hover:text-blue-600 hover:border-blue-300 transition"
                    title="Повернуть на 90°"
                  >
                    <RotateCw className="w-3.5 h-3.5 mx-auto" />
                  </button>
                  <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 bg-black/45 transition-opacity pointer-events-none z-20">
                    <span className="text-white text-[10px] font-medium">{img.widthCm}x{img.heightCm}</span>
                    {img.rotated && (<span className="text-white text-[9px] opacity-80">(Повернуто)</span>)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
