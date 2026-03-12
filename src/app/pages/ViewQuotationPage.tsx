import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { DashboardLayout } from '../components/DashboardLayout';
import { quotationsService, settingsService } from '../lib/services';
import type { Quotation, Settings } from '../lib/types';
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
import { ArrowLeft, Download, Share2, CheckCircle, Loader2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { PrintableQuotationDocument } from '../components/quotation/PrintableQuotationDocument';
import { format } from 'date-fns';
import { useIsMobile } from '../components/ui/use-mobile';

export default function ViewQuotationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const printRef = useRef<HTMLDivElement | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (id) {
      const q = quotationsService.getById(id);
      setQuotation(q);
      setSettings(settingsService.get());
    }
  }, [id]);

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
    if (loading) return;

    setLoading(true);
    const toastId = toast.loading('Exporting PDF...');

    try {
      const element = printRef.current;
      if (!element) {
        throw new Error('Quotation template not found');
      }

      const canvas = await html2canvas(element, { scale: 2 });
      const data = canvas.toDataURL('image/png');
      const pdf = new jsPDF('portrait', 'px', 'a4');
      const imageProperties = pdf.getImageProperties(data);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imageProperties.height * pdfWidth) / imageProperties.width;

      pdf.addImage(data, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${quotation.quoteNumber}.pdf`);

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

  const generatePdfBlob = async () => {
    const element = printRef.current;
    if (!element) {
      throw new Error('Quotation template not found');
    }

    const canvas = await html2canvas(element, { scale: 2 });
    const data = canvas.toDataURL('image/png');
    const pdf = new jsPDF('portrait', 'px', 'a4');
    const imageProperties = pdf.getImageProperties(data);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imageProperties.height * pdfWidth) / imageProperties.width;

    pdf.addImage(data, 'PNG', 0, 0, pdfWidth, pdfHeight);
    return pdf.output('blob');
  };

  const handleShareWhatsApp = async () => {
    const currentSettings = settings || settingsService.get();

    if (!navigator.share) {
      toast.error('File sharing is not supported on this device');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Preparing PDF for sharing...');

    try {
      const pdfBlob = await generatePdfBlob();
      const file = new File([pdfBlob], `${quotation.quoteNumber}.pdf`, {
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
      toast.dismiss(toastId);
      toast.success('PDF ready to share');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to share PDF';
      toast.dismiss(toastId);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (newStatus: Quotation['status']) => {
    if (newStatus === 'CONFIRMED' && quotation.status !== 'CONFIRMED') {
      setShowConfirmDialog(true);
      return;
    }

    quotationsService.update(quotation.id, { status: newStatus });
    const updated = quotationsService.getById(quotation.id);
    if (updated) {
      setQuotation(updated);
      toast.success(`Status updated to ${newStatus}`);
    }
  };

  const confirmQuotation = () => {
    const success = quotationsService.confirmQuotation(quotation.id);
    if (success) {
      const updated = quotationsService.getById(quotation.id);
      if (updated) {
        setQuotation(updated);
        toast.success('Quotation confirmed and stock updated');
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
              <p className="mt-1 text-gray-600">Quotation preview and export</p>
              <div className="mt-2 text-sm text-slate-500">
                <div>Created: {format(new Date(quotation.createdAt), 'MMMM dd, yyyy')}</div>
                <div>Modified: {format(new Date(quotation.updatedAt), 'MMMM dd, yyyy')}</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
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
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={() => navigate(`/quotations/${quotation.id}/edit`)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit Quotation
          </Button>
          <Button onClick={handleExportPDF} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export PDF
          </Button>
          {isMobile && quotation.customerPhone && (
            <Button variant="outline" onClick={handleShareWhatsApp}>
              <Share2 className="h-4 w-4 mr-2" />
              Share via WhatsApp
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-5 py-4">
          <div>
            <p className="text-sm font-medium text-slate-900">Live quotation document</p>
            <p className="text-sm text-slate-500">The PDF export captures the document below exactly as shown.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">Current status</span>
            {getStatusBadge(quotation.status)}
          </div>
        </div>

        <div className="rounded-[2rem] bg-gradient-to-br from-slate-100 via-slate-50 to-white p-4 sm:p-6">
          {settings && <PrintableQuotationDocument ref={printRef} quotation={quotation} settings={settings} />}
        </div>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Quotation</AlertDialogTitle>
            <AlertDialogDescription>
              Confirming this quotation will reduce the stock quantities for all items. This action
              cannot be undone. Do you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
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
