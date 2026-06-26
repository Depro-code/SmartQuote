import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { Quotation } from './types';

export async function generateQuotationPDF(
  element: HTMLElement,
  quotation: Quotation,
): Promise<jsPDF> {
  void quotation;

  const canvas = await html2canvas(element, {
    scale: 1.5,
    useCORS: true,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.85);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const pageHeight = 297;
  const pageMarginTop = 10;
  const pageMarginBottom = 10;
  const usablePageHeight = pageHeight - pageMarginTop - pageMarginBottom;
  const imgHeight = (canvas.height / canvas.width) * pageWidth;

  if (imgHeight <= pageHeight) {
    doc.addImage(imgData, 'JPEG', 0, 0, pageWidth, imgHeight);
    return doc;
  }

  const pageHeightPx = (canvas.width * usablePageHeight) / pageWidth;
  const elementRect = element.getBoundingClientRect();
  const scaleY = canvas.height / elementRect.height;
  const keepTogetherRanges = Array.from(
    element.querySelectorAll<HTMLElement>('[data-pdf-keep-together="true"]'),
  ).map((keepElement) => {
    const rect = keepElement.getBoundingClientRect();
    return {
      start: Math.max(0, (rect.top - elementRect.top) * scaleY),
      end: Math.min(canvas.height, (rect.bottom - elementRect.top) * scaleY),
    };
  });

  let sourceY = 0;
  let pageIndex = 0;

  while (sourceY < canvas.height) {
    if (pageIndex > 0) {
      doc.addPage();
    }

    let nextSourceY = Math.min(sourceY + pageHeightPx, canvas.height);
    if (nextSourceY < canvas.height) {
      const intersectingKeepBlock = keepTogetherRanges.find(
        (range) => nextSourceY > range.start && nextSourceY < range.end && range.start > sourceY,
      );

      if (intersectingKeepBlock) {
        nextSourceY = intersectingKeepBlock.start;
      }
    }

    if (nextSourceY <= sourceY) {
      nextSourceY = Math.min(sourceY + pageHeightPx, canvas.height);
    }

    const sliceHeight = Math.ceil(nextSourceY - sourceY);
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceHeight;
    const context = pageCanvas.getContext('2d');

    if (!context) {
      throw new Error('Unable to prepare PDF page image');
    }

    context.drawImage(
      canvas,
      0,
      Math.floor(sourceY),
      canvas.width,
      sliceHeight,
      0,
      0,
      canvas.width,
      sliceHeight,
    );

    const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.85);
    const pageImgHeight = (sliceHeight / canvas.width) * pageWidth;
    doc.addImage(pageImgData, 'JPEG', 0, pageMarginTop, pageWidth, pageImgHeight);

    sourceY = nextSourceY;
    pageIndex += 1;
  }

  return doc;
}

export function quotationPdfFilename(quotation: Quotation): string {
  return `${quotation.quoteNumber}.pdf`;
}
