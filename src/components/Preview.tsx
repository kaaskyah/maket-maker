import React from 'react';
import { PageLayout, A4_SPECS } from '../types';

interface PreviewProps { pages: PageLayout[]; }

export const Preview: React.FC<PreviewProps> = ({ pages }) => {
  const SCALE = 24; 
  const pageStyle = { width: `${A4_SPECS.width * SCALE}px`, height: `${A4_SPECS.height * SCALE}px` };
  const marginStyle = { top: `${A4_SPECS.marginTop * SCALE}px`, left: `${A4_SPECS.marginLeft * SCALE}px`, width: `${A4_SPECS.printWidth * SCALE}px`, height: `${A4_SPECS.printHeight * SCALE}px` };

  return (
    <div className="flex-1 bg-gray-100 overflow-auto p-8 flex flex-col items-center gap-8">
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
          <div className="absolute" style={marginStyle}>
            {page.images.map((img) => (
              <div key={img.id} className="absolute overflow-hidden border border-gray-300 bg-gray-50 group transition-all hover:border-blue-500 hover:z-10 flex items-center justify-center"
                style={{ left: `${img.x * SCALE}px`, top: `${img.y * SCALE}px`, width: `${(img.displayWidth || img.widthCm) * SCALE}px`, height: `${(img.displayHeight || img.heightCm) * SCALE}px` }}>
                <img src={img.url} alt="" className="transition-all opacity-90 group-hover:opacity-100"
                  style={{ width: `${img.widthCm * SCALE}px`, height: `${img.heightCm * SCALE}px`, transform: img.rotated ? 'rotate(90deg)' : 'none', maxWidth: 'none', maxHeight: 'none' }} />
                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 transition-opacity pointer-events-none z-20">
                  <span className="text-white text-[10px] font-medium">{img.widthCm}x{img.heightCm}</span>
                   {img.rotated && (<span className="text-white text-[9px] opacity-80">(Повернуто)</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};