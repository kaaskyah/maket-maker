import { A4_SPECS, PositionedImage } from '../types';

export const resolveDisplaySize = (img: PositionedImage) => {
  return {
    width: img.displayWidth ?? img.widthCm,
    height: img.displayHeight ?? img.heightCm,
  };
};

export const clampToBounds = (img: PositionedImage, width: number, height: number): PositionedImage => {
  const maxX = Math.max(0, A4_SPECS.printWidth - width);
  const maxY = Math.max(0, A4_SPECS.printHeight - height);
  return {
    ...img,
    x: Math.min(Math.max(img.x, 0), maxX),
    y: Math.min(Math.max(img.y, 0), maxY),
  };
};

export const hasOverlap = (
  candidate: PositionedImage,
  width: number,
  height: number,
  others: PositionedImage[],
): boolean => {
  return others.some(other => {
    const otherSize = resolveDisplaySize(other);
    return (
      candidate.x < other.x + otherSize.width &&
      candidate.x + width > other.x &&
      candidate.y < other.y + otherSize.height &&
      candidate.y + height > other.y
    );
  });
};
