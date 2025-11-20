import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Preview } from './components/Preview';
import { A4_SPECS, ImageItem, PageLayout, PositionedImage } from './types';
import { calculateLayout } from './utils/layoutEngine';
import { generateDocx } from './services/docxService';
import { clampToBounds, hasOverlap, resolveDisplaySize } from './utils/manualGuards';

const App: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [pages, setPages] = useState<PageLayout[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isManualEditing, setIsManualEditing] = useState(false);
  const [manualMessage, setManualMessage] = useState<string | null>(null);

  useEffect(() => {
    setPages(calculateLayout(images));
    setIsManualEditing(false);
    setManualMessage(null);
  }, [images]);

  const handleAddImages = (newImages: ImageItem[]) => {
    setImages(prev => [...prev, ...newImages]);
  };

  const handleRemoveImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const handleUpdateImage = (id: string, updates: Partial<ImageItem>) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, ...updates } : img));
  };

  const showManualHint = (text: string) => {
    setManualMessage(text);
    setTimeout(() => setManualMessage(null), 2000);
  };

  const updatePositionedImage = (
    pageIndex: number,
    imageId: string,
    updater: (img: PositionedImage) => PositionedImage
  ) => {
    let updated = false;
    setPages(prev => prev.map(page => {
      if (page.pageIndex !== pageIndex) return page;
      const targetIndex = page.images.findIndex(img => img.id === imageId);
      if (targetIndex === -1) return page;

      const current = page.images[targetIndex];
      const next = updater(current);
      const { width, height } = resolveDisplaySize(next);

      if (width > A4_SPECS.printWidth || height > A4_SPECS.printHeight) {
        showManualHint('Картинка слишком большая для печатной области.');
        return page;
      }

      const clamped = clampToBounds(next, width, height);
      if (hasOverlap(clamped, width, height, page.images.filter((_, idx) => idx !== targetIndex))) {
        showManualHint('Картинки не должны пересекаться.');
        return page;
      }

      updated = true;
      const updatedImages = [...page.images];
      updatedImages[targetIndex] = clamped;
      return { ...page, images: updatedImages };
    }));
    if (updated) setIsManualEditing(true);
  };

  const handleMoveImage = (pageIndex: number, imageId: string, position: { x: number; y: number; }) => {
    updatePositionedImage(pageIndex, imageId, (img) => ({ ...img, ...position }));
  };

  const handleRotateImage = (pageIndex: number, imageId: string) => {
    updatePositionedImage(pageIndex, imageId, (img) => {
      const rotated = !img.rotated;
      const newWidth = rotated ? img.heightCm : img.widthCm;
      const newHeight = rotated ? img.widthCm : img.heightCm;
      return {
        ...img,
        rotated,
        displayWidth: newWidth,
        displayHeight: newHeight,
      };
    });
  };

  const handleResetLayout = () => {
    setPages(calculateLayout(images));
    setIsManualEditing(false);
    setManualMessage(null);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generateDocx(pages);
    } catch (e) {
      console.error("Failed to generate docx", e);
      alert("Ошибка при создании файла. Проверьте консоль.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClear = () => {
    setImages([]);
  };

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
      <Sidebar
        images={images}
        onAddImages={handleAddImages}
        onRemoveImage={handleRemoveImage}
        onUpdateImage={handleUpdateImage}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        onClear={handleClear}
      />
      <Preview
        pages={pages}
        onMoveImage={handleMoveImage}
        onRotateImage={handleRotateImage}
        onResetLayout={handleResetLayout}
        isManualEditing={isManualEditing}
        manualMessage={manualMessage}
      />
    </div>
  );
};

export default App;
