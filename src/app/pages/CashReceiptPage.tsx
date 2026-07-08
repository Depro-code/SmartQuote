import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ArrowLeft, Download, Loader2, Pencil, Printer, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '../components/DashboardLayout';
import { PrintableCashReceiptDocument } from '../components/invoice/PrintableCashReceiptDocument';
import { Button } from '../components/ui/button';
import { LoadingButton } from '../components/ui/loading-button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { quotationsService, receiptsService, salesService, settingsService } from '../lib/services';
import { generateQuotationPDF } from '../lib/pdfGenerator';
import type { CashReceipt, Quotation, Settings } from '../lib/types';
import { useIsMobile } from '../components/ui/use-mobile';

// Everything needed to create a receipt that doesn't exist yet. Kept
// separate from CashReceipt itself since it has no id/receiptNumber
// until the person confirms generation (and optionally types a manual
// number) via handleGenerate below.
type PendingReceiptSource = {
  saleId?: string;
  quotationId?: string;
  customerName: string;
  issueDate: string;
  items: { description: string; quantity: number | null; unitPrice: number; total: number }[];
  subTotal: number;
  taxRate?: number;
  taxAmount?: number;
  grandTotal: number;
};

// The printable document is typed against Quotation (it's shared with
// the quotation PDF flow). This adapts a persisted CashReceipt into that
// shape purely for rendering — nothing here is written back to the DB.
// generateQuotationPDF also takes a Quotation and ignores its fields
// entirely (it only reads the rendered element), so this same shape
// lets us reuse that shared generator instead of duplicating its
// multi-page/keep-together pagination logic here.
function toPrintableShape(receipt: CashReceipt): Quotation {
  return {
    id: receipt.id,
    quoteNumber: receipt.receiptNumber,
    customerName: receipt.customerName,
    status: 'CONFIRMED',
    issueDate: receipt.issueDate,
    items: receipt.items.map((item) => ({
      nameSnapshot: item.description,
      unitPriceSnapshot: item.unitPrice,
      quantity: item.quantity ?? 1,
      lineTotal: item.total,
    })),
    subTotal: receipt.subTotal,
    taxRate: receipt.taxRate,
    taxAmount: receipt.taxAmount,
    grandTotal: receipt.grandTotal,
    createdAt: receipt.createdAt,
    updatedAt: receipt.updatedAt,
  };
}

