import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { DashboardLayout } from '../components/DashboardLayout';
import { quotationsService, receiptsService, salesService, settingsService } from '../lib/services';
import type { CashReceipt, Quotation, SaleType, Settings } from '../lib/types';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { ArrowLeft, AlertCircle, Download, Printer, Share2, CheckCircle, Loader2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { PrintableQuotationDocument } from '../components/quotation/PrintableQuotationDocument';
import { generateQuotationPDF, quotationPdfFilename } from '../lib/pdfGenerator';
import { format } from 'date-fns';
import { useIsMobile } from '../components/ui/use-mobile';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';

export default function ViewQuotationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmSaleType, setConfirmSaleType] = useState<SaleType>('CASH');
  const [sharePdfBlob, setSharePdfBlob] = useState<Blob | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [existingReceipt, setExistingReceipt] = useState<CashReceipt | null>(null);
  const documentRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const loadQuotation = () => {
    if (!id) {
      setIsPageLoading(false);
      return () => {};
    }

    let isMounted = true;
    setIsPageLoading(true);
    setLoadError(null);

    Promise.all([quotationsService.getById(id), settingsService.get()])
      .then(([q, s]) => {
        if (!isMounted) return;
        setQuotation(q);
        setSettings(s);
      })
      .catch((error) => {
        if (!isMounted) return;
        // A network hiccup must never look identical to "this quotation
        // doesn't exist" - one is worth retrying, the other sends the
        // user back to the list for nothing.
        setLoadError(
          error instanceof Error
            ? error.message
            : 'Failed to load quotation. Check your connection and try again.',
        );
      })
      .finally(() => {
        if (!isMounted) return;
        setIsPageLoading(false);
      });

    return () => {
      isMounted = false;
    };
  };

  useEffect(() => {
    const cleanup = loadQuotation();
    return cleanup;
  }, [id]);

  useEffect(() => {
    if (!quotation || quotation.status !== 'CONFIRMED') {
      setExistingReceipt(null);
      return;
    }

    let isMounted = true;
    (async () => {
      try {
        const linkedSale = await salesService.getByQuotationId(quotation.id);
        const receipt = await receiptsService.findExisting({
          quotationId: quotation.id,
          saleId: linkedSale?.id,
        });
        if (isMounted) setExistingReceipt(receipt);
      } catch {
        // Non-fatal to the page - worst case the button just says
        // "Generate" and CashReceiptPage resolves it correctly anyway.
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [quotation]);

  useEffect(() => {
    if (!isMobile || !quotation || !settings) return;

    let cancelled = false;

    const preparePdf = async () => {
      try {
        const pdfBlob = await generatePdfBlob(quotation);
        if (!cancelled) {
          setSharePdfBlob(pdfBlob);
        }
      } catch {
        if (!cancelled) {
          setSharePdfBlob(null);
        }
      }
    };

    void preparePdf();

    return () => {
      cancelled = true;
    };
  }, [isMobile, quotation, settings]);

  if (isPageLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading quotation…
        </div>
      </DashboardLayout>
    );
  }

  if (loadError) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center text-muted-foreground">
          <AlertCircle className="h-6 w-6 text-destructive" />
          <p>{loadError}</p>
          <Button variant="outline" size="sm" onClick={loadQuotation}>
            Retry
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (!quotation) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Quotation not found</p>
          <Button className="mt-4" onClick={() => navigate('/quotations')}>
            Back to Quotations
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const handleExportPDF = async () => {
    if (loading || !settings || !documentRef.current) return;

    setLoading(true);
    const toastId = toast.loading('Exporting PDF...');

    try {
      const doc = await generateQuotationPDF(documentRef.current, quotation);
      doc.save(quotationPdfFilename(quotation));

      toast.dismiss(toastId);
      toast.success('PDF export successful');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown export error';
      console.error('PDF export error:', error);
      toast.dismiss(toastId);
      toast.error(`PDF export failed: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const generatePdfBlob = async (q: Quotation) => {
    if (!documentRef.current) {
      throw new Error('Quotation document is not ready');
    }
    const doc = await generateQuotationPDF(documentRef.current, q);
    return doc.output('blob');
  };

  const handleShareWhatsApp = async () => {
    const currentSettings = settings || (await settingsService.get());

    if (!navigator.share) {
      toast.error('File sharing is not supported on this device');
      return;
    }

    try {
      if (!sharePdfBlob) {
        toast.info('PDF is still preparing. Tap share again in a moment.');
        return;
      }

      const file = new File([sharePdfBlob], `${quotation.quoteNumber}.pdf`, {
        type: 'application/pdf',
      });
      const shareData = {
        title: quotation.quoteNumber,
        text: `Hello ${quotation.customerName}, please find attached quotation ${quotation.quoteNumber} from ${currentSettings.companyName}.`,
        files: [file],
      };

      if (navigator.canShare && !navigator.canShare(shareData)) {
        throw new Error('This device cannot share PDF files');
      }

      await navigator.share(shareData);
      toast.success('PDF ready to share');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to share PDF';
      toast.error(message);
    }
  };

  const handlePrintPDF = async () => {
    if (!settings || !documentRef.current) {
      toast.error('Settings not loaded yet');
      return;
    }

    try {
      const doc = await generateQuotationPDF(documentRef.current, quotation);
      const blobUrl = doc.output('bloburl') as unknown as string;
      const printWindow = window.open(blobUrl, '_blank');
      if (!printWindow) {
        toast.error('Unable to open print window');
        return;
      }
      printWindow.onload = () => {
        printWindow.print();
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to generate PDF for printing';
      toast.error(message);
    }
  };

  const handleStatusChange = async (newStatus: Quotation['status']) => {
    if (newStatus === 'CONFIRMED' && quotation.status !== 'CONFIRMED') {
      setConfirmSaleType('CASH');
      setShowConfirmDialog(true);
      return;
    }

    await quotationsService.update(quotation.id, { status: newStatus });
    const updated = await quotationsService.getById(quotation.id);
    if (updated) {
      setQuotation(updated);
      toast.success(`Status updated to ${newStatus}`);
    }
  };

  const confirmQuotation = async () => {
    const success = await quotationsService.confirmQuotation(quotation.id, confirmSaleType);
    if (success) {
      const updated = await quotationsService.getById(quotation.id);
      if (updated) {
        setQuotation(updated);
        toast.success(`Quotation confirmed as a ${confirmSaleType.toLowerCase()} sale and stock updated`);
      }
    } else {
      toast.error('Failed to confirm quotation');
    }
    setShowConfirmDialog(false);
  };

  const formatCurrency = (amount: number) => {
    const currency = settings?.currency || 'XAF';
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: Quotation['status']) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      DRAFT: 'secondary',
      SENT: 'default',
      CONFIRMED: 'default',
      CANCELLED: 'destructive',
    };

    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/quotations')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">{quotation.quoteNumber}</h1>
              <div className="mt-2 text-sm text-slate-500">
                <div>Created: {format(new Date(quotation.createdAt), 'MMMM dd, yyyy')}</div>
                <div>Modified: {format(new Date(quotation.updatedAt), 'MMMM dd, yyyy')}</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {quotation.status === 'CONFIRMED' ? (
              getStatusBadge(quotation.status)
            ) : (
              <Select value={quotation.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {quotation.status !== 'CONFIRMED' && (
            <Button variant="outline" onClick={() => navigate(`/quotations/${quotation.id}/edit`)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Quotation
            </Button>
          )}
          {quotation.status === 'CONFIRMED' && (
            <Button variant="outline" onClick={() => navigate(`/receipts/new?from=${quotation.id}`)}>
              {existingReceipt ? 'View Receipt' : 'Generate Cash Receipt'}
            </Button>
          )}
          <Button onClick={handleExportPDF} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export PDF
          </Button>
          {!isMobile && (
            <Button variant="outline" onClick={handlePrintPDF}>
              <Printer className="h-4 w-4 mr-2" />
              Print PDF
            </Button>
          )}
          {isMobile && quotation.customerPhone && (
            <Button variant="outline" onClick={handleShareWhatsApp}>
              <Share2 className="h-4 w-4 mr-2" />
              Share via WhatsApp
            </Button>
          )}
        </div>

        <div className="rounded-[2rem] bg-gradient-to-br from-slate-100 via-slate-50 to-white p-4 sm:p-6 overflow-x-auto">
          {settings && (
            <PrintableQuotationDocument
              ref={documentRef}
              quotation={quotation}
              settings={settings}
            />
          )}
        </div>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Quotation</AlertDialogTitle>
            <AlertDialogDescription>
              Confirming this quotation will reduce the stock quantities for all items and record it
              as a sale. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label className="mb-2 block text-sm font-medium">Payment type</Label>
            <RadioGroup
              value={confirmSaleType}
              onValueChange={(value) => setConfirmSaleType(value as SaleType)}
              className="flex gap-6"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="CASH" id="sale-type-cash" />
                <Label htmlFor="sale-type-cash" className="font-normal">Cash</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="CREDIT" id="sale-type-credit" />
                <Label htmlFor="sale-type-credit" className="font-normal">Credit</Label>
              </div>
            </RadioGroup>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmQuotation}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}