import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  AlertCircle,
  ArrowLeft,
  Download,
  Edit,
  Loader2,
  Save,
  Share2,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '../components/DashboardLayout';
import { ProductShareCard } from '../components/product/ProductShareCard';
import { ProductImage } from '../components/product/ProductImage';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { LoadingButton } from '../components/ui/loading-button';
import { Textarea } from '../components/ui/textarea';
import { useIsMobile } from '../components/ui/use-mobile';
import { imageService, productsService } from '../lib/services';
import type { Product } from '../lib/types';

type ProductFormState = {
  name: string;
  brand: string;
  unitPrice: number;
  unit: string;
  quantityInStock: number;
  reorderLevel: number;
  description: string;
  imageUrl: string;
  isActive: boolean;
};

function toFormState(product: Product): ProductFormState {
  return {
    name: product.name,
    brand: product.brand || '',
    unitPrice: product.unitPrice,
    unit: product.unit || '',
    quantityInStock: product.quantityInStock,
    reorderLevel: product.reorderLevel || 0,
    description: product.description || '',
    imageUrl: product.imageUrl || '',
    isActive: product.isActive,
  };
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const [product, setProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormState | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [stockQuantity, setStockQuantity] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [cardProduct, setCardProduct] = useState<Product | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const loadProduct = async () => {
    if (!id) return;
    setIsPageLoading(true);
    setLoadError(null);
    try {
      const foundProduct = await productsService.getById(id);
      setProduct(foundProduct);
      if (foundProduct) {
        setFormData(toFormState(foundProduct));
        setStockQuantity(foundProduct.quantityInStock);
      }
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : 'Failed to load product. Check your connection and try again.',
      );
    } finally {
      setIsPageLoading(false);
    }
  };

  useEffect(() => {
    loadProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (value: string) => {
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  };

  const refreshProduct = (updated: Product) => {
    setProduct(updated);
    setFormData(toFormState(updated));
    setStockQuantity(updated.quantityInStock);
  };

  const buildPayload = (data: ProductFormState): Partial<Product> => ({
    name: data.name.trim(),
    sku: null,
    category: null,
    brand: data.brand.trim() || undefined,
    unitPrice: Number(data.unitPrice) || 0,
    unit: data.unit.trim() || undefined,
    quantityInStock: Number(data.quantityInStock) || 0,
    reorderLevel: Number(data.reorderLevel) || 0,
    description: data.description.trim() || undefined,
    imageUrl: data.imageUrl,
    isActive: data.isActive,
  });

  const handleSave = async () => {
    if (!id || !formData) return;
    setIsSaving(true);
    try {
      const updated = await productsService.update(id, buildPayload(formData));
      if (!updated) {
        toast.error('Failed to update product');
        return;
      }
      refreshProduct(updated);
      setIsEditing(false);
      toast.success('Product updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update product');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (product) {
      setFormData(toFormState(product));
      setStockQuantity(product.quantityInStock);
    }
    setIsEditing(false);
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !id || !product) return;

    setIsUploadingImage(true);
    try {
      const imageUrl = await imageService.compressImage(file);
      const updated = await productsService.update(id, { imageUrl });
      if (!updated) {
        throw new Error('Failed to save image');
      }
      refreshProduct(updated);
      toast.success('Product image updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update image');
    } finally {
      setIsUploadingImage(false);
      event.target.value = '';
    }
  };

  const handleStockUpdate = async () => {
    if (!id) return;
    setIsUpdatingStock(true);
    try {
      const updated = await productsService.update(id, { quantityInStock: Number(stockQuantity) || 0 });
      if (!updated) {
        toast.error('Failed to update stock');
        return;
      }
      refreshProduct(updated);
      toast.success('Stock updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update stock');
    } finally {
      setIsUpdatingStock(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      const success = await productsService.delete(id);
      if (!success) {
        toast.error('Failed to delete product');
        return;
      }
      toast.success('Product deleted');
      navigate('/products');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete product');
    } finally {
      setIsDeleting(false);
      setDeleteOpen(false);
    }
  };

  const waitForPreviewRender = async () => {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  };

  const generateProductCardBlob = async (shareProduct: Product) => {
    const { default: html2canvas } = await import('html2canvas');

    setCardProduct(shareProduct);
    await waitForPreviewRender();

    const element = cardRef.current;
    if (!element) {
      throw new Error('Product card preview not available');
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#fef3c7',
      useCORS: true,
    });

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((value) => {
        if (value) resolve(value);
        else reject(new Error('Failed to generate PNG'));
      }, 'image/png');
    });
  };

  const handleShareOrDownload = async () => {
    if (!product) return;
    const toastId = toast.loading(isMobile ? 'Preparing product card...' : 'Preparing download...');

    try {
      const blob = await generateProductCardBlob(product);
      const fileName = `${product.name.replace(/[^\w-]+/g, '_')}.png`;

      if (isMobile && navigator.share) {
        const file = new File([blob], fileName, { type: 'image/png' });
        const shareData = {
          title: product.name,
          text: `${product.name} - ${formatCurrency(product.unitPrice)}`,
          files: [file],
        };

        if (navigator.canShare && !navigator.canShare(shareData)) {
          throw new Error('This device cannot share the generated image');
        }

        await navigator.share(shareData);
        toast.dismiss(toastId);
        toast.success('Product card ready to share');
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        toast.dismiss(toastId);
        toast.success('Product card downloaded');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to generate product card';
      toast.dismiss(toastId);
      toast.error(message);
    } finally {
      setCardProduct(null);
    }
  };

  if (isPageLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[420px] items-center justify-center gap-2 rounded-lg border border-border bg-card text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading product…
        </div>
      </DashboardLayout>
    );
  }

  if (loadError) {
    return (
      <DashboardLayout>
        <div className="flex h-[420px] flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card px-4 text-center text-muted-foreground">
          <AlertCircle className="h-6 w-6 text-destructive" />
          <p>{loadError}</p>
          <Button variant="outline" size="sm" onClick={loadProduct}>
            Retry
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (!product || !formData) {
    return (
      <DashboardLayout>
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">Product not found.</p>
          <Button className="mt-4" onClick={() => navigate('/products')}>
            Back to Products
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const isOutOfStock = product.quantityInStock <= 0;
  const isLowStock =
    !isOutOfStock &&
    product.reorderLevel !== undefined &&
    product.quantityInStock <= product.reorderLevel;
  const stockBadge = isOutOfStock
    ? { label: 'Out of stock', className: 'bg-destructive text-white' }
    : isLowStock
      ? { label: 'Low stock', className: 'bg-warning text-white' }
      : { label: 'In stock', className: 'bg-success text-white' };

  const quantityLabel = `${String(product.quantityInStock).padStart(2, '0')} ${product.unit || 'units'}`;

  return (
    <DashboardLayout>
      <div className="flex min-h-[calc(100svh-5rem)] flex-col overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => navigate('/products')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <p className="text-xs uppercase text-muted-foreground">Product details</p>
              <h1 className="truncate text-xl font-semibold text-foreground sm:text-2xl">
                {product.name}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={handleShareOrDownload}>
              {isMobile ? <Share2 className="h-4 w-4" /> : <Download className="h-4 w-4" />}
              Share
            </Button>
            {isEditing ? (
              <>
                <LoadingButton onClick={handleSave} isLoading={isSaving}>
                  <Save className="h-4 w-4" />
                  Save
                </LoadingButton>
                <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            )}
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid flex-1 gap-6 overflow-auto p-4 sm:p-5 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <div className="overflow-hidden rounded-lg border border-border bg-background">
              <ProductImage
                imageUrl={product.imageUrl}
                name={product.name}
                className="h-[280px] w-full object-cover text-4xl"
              />
              <div className="border-t border-border p-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                <LoadingButton
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                  isLoading={isUploadingImage}
                >
                  <Upload className="h-4 w-4" />
                  Upload Image
                </LoadingButton>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-center justify-between">
                <Badge className={stockBadge.className}>{stockBadge.label}</Badge>
                <span className="text-sm text-muted-foreground">Stock</span>
              </div>
              <div className="mt-4 text-4xl font-semibold text-foreground">{quantityLabel}</div>
              <div className="mt-4 flex gap-2">
                <Input
                  type="number"
                  min={0}
                  value={stockQuantity}
                  onChange={(event) => setStockQuantity(Number(event.target.value))}
                  disabled={isUpdatingStock}
                />
                <LoadingButton onClick={handleStockUpdate} isLoading={isUpdatingStock}>
                  Update Stock
                </LoadingButton>
              </div>
            </div>
          </aside>

          <section className="rounded-lg border border-border bg-background">
            <div className="border-b border-border px-4 py-3">
              <h2 className="font-semibold text-foreground">
                {isEditing ? 'Edit product information' : 'Product information'}
              </h2>
            </div>
            <div className="divide-y divide-border">
              <DetailField label="Name" value={product.name} isEditing={isEditing}>
                <Input
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                />
              </DetailField>
              <DetailField label="Brand" value={product.brand || 'Not set'} isEditing={isEditing}>
                <Input
                  value={formData.brand}
                  onChange={(event) => setFormData({ ...formData, brand: event.target.value })}
                />
              </DetailField>
              <DetailField label="Unit price" value={formatCurrency(product.unitPrice)} isEditing={isEditing}>
                <Input
                  type="number"
                  min={0}
                  value={formData.unitPrice}
                  onChange={(event) =>
                    setFormData({ ...formData, unitPrice: Number(event.target.value) })
                  }
                />
              </DetailField>
              <DetailField label="Unit" value={product.unit || 'Not set'} isEditing={isEditing}>
                <Input
                  value={formData.unit}
                  onChange={(event) => setFormData({ ...formData, unit: event.target.value })}
                />
              </DetailField>
              <DetailField
                label="Quantity in stock"
                value={String(product.quantityInStock)}
                isEditing={isEditing}
              >
                <Input
                  type="number"
                  min={0}
                  value={formData.quantityInStock}
                  onChange={(event) =>
                    setFormData({ ...formData, quantityInStock: Number(event.target.value) })
                  }
                />
              </DetailField>
              <DetailField
                label="Reorder level"
                value={String(product.reorderLevel || 0)}
                isEditing={isEditing}
              >
                <Input
                  type="number"
                  min={0}
                  value={formData.reorderLevel}
                  onChange={(event) =>
                    setFormData({ ...formData, reorderLevel: Number(event.target.value) })
                  }
                />
              </DetailField>
              <DetailField
                label="Description"
                value={product.description || 'Not set'}
                isEditing={isEditing}
              >
                <Textarea
                  value={formData.description}
                  onChange={(event) =>
                    setFormData({ ...formData, description: event.target.value })
                  }
                  rows={4}
                />
              </DetailField>
              <DetailField
                label="Active"
                value={product.isActive ? 'Active' : 'Inactive'}
                isEditing={isEditing}
              >
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(event) =>
                      setFormData({ ...formData, isActive: event.target.checked })
                    }
                  />
                  Active product
                </label>
              </DetailField>
              <DetailField label="Created at" value={formatDate(product.createdAt)} />
              <DetailField label="Updated at" value={formatDate(product.updatedAt)} />
            </div>
          </section>
        </div>
      </div>

      <AlertDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleteOpen(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <LoadingButton
              variant="destructive"
              onClick={handleDelete}
              isLoading={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </LoadingButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="pointer-events-none fixed left-[-9999px] top-0 opacity-0">
        {cardProduct && (
          <ProductShareCard
            ref={cardRef}
            product={cardProduct}
            formatCurrency={formatCurrency}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

function DetailField({
  label,
  value,
  isEditing = false,
  children,
}: {
  label: string;
  value: string;
  isEditing?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="grid gap-2 px-4 py-3 md:grid-cols-[180px_minmax(0,1fr)] md:items-start">
      <Label className="text-sm text-muted-foreground">{label}</Label>
      {isEditing && children ? (
        <div>{children}</div>
      ) : (
        <div className="whitespace-pre-wrap text-sm font-medium text-foreground">{value}</div>
      )}
    </div>
  );
}