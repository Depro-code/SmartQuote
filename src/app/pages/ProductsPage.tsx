import { forwardRef, useEffect, useRef, useState, type CSSProperties } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { productsService, imageService } from '../lib/services';
import type { Product } from '../lib/types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
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
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Plus, Search, Edit, Trash2, AlertTriangle, Share2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import { useIsMobile } from '../components/ui/use-mobile';

export default function ProductsPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [cardProduct, setCardProduct] = useState<Product | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      setFilteredProducts(productsService.search(searchQuery));
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);

  const loadProducts = () => {
    setProducts(productsService.getAll());
  };

  const handleEdit = (product: Product) => {
    setEditProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteProductId(id);
  };

  const confirmDelete = () => {
    if (deleteProductId) {
      const success = productsService.delete(deleteProductId);
      if (success) {
        toast.success('Product deleted successfully');
        loadProducts();
      } else {
        toast.error('Failed to delete product');
      }
      setDeleteProductId(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const waitForPreviewRender = async () => {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  };

  const generateProductCardBlob = async (product: Product) => {
    const { default: html2canvas } = await import('html2canvas');

    setCardProduct(product);
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

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((value) => {
        if (value) resolve(value);
        else reject(new Error('Failed to generate PNG'));
      }, 'image/png');
    });

    return blob;
  };

  const handleShareOrDownload = async (product: Product) => {
    const toastId = toast.loading(isMobile ? 'Preparing product card...' : 'Preparing download...');

    try {
      const blob = await generateProductCardBlob(product);
      const fileName = `${product.name.replace(/[^\w\-]+/g, '_')}.png`;

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Products</h1>
            <p className="text-gray-600 mt-1">Manage your inventory</p>
          </div>
          <Button onClick={() => navigate('/products/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search products by name, SKU, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => {
                    const isLowStock =
                      product.reorderLevel && product.quantityInStock <= product.reorderLevel;
                    
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-12 w-12 rounded object-cover"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.sku || '—'}</TableCell>
                        <TableCell>{product.category || '—'}</TableCell>
                        <TableCell>{formatCurrency(product.unitPrice)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{product.quantityInStock}</span>
                            {isLowStock && (
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={product.isActive ? 'default' : 'secondary'}>
                            {product.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleShareOrDownload(product)}
                            >
                              {isMobile ? <Share2 className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(product)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(product.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <EditProductDialog
        product={editProduct}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={() => {
          loadProducts();
          setIsEditDialogOpen(false);
          setEditProduct(null);
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteProductId} onOpenChange={() => setDeleteProductId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
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

const productCardStyle: CSSProperties = {
  width: '960px',
  minHeight: '420px',
  display: 'grid',
  gridTemplateColumns: '360px 1fr',
  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 52%, #fdba74 100%)',
  border: '2px solid #f59e0b',
  borderRadius: '28px',
  overflow: 'hidden',
  color: '#111827',
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const ProductShareCard = forwardRef<
  HTMLDivElement,
  { product: Product; formatCurrency: (amount: number) => string }
>(function ProductShareCard({ product, formatCurrency }, ref) {
  return (
    <div ref={ref} style={productCardStyle}>
      <div
        style={{
          background: '#fff7ed',
          padding: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRight: '2px solid rgba(245, 158, 11, 0.35)',
        }}
      >
        <img
          src={product.imageUrl}
          alt={product.name}
          style={{
            width: '100%',
            height: '320px',
            objectFit: 'cover',
            borderRadius: '22px',
            background: '#ffffff',
            border: '1px solid rgba(251, 191, 36, 0.45)',
          }}
        />
      </div>

      <div
        style={{
          padding: '34px 36px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#92400e',
            }}
          >
            Amen-Cam Product Card
          </p>
          <h2
            style={{
              margin: '14px 0 0',
              fontSize: '36px',
              lineHeight: 1.05,
              fontWeight: 900,
              color: '#111827',
            }}
          >
            {product.name}
          </h2>
          <p
            style={{
              margin: '18px 0 0',
              fontSize: '18px',
              lineHeight: 1.6,
              color: '#374151',
            }}
          >
            {product.description || 'Professional medical supply item available from Amen-Cam.'}
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: '16px',
          }}
        >
          <ProductMeta label="Price" value={formatCurrency(product.unitPrice)} />
          <ProductMeta label="Unit" value={product.unit || 'unit'} />
          <ProductMeta label="Category" value={product.category || 'General'} />
          <ProductMeta label="SKU" value={product.sku || 'N/A'} />
          <ProductMeta label="Stock" value={String(product.quantityInStock)} />
          <ProductMeta label="Brand" value={product.brand || 'Amen-Cam'} />
        </div>
      </div>
    </div>
  );
});

function ProductMeta({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        borderRadius: '18px',
        background: 'rgba(255, 255, 255, 0.62)',
        padding: '14px 16px',
      }}
    >
      <div
        style={{
          fontSize: '12px',
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#92400e',
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: '6px',
          fontSize: '20px',
          fontWeight: 800,
          color: '#111827',
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function EditProductDialog({
  product,
  open,
  onOpenChange,
  onSuccess,
}: {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    if (product) {
      setFormData(product);
      setImagePreview(product.imageUrl);
    }
  }, [product]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const compressed = await imageService.compressImage(file);
      setImagePreview(compressed);
      setFormData((prev) => ({ ...prev, imageUrl: compressed }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    const updated = productsService.update(product.id, formData);
    if (updated) {
      toast.success('Product updated successfully');
      onSuccess();
    } else {
      toast.error('Failed to update product');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>Update product information</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="image">Product Image</Label>
              <div className="mt-2 flex items-center gap-4">
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-24 w-24 rounded object-cover"
                  />
                )}
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={formData.sku || ''}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={formData.brand || ''}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="unitPrice">Unit Price *</Label>
              <Input
                id="unitPrice"
                type="number"
                value={formData.unitPrice || ''}
                onChange={(e) =>
                  setFormData({ ...formData, unitPrice: Number(e.target.value) })
                }
                required
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={formData.unit || ''}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="e.g., piece, box"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="quantityInStock">Quantity in Stock *</Label>
              <Input
                id="quantityInStock"
                type="number"
                value={formData.quantityInStock || ''}
                onChange={(e) =>
                  setFormData({ ...formData, quantityInStock: Number(e.target.value) })
                }
                required
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="reorderLevel">Reorder Level</Label>
              <Input
                id="reorderLevel"
                type="number"
                value={formData.reorderLevel || ''}
                onChange={(e) =>
                  setFormData({ ...formData, reorderLevel: Number(e.target.value) })
                }
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="isActive" className="flex items-center gap-2">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={formData.isActive ?? true}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded"
                />
                Active
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
