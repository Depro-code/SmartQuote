import { useEffect, useRef, useState } from 'react';
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
import {
  Plus,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
  Share2,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import { useIsMobile } from '../components/ui/use-mobile';
import { ProductShareCard } from '../components/product/ProductShareCard';

const PRODUCTS_PAGE_SIZE = 30;

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
  const [currentPage, setCurrentPage] = useState(1);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const totalCount = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PRODUCTS_PAGE_SIZE));
  const from = totalCount === 0 ? 0 : (currentPage - 1) * PRODUCTS_PAGE_SIZE + 1;
  const to = Math.min(currentPage * PRODUCTS_PAGE_SIZE, totalCount);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PAGE_SIZE,
    currentPage * PRODUCTS_PAGE_SIZE,
  );

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (searchQuery) {
      productsService.search(searchQuery).then((results) => {
        if (isMounted) setFilteredProducts(results);
      });
    } else {
      setFilteredProducts(products);
    }
    return () => {
      isMounted = false;
    };
  }, [searchQuery, products]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const loadProducts = async () => {
    setProducts(await productsService.getAll());
  };

  const handleEdit = (product: Product) => {
    setEditProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteProductId(id);
  };

  const confirmDelete = async () => {
    if (deleteProductId) {
      const success = await productsService.delete(deleteProductId);
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
      <div className="flex h-[calc(100svh-5rem)] min-h-[620px] flex-col overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border bg-card px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold text-foreground sm:text-2xl">Products</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage inventory, stock levels, pricing, and product cards.
            </p>
          </div>
          <Button onClick={() => navigate('/products/new')} className="shrink-0">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-[420px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name, SKU, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-10"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-md border border-border bg-background px-2.5 py-1">
              Total: {products.length}
            </span>
            <span className="rounded-md border border-border bg-background px-2.5 py-1">
              Page {currentPage} of {totalPages}
            </span>
          </div>
        </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto [scrollbar-gutter:stable]">
            <Table className="min-w-[980px] border-separate border-spacing-0">
              <TableHeader className="sticky top-0 z-20 bg-card">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="border-b border-border px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Image</TableHead>
                  <TableHead className="border-b border-border px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Name</TableHead>
                  <TableHead className="border-b border-border px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Category</TableHead>
                  <TableHead className="border-b border-border px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Price</TableHead>
                  <TableHead className="border-b border-border px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Stock</TableHead>
                  <TableHead className="border-b border-border px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Status</TableHead>
                  <TableHead className="border-b border-border px-4 py-3 text-right text-xs font-semibold uppercase text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-[420px] text-center text-muted-foreground">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedProducts.map((product) => {
                    const isOutOfStock = product.quantityInStock <= 0;
                    const isLowStock =
                      !isOutOfStock &&
                      product.reorderLevel &&
                      product.quantityInStock <= product.reorderLevel;
                    
                    return (
                      <TableRow key={product.id} className="group hover:bg-muted/40">
                        <TableCell className="px-4 py-3">
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-12 w-12 rounded-md border border-border object-cover"
                          />
                      </TableCell>
                      <TableCell className="max-w-[380px] px-4 py-3">
                        <button
                          type="button"
                          onClick={() => navigate(`/products/${product.id}`)}
                          className="block max-w-full truncate text-left font-medium text-primary hover:underline"
                        >
                          {product.name}
                        </button>
                      </TableCell>
                        <TableCell className="px-4 py-3 text-muted-foreground">{product.category || '-'}</TableCell>
                        <TableCell className="px-4 py-3 font-medium text-foreground">
                          {formatCurrency(product.unitPrice)}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{product.quantityInStock}</span>
                            {isOutOfStock ? (
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                            ) : isLowStock ? (
                              <AlertTriangle className="h-4 w-4 text-warning" />
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge variant={product.isActive ? 'default' : 'secondary'}>
                            {product.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleShareOrDownload(product)}
                            >
                              {isMobile ? <Share2 className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEdit(product)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDelete(product.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
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

        <div className="border-t border-border bg-card px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {from} to {to} of {totalCount} products
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
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

    const updated = await productsService.update(product.id, formData);
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