export default function CashReceiptPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const documentRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [backPath, setBackPath] = useState('/quotations');
  const [isResolving, setIsResolving] = useState(true);
  const [receipt, setReceipt] = useState<CashReceipt | null>(null);
  const [pendingSource, setPendingSource] = useState<PendingReceiptSource | null>(null);
  const [manualReceiptNumber, setManualReceiptNumber] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sharePdfBlob, setSharePdfBlob] = useState<Blob | null>(null);
  const [isEditNumberOpen, setIsEditNumberOpen] = useState(false);
  const [editNumberValue, setEditNumberValue] = useState('');
  const [editNumberError, setEditNumberError] = useState<string | null>(null);
  const [isSavingNumber, setIsSavingNumber] = useState(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const from = searchParams.get('from');
    const saleId = searchParams.get('saleId');

    (async () => {
      setIsResolving(true);
      try {
        const loadedSettings = await settingsService.get();
        setSettings(loadedSettings);

        if (from === 'sale' && saleId) {
          setBackPath('/sales');
          const sale = await salesService.getById(saleId);
          if (!sale) {
            toast.error('Sale not found');
            return;
          }

          // Look up first — don't create a new receipt just because this
          // page was visited again. A receipt for this sale may have been
          // generated from either this page OR the linked quotation's
          // "Generate Cash Receipt" button, so both links have to be
          // checked or the quotation-side receipt gets missed here and a
          // second, duplicate receipt gets created for the same sale.
          const existing = await receiptsService.findExisting({
            saleId: sale.id,
            quotationId: sale.quotationId,
          });
          if (existing) {
            setReceipt(existing);
            return;
          }

          setPendingSource({
            saleId: sale.id,
            quotationId: sale.quotationId,
            customerName: sale.customer,
            issueDate: sale.date,
            items: sale.items.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total,
            })),
            subTotal: sale.grandTotal,
            grandTotal: sale.grandTotal,
          });
          return;
        }

        if (from) {
          setBackPath('/quotations');
          const sourceQuotation = await quotationsService.getById(from);
          if (!sourceQuotation) {
            toast.error('Quotation not found');
            return;
          }

          // Same cross-check in the other direction: a receipt may already
          // exist because it was generated from the linked sale's page.
          const linkedSale = await salesService.getByQuotationId(from);
          const existing = await receiptsService.findExisting({
            quotationId: from,
            saleId: linkedSale?.id,
          });
          if (existing) {
            setReceipt(existing);
            return;
          }

          setPendingSource({
            quotationId: sourceQuotation.id,
            saleId: linkedSale?.id,
            customerName: sourceQuotation.customerName,
            issueDate: sourceQuotation.issueDate,
            items: sourceQuotation.items.map((item) => ({
              description: item.nameSnapshot,
              quantity: item.quantity,
              unitPrice: item.unitPriceSnapshot,
              total: item.lineTotal,
            })),
            subTotal: sourceQuotation.subTotal,
            taxRate: sourceQuotation.taxRate,
            taxAmount: sourceQuotation.taxAmount,
            grandTotal: sourceQuotation.grandTotal,
          });
        }
      } finally {
        setIsResolving(false);
      }
    })();
  }, [searchParams]);

  useEffect(() => {
    if (!isMobile || !receipt || !documentRef.current) return;

    let cancelled = false;
    const preparePdf = async () => {
      try {
        const doc = await generateQuotationPDF(documentRef.current as HTMLElement, toPrintableShape(receipt));
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
  }, [isMobile, receipt]);

  const handleGenerate = async () => {
    if (!pendingSource) return;

    setIsGenerating(true);
    try {
      const created = await receiptsService.create({
        receiptNumber: manualReceiptNumber.trim() || undefined,
        saleId: pendingSource.saleId,
        quotationId: pendingSource.quotationId,
        customerName: pendingSource.customerName,
        issueDate: pendingSource.issueDate,
        items: pendingSource.items,
        subTotal: pendingSource.subTotal,
        taxRate: pendingSource.taxRate,
        taxAmount: pendingSource.taxAmount,
        grandTotal: pendingSource.grandTotal,
      });
      setReceipt(created);
      setPendingSource(null);
      toast.success('Cash receipt generated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate cash receipt');
    } finally {
      setIsGenerating(false);
    }
  };

  const openEditNumber = () => {
    if (!receipt) return;
    setEditNumberValue(receipt.receiptNumber);
    setEditNumberError(null);
    setIsEditNumberOpen(true);
  };

  const handleSaveNumber = async () => {
    if (!receipt) return;

    const trimmed = editNumberValue.trim();
    if (!trimmed) {
      setEditNumberError('Receipt number cannot be empty.');
      return;
    }
    if (trimmed === receipt.receiptNumber) {
      setIsEditNumberOpen(false);
      return;
    }

    setIsSavingNumber(true);
    setEditNumberError(null);
    try {
      const taken = await receiptsService.isReceiptNumberTaken(trimmed, receipt.id);
      if (taken) {
        setEditNumberError('That receipt number is already in use. Choose a different one.');
        return;
      }

      const updated = await receiptsService.update(receipt.id, trimmed);
      setReceipt(updated);
      setIsEditNumberOpen(false);
      toast.success('Receipt number updated');
    } catch (error) {
      setEditNumberError(
        error instanceof Error ? error.message : 'Failed to update receipt number. Try again.',
      );
    } finally {
      setIsSavingNumber(false);
    }
  };

  const handleExportPDF = async () => {
    if (!receipt || !documentRef.current || loading) return;

    setLoading(true);
    try {
      const doc = await generateQuotationPDF(documentRef.current, toPrintableShape(receipt));
      doc.save(`${receipt.receiptNumber}.pdf`);
      toast.success('Cash receipt exported');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to export cash receipt');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintPDF = async () => {
    if (!receipt || !documentRef.current) return;

    try {
      const doc = await generateQuotationPDF(documentRef.current, toPrintableShape(receipt));
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
    if (!receipt || !navigator.share) {
      toast.error('File sharing is not supported on this device');
      return;
    }

    try {
      if (!sharePdfBlob) {
        toast.info('PDF is still preparing. Tap share again in a moment.');
        return;
      }
      const file = new File([sharePdfBlob], `${receipt.receiptNumber}.pdf`, { type: 'application/pdf' });
      await navigator.share({
        title: receipt.receiptNumber,
        text: `Cash receipt ${receipt.receiptNumber}`,
        files: [file],
      });
      toast.success('Cash receipt ready to share');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to share cash receipt');
    }
  };

  if (isResolving) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading cash receipt…
        </div>
      </DashboardLayout>
    );
  }

  if (!settings || (!receipt && !pendingSource)) {
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

  // No receipt exists yet for this sale/quotation — ask before creating
  // one, and let the person type a specific number if they need to
  // continue an existing paper-based numbering sequence.
  if (!receipt && pendingSource) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-md space-y-6 py-12">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(backPath)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Generate Cash Receipt</h1>
              <p className="mt-1 text-sm text-muted-foreground">For {pendingSource.customerName}</p>
            </div>
          </div>

          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <div>
              <Label htmlFor="manual-receipt-number">Receipt number (optional)</Label>
              <Input
                id="manual-receipt-number"
                placeholder="Leave blank to auto-generate"
                value={manualReceiptNumber}
                onChange={(event) => setManualReceiptNumber(event.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Enter a specific number to continue an existing sequence, or leave blank and one will
                be generated automatically.
              </p>
            </div>
            <LoadingButton onClick={handleGenerate} isLoading={isGenerating} className="w-full">
              Generate
            </LoadingButton>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const receiptView = toPrintableShape(receipt as CashReceipt);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(backPath)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">{receiptView.quoteNumber}</h1>
              <p className="mt-1 text-gray-600">Cash receipt preview and export</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={openEditNumber}>
              <Pencil className="h-4 w-4" />
              Edit Number
            </Button>
            <LoadingButton onClick={handleExportPDF} isLoading={loading}>
              <Download className="h-4 w-4" />
              Export PDF
            </LoadingButton>
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

        <div className="rounded-[2rem] bg-gradient-to-br from-slate-100 via-slate-50 to-white p-4 sm:p-6 overflow-x-auto">
          <PrintableCashReceiptDocument ref={documentRef} quotation={receiptView} settings={settings} />
        </div>
      </div>

      <Dialog
        open={isEditNumberOpen}
        onOpenChange={(open) => {
          if (!open && !isSavingNumber) setIsEditNumberOpen(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Receipt Number</DialogTitle>
            <DialogDescription>
              Change the receipt number for this cash receipt. It must be unique.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="edit-receipt-number">Receipt Number</Label>
            <Input
              id="edit-receipt-number"
              value={editNumberValue}
              onChange={(event) => {
                setEditNumberValue(event.target.value);
                if (editNumberError) setEditNumberError(null);
              }}
            />
            {editNumberError && <p className="mt-1 text-sm text-destructive">{editNumberError}</p>}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditNumberOpen(false)}
              disabled={isSavingNumber}
            >
              Cancel
            </Button>
            <LoadingButton onClick={handleSaveNumber} isLoading={isSavingNumber}>
              Save
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}