import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { Quotation } from './types';

export async function generateQuotationPDF(
  element: HTMLElement,
  quotation: Quotation,
): Promise<jsPDF> {
  void quotation;

  const canvas = await html2canvas(element, {
    scale: 3,
    useCORS: true,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.9);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const pageHeight = 297;
  // Small tolerance so that sub-pixel rendering differences from html2canvas
  // (borders, line-height rounding, font metrics) don't tip a genuinely
  // one-page document into the multi-page branch below.
  const singlePageTolerance = 4;
  const pageMarginTop = 0;
  const pageMarginBottom = 0;
  const usablePageHeight = pageHeight - pageMarginTop - pageMarginBottom;
  const imgHeight = (canvas.height / canvas.width) * pageWidth;

  if (imgHeight <= pageHeight + singlePageTolerance) {
    doc.addImage(imgData, 'JPEG', 0, 0, pageWidth, Math.min(imgHeight, pageHeight));
    return doc;
  }

  const pageHeightPx = (canvas.width * usablePageHeight) / pageWidth;
  const elementRect = element.getBoundingClientRect();
  const scaleY = canvas.height / elementRect.height;
  const keepTogetherSelectors = element.querySelectorAll<HTMLElement>(
    '[data-pdf-keep-together="true"]',
  );
  // Treat the bottom-right accent decoration as part of the last
  // keep-together block too, so a page break can never cut through it.
  const lastKeepTogetherEl = keepTogetherSelectors[keepTogetherSelectors.length - 1];
  const bottomAccentEl = lastKeepTogetherEl
    ? (lastKeepTogetherEl.parentElement?.parentElement?.querySelector<HTMLElement>(
        ':scope > div:last-child',
      ) ?? null)
    : null;

  const keepTogetherRanges = Array.from(keepTogetherSelectors).map((keepElement) => {
    const rect = keepElement.getBoundingClientRect();
    let bottom = rect.bottom;
    if (keepElement === lastKeepTogetherEl && bottomAccentEl) {
      const accentRect = bottomAccentEl.getBoundingClientRect();
      bottom = Math.max(bottom, accentRect.bottom);
    }
    return {
      start: Math.max(0, (rect.top - elementRect.top) * scaleY),
      end: Math.min(canvas.height, (bottom - elementRect.top) * scaleY),
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

    const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.9);
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
