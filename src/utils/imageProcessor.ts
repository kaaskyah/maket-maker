import { ImageItem } from '../types';

export const processImageBackground = async (imgItem: ImageItem, tolerance = 20): Promise<{ file: File, url: string, widthCm: number, heightCm: number, aspectRatio: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error("Could not get canvas context")); return; }
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        if (r > 255 - tolerance && g > 255 - tolerance && b > 255 - tolerance) {
          data[i + 3] = 0;
        }
      }
      ctx.putImageData(imgData, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const newFile = new File([blob], `processed_${imgItem.file.name.replace(/\.[^/.]+$/, "")}.png`, { type: 'image/png' });
          const newUrl = URL.createObjectURL(newFile);
          resolve({
            file: newFile, url: newUrl,
            widthCm: imgItem.widthCm, heightCm: imgItem.heightCm, aspectRatio: imgItem.aspectRatio
          });
        } else reject(new Error("Canvas to blob failed"));
      }, 'image/png');
    };
    img.onerror = reject;
    img.src = imgItem.url;
  });
};