import { Document, Packer, Paragraph, TextWrappingType, ImageRun, HorizontalPositionRelativeFrom, VerticalPositionRelativeFrom, PageOrientation } from "docx";
import FileSaver from "file-saver";
import { PageLayout, A4_SPECS, PositionedImage } from "../types";

const getRotatedImageData = (img: PositionedImage): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "Anonymous";
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.height; canvas.height = image.width;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error("No context")); return; }
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(90 * Math.PI / 180);
      ctx.drawImage(image, -image.width / 2, -image.height / 2);
      canvas.toBlob((blob) => { if (blob) blob.arrayBuffer().then(resolve); else reject(new Error("Blob failed")); }, img.file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.95);
    };
    image.onerror = reject; image.src = img.url;
  });
};

export const generateDocx = async (layout: PageLayout[]) => {
  const doc = new Document({
    sections: await Promise.all(layout.map(async (page) => {
      const runs = await Promise.all(page.images.map(async (img) => {
        let buffer: ArrayBuffer;
        let width = img.widthCm;
        let height = img.heightCm;
        if (img.rotated) {
          try {
             buffer = await getRotatedImageData(img);
             width = img.displayWidth!; height = img.displayHeight!;
          } catch (e) {
             console.error("Rotation failed", e); buffer = await img.file.arrayBuffer();
          }
        } else {
          buffer = await img.file.arrayBuffer();
          width = img.displayWidth || img.widthCm; height = img.displayHeight || img.heightCm;
        }
        let type: "png" | "jpg" | "gif" | "bmp" = "jpg";
        const mime = img.file.type.toLowerCase();
        if (mime.includes("png")) type = "png";
        else if (mime.includes("gif")) type = "gif";
        else if (mime.includes("bmp")) type = "bmp";
        const imageOptions: any = {
          data: buffer,
          transformation: { width: width * 37.795275591, height: height * 37.795275591 },
          floating: {
            horizontalPosition: { offset: Math.round(img.x * 360000), relative: HorizontalPositionRelativeFrom.MARGIN },
            verticalPosition: { offset: Math.round(img.y * 360000), relative: VerticalPositionRelativeFrom.MARGIN },
            wrap: { type: TextWrappingType.NONE }
          }
        };
        imageOptions.type = type; // Указываем тип картинки, свойство отсутствует в типах ImageRun
        return new ImageRun(imageOptions);
      }));
      return {
        properties: {
          page: {
            margin: {
              top: A4_SPECS.marginTop * 1440 / 2.54,
              bottom: A4_SPECS.marginBottom * 1440 / 2.54,
              left: A4_SPECS.marginLeft * 1440 / 2.54,
              right: A4_SPECS.marginRight * 1440 / 2.54,
            },
            size: { width: A4_SPECS.width * 1440 / 2.54, height: A4_SPECS.height * 1440 / 2.54, orientation: PageOrientation.PORTRAIT }
          },
        },
        children: [new Paragraph({ children: runs })],
      };
    }))
  });
  const blob = await Packer.toBlob(doc);
  FileSaver.saveAs(blob, "layout.docx");
};
