import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ArrowLeft, Download, Printer, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '../components/DashboardLayout';
import { PrintableCashReceiptDocument } from '../components/invoice/PrintableCashReceiptDocument';
import { Button } from '../components/ui/button';
import { quotationsService, salesService, settingsService } from '../lib/services';
import type { Quotation, Settings } from '../lib/types';
import { useIsMobile } from '../components/ui/use-mobile';

const RECEIPTS_KEY = 'smartquote_receipts';

type ReceiptRecord = {
  id: string;
  quoteNumber: string;
  quotationId?: string;
  saleId?: string;
  createdAt: string;
};

function getReceipts(): ReceiptRecord[] {
  return JSON.parse(localStorage.getItem(RECEIPTS_KEY) || '[]');
}

function createReceiptRecord(quotationId?: string, saleId?: string): ReceiptRecord {
  const receipts = getReceipts();
  const record: ReceiptRecord = {
    id: Date.now().toString(),
    quoteNumber: `CR-${String(receipts.length + 1).padStart(3, '0')}`,
    quotationId,
    saleId,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(RECEIPTS_KEY, JSON.stringify([...receipts, record]));
  return record;
}

async function generateReceiptPdf(element: HTMLElement): Promise<jsPDF> {
  const canvas = await html2canvas(element, {
    scale: 3,
    useCORS: true,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth,
    width: element.scrollWidth,
    height: element.scrollHeight,
  });
  const imgData = canvas.toDataURL('image/jpeg', 0.9);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const imgHeight = (canvas.height / canvas.width) * pageWidth;
  doc.addImage(imgData, 'JPEG', 0, 0, pageWidth, imgHeight);
  return doc;
}

export default function CashReceiptPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const documentRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [backPath, setBackPath] = useState('/quotations');
  const [loading, setLoading] = useState(false);
  const [sharePdfBlob, setSharePdfBlob] = useState<Blob | null>(null);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const from = searchParams.get('from');
    const saleId = searchParams.get('saleId');
    const loadedSettings = settingsService.get();
    setSettings(loadedSettings);

    if (from === 'sale' && saleId) {
      const sale = salesService.getById(saleId);
      if (!sale) {
        toast.error('Sale not found');
        return;
      }
      const receipt = createReceiptRecord(undefined, sale.id);
      setBackPath('/sales');
      setQuotation({
        id: receipt.id,
        quoteNumber: receipt.quoteNumber,
        customerName: sale.customer,
        status: 'CONFIRMED',
        issueDate: sale.date,
        items: sale.items.map((item, index) => ({
          productId: `sale-item-${index + 1}`,
          nameSnapshot: item.description,
          unitPriceSnapshot: item.unitPrice,
          quantity: item.quantity ?? 1,
          lineTotal: item.total,
        })),
        subTotal: sale.grandTotal,
        grandTotal: sale.grandTotal,
        createdAt: receipt.createdAt,
        updatedAt: receipt.createdAt,
      });
      return;
    }

    if (from) {
      const sourceQuotation = quotationsService.getById(from);
      if (!sourceQuotation) {
        toast.error('Quotation not found');
        return;
      }
      const receipt = createReceiptRecord(sourceQuotation.id);
      setBackPath('/quotations');
      setQuotation({
        ...sourceQuotation,
        id: receipt.id,
        quoteNumber: receipt.quoteNumber,
        status: 'CONFIRMED',
        createdAt: receipt.createdAt,
        updatedAt: receipt.createdAt,
      });
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isMobile || !quotation || !documentRef.current) return;

    let cancelled = false;
    const preparePdf = async () => {
      try {
        const doc = await generateReceiptPdf(documentRef.current as HTMLElement);
        const blob = doc.output('blob');
        if (!cancelled) setSharePdfBlob(blob);
      } catch {
        if (!cancelled) setSharePdfBlob(null);
      }
    };

    void preparePdf();
    return () => {
      cancelled = true;
    };
  }, [isMobile, quotation]);

  const handleExportPDF = async () => {
    if (!quotation || !documentRef.current || loading) return;

    setLoading(true);
    try {
      const doc = await generateReceiptPdf(documentRef.current);
      doc.save(`${quotation.quoteNumber}.pdf`);
      toast.success('Cash receipt exported');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to export cash receipt');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintPDF = async () => {
    if (!documentRef.current) return;

    try {
      const doc = await generateReceiptPdf(documentRef.current);
      const blobUrl = doc.output('bloburl') as unknown as string;
      const printWindow = window.open(blobUrl, '_blank');
      if (!printWindow) {
        toast.error('Unable to open print window');
        return;
      }
      printWindow.onload = () => printWindow.print();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to print cash receipt');
    }
  };

  const handleShare = async () => {
    if (!quotation || !navigator.share) {
      toast.error('File sharing is not supported on this device');
      return;
    }

    try {
      if (!sharePdfBlob) {
        toast.info('PDF is still preparing. Tap share again in a moment.');
        return;
      }
      const file = new File([sharePdfBlob], `${quotation.quoteNumber}.pdf`, { type: 'application/pdf' });
      await navigator.share({
        title: quotation.quoteNumber,
        text: `Cash receipt ${quotation.quoteNumber}`,
        files: [file],
      });
      toast.success('Cash receipt ready to share');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to share cash receipt');
    }
  };

  if (!quotation || !settings) {
    return (
      <DashboardLayout>
        <div className="py-12 text-center">
          <p className="text-muted-foreground">Cash receipt not available</p>
          <Button className="mt-4" onClick={() => navigate(backPath)}>
            Back
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(backPath)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">{quotation.quoteNumber}</h1>
              <p className="mt-1 text-gray-600">Cash receipt preview and export</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleExportPDF} disabled={loading}>
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
            {!isMobile && (
              <Button variant="outline" onClick={handlePrintPDF}>
                <Printer className="h-4 w-4" />
                Print
              </Button>
            )}
            {isMobile && (
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-[2rem] bg-gradient-to-br from-slate-100 via-slate-50 to-white p-4 sm:p-6">
          <PrintableCashReceiptDocument ref={documentRef} quotation={quotation} settings={settings} />
        </div>
      </div>
    </DashboardLayout>
  );
}
