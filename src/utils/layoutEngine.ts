import { ImageItem, PositionedImage, PageLayout, A4_SPECS } from '../types';

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

type SortStrategy = 'AREA_DESC' | 'MAX_SIDE_DESC' | 'WIDTH_DESC' | 'HEIGHT_DESC';
type Heuristic = 'TOP_LEFT' | 'TOP_RIGHT' | 'BEST_SHORT_SIDE_FIT' | 'BEST_AREA_FIT';

interface Strategy {
  sort: SortStrategy;
  heuristic: Heuristic;
}

const getSortedImages = (images: ImageItem[], strategy: SortStrategy): ImageItem[] => {
  return [...images].sort((a, b) => {
    const areaA = a.widthCm * a.heightCm;
    const areaB = b.widthCm * b.heightCm;
    const maxSideA = Math.max(a.widthCm, a.heightCm);
    const maxSideB = Math.max(b.widthCm, b.heightCm);

    switch (strategy) {
      case 'AREA_DESC': return areaB - areaA;
      case 'MAX_SIDE_DESC':
        if (Math.abs(maxSideA - maxSideB) > 0.01) return maxSideB - maxSideA;
        return areaB - areaA;
      case 'WIDTH_DESC': return b.widthCm - a.widthCm;
      case 'HEIGHT_DESC': return b.heightCm - a.heightCm;
      default: return 0;
    }
  });
};

const findBestPosition = (
  freeRects: Rect[], 
  img: ImageItem, 
  heuristic: Heuristic
): { rect: Rect, rotated: boolean } | null => {
  
  let bestRect: Rect | null = null;
  let bestRotated = false;
  let bestScore1 = Infinity;
  let bestScore2 = Infinity;

  for (const free of freeRects) {
    if (free.width >= img.widthCm && free.height >= img.heightCm) {
      const score1 = calculateScore1(free, img.widthCm, img.heightCm, heuristic);
      const score2 = calculateScore2(free, img.widthCm, img.heightCm, heuristic);
      if (score1 < bestScore1 || (score1 === bestScore1 && score2 < bestScore2)) {
        bestScore1 = score1; bestScore2 = score2;
        bestRect = { x: free.x, y: free.y, width: img.widthCm, height: img.heightCm };
        bestRotated = false;
      }
    }
    if (free.width >= img.heightCm && free.height >= img.widthCm) {
      const score1 = calculateScore1(free, img.heightCm, img.widthCm, heuristic);
      const score2 = calculateScore2(free, img.heightCm, img.widthCm, heuristic);
      if (score1 < bestScore1 || (score1 === bestScore1 && score2 < bestScore2)) {
        bestScore1 = score1; bestScore2 = score2;
        bestRect = { x: free.x, y: free.y, width: img.heightCm, height: img.widthCm };
        bestRotated = true;
      }
    }
  }
  return bestRect ? { rect: bestRect, rotated: bestRotated } : null;
};

const calculateScore1 = (free: Rect, w: number, h: number, heuristic: Heuristic): number => {
  switch (heuristic) {
    case 'TOP_LEFT': case 'TOP_RIGHT': return free.y;
    case 'BEST_SHORT_SIDE_FIT':
      const leftoverHoriz = Math.abs(free.width - w);
      const leftoverVert = Math.abs(free.height - h);
      return Math.min(leftoverHoriz, leftoverVert);
    case 'BEST_AREA_FIT': return (free.width * free.height) - (w * h);
    default: return free.y;
  }
};

const calculateScore2 = (free: Rect, w: number, h: number, heuristic: Heuristic): number => {
  switch (heuristic) {
    case 'TOP_LEFT': return free.x;
    case 'TOP_RIGHT': return -free.x;
    default: return free.x;
  }
};

