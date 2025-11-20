import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Preview } from './components/Preview';
import { ImageItem, PageLayout } from './types';
import { calculateLayout } from './utils/layoutEngine';
import { generateDocx } from './services/docxService';

const App: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const pages: PageLayout[] = useMemo(() => {
    return calculateLayout(images);
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
      <Preview pages={pages} />
    </div>
  );
};

export default App;