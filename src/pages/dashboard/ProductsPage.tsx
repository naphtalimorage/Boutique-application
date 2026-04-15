import { useState, useEffect } from 'react';
import { productsAPI, categoriesAPI } from '@/services/api';
import type { Product, Category, SizeVariation } from '@/types';
import { useToast } from '@/components/ui/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';
import ImageUpload from '@/components/ImageUpload';
import { SizeVariationsEditor } from '@/components/SizeVariationsEditor';
import { Plus, Edit, Trash2, Search, Loader2, Package } from 'lucide-react';

interface FormErrors {
  name?: string;
  category?: string;
  price?: string;
  image?: string;
  variations?: string;
  stock?: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    price: 0,
    stock: 0,
  });
  const [uploadedImage, setUploadedImage] = useState<{ file: File | null; preview: string | null }>({
    file: null,
    preview: null,
  });
  const [variations, setVariations] = useState<SizeVariation[]>([]);
  const [expandedSizes, setExpandedSizes] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const { success, error: showError } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([
        productsAPI.getAll(),
        categoriesAPI.getAll(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (err) {
      showError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.name.trim()) {
      errors.name = 'Product name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Product name must be at least 2 characters';
    }

    if (!formData.categoryId) {
      errors.category = 'Please select a category';
    }

    if (formData.price <= 0) {
      errors.price = 'Price must be greater than 0';
    }

    // Validate size & color variations are required
    if (variations.length === 0) {
      errors.variations = 'At least one size is required';
    } else {
      for (let i = 0; i < variations.length; i++) {
        const size = variations[i];
        if (!size.size.trim()) {
          errors.variations = `Size #${i + 1} name is required`;
          break;
        }
        if (size.colors.length === 0) {
          errors.variations = `${size.size || `Size #${i + 1}`} must have at least one color`;
          break;
        }
        for (let j = 0; j < size.colors.length; j++) {
          const color = size.colors[j];
          if (!color.name.trim()) {
            errors.variations = `Color #${j + 1} in ${size.size} name is required`;
            break;
          }
        }
        if (errors.variations) break;
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        categoryId: product.categoryId,
        price: product.price,
        stock: product.stock,
      });
      setUploadedImage({
        file: null,
        preview: product.imageUrl || null,
      });
      setVariations(product.variations || []);
      setExpandedSizes(new Set(product.variations?.map((_, i) => i) || []));
    } else {
      setEditingProduct(null);
      setFormData({ name: '', categoryId: '', price: 0, stock: 0 });
      setUploadedImage({ file: null, preview: null });
      // Start with one default size and color
      setVariations([{ size: '', stock: 0, colors: [{ name: '', stock: 0, imageUrl: '' }] }]);
      setExpandedSizes(new Set([0]));
    }
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleImageChange = (file: File | null, preview: string | null) => {
    setUploadedImage({ file, preview });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showError('Please fix the errors before submitting');
      return;
    }

    setSubmitting(true);

    try {
      const productData = {
        name: formData.name.trim(),
        categoryId: formData.categoryId,
        price: formData.price,
        stock: formData.stock,
        variations,
      };

      if (uploadedImage.file) {
        console.log('📎 Uploading image directly to Supabase...');
        await productsAPI.createWithImage(productData, uploadedImage.file);
      } else {
        await productsAPI.create(productData);
      }

      // Re-fetch products
      const [productsData, categoriesData] = await Promise.all([
        productsAPI.getAll(),
        categoriesAPI.getAll(),
      ]);

      setProducts(productsData);
      setCategories(categoriesData);

      setDialogOpen(false);
      setFormErrors({});
      setUploadedImage({ file: null, preview: null });
      setVariations([]);
      setExpandedSizes(new Set());

      success('Product saved! Refresh the shop page to see it.');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to save product';
      showError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await productsAPI.delete(id);
      success('Product deleted successfully');
      setProducts(products.filter((p) => p.id !== id));
    } catch (err: any) {
      showError('Failed to delete product');
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 md:mb-6">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display tracking-wide">Products</h1>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-8 md:py-12">
              <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 md:py-12">
              <Package className="h-10 w-10 md:h-12 md:w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm md:text-base text-muted-foreground">No products found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <img
                        src={product.imageUrl || '/placeholder-product.svg'}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded bg-muted"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.categories?.name || product.category?.name || 'Uncategorized'}</TableCell>
                    <TableCell>{formatCurrency(product.price)}</TableCell>
                    <TableCell>
                      <Badge variant={product.stock <= 5 ? 'destructive' : 'default'}>
                        {product.stock}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleOpenDialog(product)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleDelete(product.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent title={editingProduct ? 'Edit Product' : 'Add Product'} className="max-w-2xl max-h-[90vh] flex flex-col">
          {/* Scrollable form area */}
          <div className="flex-1 overflow-y-auto max-h-[calc(90vh-12rem)] pr-2">
            <form onSubmit={handleSubmit} id="product-form" className="space-y-4">
              {/* Product Name */}
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (formErrors.name) setFormErrors({ ...formErrors, name: undefined });
                  }}
                  placeholder="e.g., Silk Evening Blouse"
                  className={formErrors.name ? 'border-destructive' : ''}
                />
                {formErrors.name && (
                  <p className="text-sm text-destructive mt-1">{formErrors.name}</p>
                )}
              </div>

              {/* Category */}
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  id="category"
                  value={formData.categoryId}
                  onChange={(e) => {
                    setFormData({ ...formData, categoryId: e.target.value });
                    if (formErrors.category) setFormErrors({ ...formErrors, category: undefined });
                  }}
                  className={formErrors.category ? 'border-destructive' : ''}
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </Select>
                {formErrors.category && (
                  <p className="text-sm text-destructive mt-1">{formErrors.category}</p>
                )}
              </div>

              {/* Price & Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price (Ksh) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="1"
                    value={formData.price || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, price: parseFloat(e.target.value) || 0 });
                      if (formErrors.price) setFormErrors({ ...formErrors, price: undefined });
                    }}
                    placeholder="0.00"
                    className={formErrors.price ? 'border-destructive' : ''}
                  />
                  {formErrors.price && (
                    <p className="text-sm text-destructive mt-1">{formErrors.price}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="stock">Stock *</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => {
                      setFormData({ ...formData, stock: parseInt(e.target.value) || 0 });
                      if (formErrors.stock) setFormErrors({ ...formErrors, stock: undefined });
                    }}
                    className={formErrors.stock ? 'border-destructive' : ''}
                  />
                  {formErrors.stock && (
                    <p className="text-sm text-destructive mt-1">{formErrors.stock}</p>
                  )}
                </div>
              </div>

              {/* Product Image */}
              <div>
                <Label>Product Image (Optional)</Label>
                <ImageUpload
                  value={uploadedImage.preview}
                  onChange={handleImageChange}
                  onError={(err) => {
                    setFormErrors({ ...formErrors, image: err });
                    showError(err);
                  }}
                />
              </div>

              {/* Size & Color Variations */}
              <SizeVariationsEditor
                variations={variations}
                setVariations={setVariations}
                expandedSizes={expandedSizes}
                setExpandedSizes={setExpandedSizes}
                formErrors={formErrors.variations}
                showToast={(msg) => showError(msg)}
              />
            </form>
          </div>

          {/* Fixed footer at bottom */}
          <DialogFooter className="mt-4 pt-4 border-t shrink-0">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" form="product-form" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editingProduct ? (
                  'Update Product'
                ) : (
                  'Create Product'
                )}
              </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