const generateLayout = (images: ImageItem[], strategy: Strategy): PageLayout[] => {
  const sortedImages = getSortedImages(images, strategy.sort);
  const pages: PageLayout[] = [];
  let currentPageIndex = 0;
  let freeRects: Rect[] = [{ x: 0, y: 0, width: A4_SPECS.printWidth, height: A4_SPECS.printHeight }];
  let currentPageImages: PositionedImage[] = [];

  const startNewPage = () => {
    if (currentPageImages.length > 0) pages.push({ pageIndex: currentPageIndex, images: [...currentPageImages] });
    currentPageIndex++;
    currentPageImages = [];
    freeRects = [{ x: 0, y: 0, width: A4_SPECS.printWidth, height: A4_SPECS.printHeight }];
  };

  for (let i = 0; i < sortedImages.length; i++) {
    const img = sortedImages[i];
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 2) {
      attempts++;
      const result = findBestPosition(freeRects, img, strategy.heuristic);

      if (result) {
        const { rect: bestNode, rotated } = result;
        currentPageImages.push({
          ...img, x: bestNode.x, y: bestNode.y, pageIndex: currentPageIndex, rotated: rotated,
          displayWidth: bestNode.width, displayHeight: bestNode.height
        });
        placed = true;

        const usedRect = bestNode;
        const newFreeRects: Rect[] = [];
        for (const free of freeRects) {
          if (usedRect.x < free.x + free.width && usedRect.x + usedRect.width > free.x &&
              usedRect.y < free.y + free.height && usedRect.y + usedRect.height > free.y) {
            if (usedRect.y > free.y && usedRect.y < free.y + free.height)
              newFreeRects.push({ x: free.x, y: free.y, width: free.width, height: usedRect.y - free.y });
            if (usedRect.y + usedRect.height < free.y + free.height)
              newFreeRects.push({ x: free.x, y: usedRect.y + usedRect.height, width: free.width, height: (free.y + free.height) - (usedRect.y + usedRect.height) });
            if (usedRect.x > free.x && usedRect.x < free.x + free.width)
              newFreeRects.push({ x: free.x, y: free.y, width: usedRect.x - free.x, height: free.height });
            if (usedRect.x + usedRect.width < free.x + free.width)
              newFreeRects.push({ x: usedRect.x + usedRect.width, y: free.y, width: (free.x + free.width) - (usedRect.x + usedRect.width), height: free.height });
          } else {
            newFreeRects.push(free);
          }
        }
        freeRects = newFreeRects.filter((r, idx) => {
          for (let j = 0; j < newFreeRects.length; j++) {
            if (idx === j) continue;
            const other = newFreeRects[j];
            if (r.x >= other.x && r.y >= other.y && r.x + r.width <= other.x + other.width && r.y + r.height <= other.y + other.height) return false;
          }
          return r.width >= 0.1 && r.height >= 0.1;
        });
      } else {
        if (freeRects.length === 1 && freeRects[0].x === 0 && freeRects[0].y === 0) {
           let w = img.widthCm, h = img.heightCm, rot = false;
           if (w > A4_SPECS.printWidth && h <= A4_SPECS.printWidth) { w = img.heightCm; h = img.widthCm; rot = true; }
           currentPageImages.push({ ...img, x: 0, y: 0, pageIndex: currentPageIndex, rotated: rot, displayWidth: w, displayHeight: h });
           placed = true;
           startNewPage();
        } else {
           startNewPage();
        }
      }
    }
  }
  if (currentPageImages.length > 0) pages.push({ pageIndex: currentPageIndex, images: currentPageImages });
  return pages;
};

export const calculateLayout = (images: ImageItem[]): PageLayout[] => {
  if (images.length === 0) return [];
  const strategies: Strategy[] = [
    { sort: 'MAX_SIDE_DESC', heuristic: 'TOP_LEFT' },
    { sort: 'MAX_SIDE_DESC', heuristic: 'TOP_RIGHT' }, 
    { sort: 'MAX_SIDE_DESC', heuristic: 'BEST_SHORT_SIDE_FIT' },
    { sort: 'AREA_DESC', heuristic: 'TOP_LEFT' },
    { sort: 'AREA_DESC', heuristic: 'TOP_RIGHT' },
    { sort: 'AREA_DESC', heuristic: 'BEST_SHORT_SIDE_FIT' },
    { sort: 'HEIGHT_DESC', heuristic: 'TOP_LEFT' },
    { sort: 'HEIGHT_DESC', heuristic: 'TOP_RIGHT' },
    { sort: 'WIDTH_DESC', heuristic: 'TOP_LEFT' },
    { sort: 'WIDTH_DESC', heuristic: 'TOP_RIGHT' },
  ];
  let bestLayout: PageLayout[] | null = null;
  let bestScore = Infinity;
  for (const strategy of strategies) {
    const layout = generateLayout(images, strategy);
    const score = calculateLayoutScore(layout);
    if (score < bestScore) { bestScore = score; bestLayout = layout; }
  }
  return bestLayout || [];
};

const calculateLayoutScore = (pages: PageLayout[]): number => {
  if (pages.length === 0) return 0;
  const pageScore = pages.length * 10000;
  let totalHeightUsed = 0;
  pages.forEach(page => {
    let maxY = 0;
    page.images.forEach(img => {
      const bottomEdge = img.y + (img.displayHeight || img.heightCm);
      if (bottomEdge > maxY) maxY = bottomEdge;
    });
    totalHeightUsed += maxY;
  });
  return pageScore + totalHeightUsed;
};