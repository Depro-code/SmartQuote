import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Quotation, Settings } from '../lib/types';

export function generateQuotationPDF(quotation: Quotation, settings: Settings): string {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  doc.setDrawColor(40, 40, 40);
  doc.setLineWidth(0.35);
  doc.rect(margin, margin, contentWidth, pageHeight - margin * 2);

  let yPos = margin + 6;

  if (settings.logoUrl) {
    try {
      doc.addImage(settings.logoUrl, 'JPEG', margin + 3, yPos - 2, 22, 18);
    } catch {
      // Ignore invalid logo format and continue rendering the invoice.
    }
  }

  const headerTextX = settings.logoUrl ? margin + 28 : margin + 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text((settings.companyName || '').toUpperCase(), headerTextX, yPos + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const headerLines = [
    settings.headerLine1,
    settings.headerLine2,
    settings.headerLine3,
    settings.address,
    [settings.phone, settings.email].filter(Boolean).join(' | '),
    settings.website,
    settings.registrationNumber,
    settings.taxId,
  ].filter((line): line is string => Boolean(line && line.trim()));

  let lineY = yPos + 9;
  headerLines.forEach((line) => {
    doc.text(line, headerTextX, lineY);
    lineY += 4;
  });

  const infoBoxWidth = 64;
  const infoBoxX = pageWidth - margin - infoBoxWidth;
  const infoBoxY = margin + 4;
  const infoBoxHeight = 30;
  doc.rect(infoBoxX, infoBoxY, infoBoxWidth, infoBoxHeight);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(settings.invoiceTitle || 'PROFORMA INVOICE', infoBoxX + infoBoxWidth / 2, infoBoxY + 7, {
    align: 'center',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`No: ${quotation.quoteNumber}`, infoBoxX + 4, infoBoxY + 14);
  doc.text(`Date: ${formatDate(quotation.issueDate)}`, infoBoxX + 4, infoBoxY + 19);
  if (quotation.validUntil) {
    doc.text(`Validity: ${formatDate(quotation.validUntil)}`, infoBoxX + 4, infoBoxY + 24);
  }
  doc.text(`Status: ${quotation.status}`, infoBoxX + 4, infoBoxY + 29);

  yPos = Math.max(lineY + 4, infoBoxY + infoBoxHeight + 6);

  const billToBoxY = yPos;
  const billToBoxHeight = 26;
  const leftBoxWidth = (contentWidth - 2) / 2;
  const rightBoxX = margin + leftBoxWidth + 2;
  doc.rect(margin, billToBoxY, leftBoxWidth, billToBoxHeight);
  doc.rect(rightBoxX, billToBoxY, leftBoxWidth, billToBoxHeight);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Bill To', margin + 3, billToBoxY + 5);
  doc.text('From', rightBoxX + 3, billToBoxY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const customerLines = [quotation.customerName, quotation.customerPhone, quotation.customerEmail].filter(
    (line): line is string => Boolean(line && line.trim()),
  );
  const sellerLines = [settings.companyName, settings.address, settings.phone, settings.email].filter(
    (line): line is string => Boolean(line && line.trim()),
  );

  customerLines.forEach((line, idx) => {
    doc.text(line, margin + 3, billToBoxY + 10 + idx * 4);
  });
  sellerLines.forEach((line, idx) => {
    doc.text(line, rightBoxX + 3, billToBoxY + 10 + idx * 4);
  });

  yPos = billToBoxY + billToBoxHeight + 4;

  const tableData = quotation.items.map((item, index) => [
    String(index + 1),
    item.nameSnapshot,
    item.unitSnapshot || '-',
    item.quantity.toString(),
    formatCurrency(item.unitPriceSnapshot, settings.currency),
    formatCurrency(item.lineTotal, settings.currency),
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['S/N', 'Description', 'Unit', 'Qty', 'Unit Price', 'Amount']],
    body: tableData,
    theme: 'grid',
    margin: { left: margin, right: margin },
    styles: {
      font: 'helvetica',
      fontSize: 9,
      textColor: [25, 25, 25],
      lineColor: [55, 55, 55],
      lineWidth: 0.25,
      cellPadding: { top: 2.5, right: 1.8, bottom: 2.5, left: 1.8 },
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      lineColor: [55, 55, 55],
      lineWidth: 0.25,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 74 },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 31, halign: 'right' },
    },
  });

  yPos = (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? yPos;
  yPos += 2;

  const totalsBoxWidth = 78;
  const totalsLabelX = pageWidth - margin - totalsBoxWidth + 3;
  const totalsValueX = pageWidth - margin - 3;
  doc.rect(pageWidth - margin - totalsBoxWidth, yPos, totalsBoxWidth, 22);
  doc.line(pageWidth - margin - totalsBoxWidth, yPos + 7, pageWidth - margin, yPos + 7);
  doc.line(pageWidth - margin - totalsBoxWidth, yPos + 14, pageWidth - margin, yPos + 14);
  doc.line(pageWidth - margin - 30, yPos, pageWidth - margin - 30, yPos + 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Subtotal', totalsLabelX, yPos + 4.8);
  doc.text(formatCurrency(quotation.subTotal, settings.currency), totalsValueX, yPos + 4.8, { align: 'right' });
  doc.text('Tax', totalsLabelX, yPos + 11.8);
  doc.text(formatCurrency(quotation.taxAmount || 0, settings.currency), totalsValueX, yPos + 11.8, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL', totalsLabelX, yPos + 18.8);
  doc.text(formatCurrency(quotation.grandTotal, settings.currency), totalsValueX, yPos + 18.8, { align: 'right' });

  yPos += 28;

  if (quotation.notes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Remarks:', margin + 2, yPos);
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(quotation.notes, contentWidth - 6);
    doc.text(splitNotes, margin + 2, yPos + 4);
    yPos += splitNotes.length * 4 + 8;
  }

  if (settings.footerNote) {
    const footerY = pageHeight - margin - 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(settings.footerNote, pageWidth / 2, footerY, { align: 'center' });
  }

  // Return as data URL
  return doc.output('dataurlstring');
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('fr-CM', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}
