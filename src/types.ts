export interface ImageItem {
  id: string;
  file: File;
  url: string;
  widthCm: number;
  heightCm: number;
  aspectRatio: number; // width / height
}

export interface PositionedImage extends ImageItem {
  x: number; // cm relative to margin-left
  y: number; // cm relative to margin-top
  pageIndex: number;
  rotated: boolean; // If true, the image is rotated 90 degrees on the page
  displayX?: number; // Visual X for preview
  displayY?: number; // Visual Y for preview
  displayWidth?: number; // Visual Width for preview
  displayHeight?: number; // Visual Height for preview
}

export interface PageLayout {
  pageIndex: number;
  images: PositionedImage[];
}

export const A4_SPECS = {
  width: 21.0, // cm
  height: 29.7, // cm
  marginTop: 1.5,
  marginBottom: 1.0,
  marginLeft: 0.5,
  marginRight: 0.5,
  get printWidth() {
    return this.width - this.marginLeft - this.marginRight;
  },
  get printHeight() {
    return this.height - this.marginTop - this.marginBottom;
  }
};