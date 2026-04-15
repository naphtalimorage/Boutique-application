import { useState, useEffect } from 'react';
import { salesAPI, productsAPI } from '@/services/api';
import type { Sale, Product, SaleCartItem } from '@/types';
import { useToast } from '@/components/ui/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Plus,
  ShoppingCart,
  Loader2,
  Download,
  Trash2,
  Minus,
  Phone,
  Banknote,
  CheckCircle,
  Palette,
  Shirt,
  RefreshCw,
} from 'lucide-react';

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cart, setCart] = useState<SaleCartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mobile_money'>('cash');
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [mobileNumber, setMobileNumber] = useState('');
  const [refreshingProducts, setRefreshingProducts] = useState(false);
  
  // Size/color selection state
  const [showSizeColorDialog, setShowSizeColorDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [sizeColorQuantity, setSizeColorQuantity] = useState(1);
  
  const { success, error: showError } = useToast();

  useEffect(() => {
    fetchData();
    
    // Refresh data when window regains focus (e.g., after completing a sale)
    const handleFocus = () => {
      fetchData();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchData = async () => {
    try {
      const [salesData, productsData] = await Promise.all([
        salesAPI.getAll(startDate || undefined, endDate || undefined),
        productsAPI.getAll(),
      ]);
      setSales(salesData);
      setProducts(productsData);
    } catch (err) {
      showError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    fetchData();
  };

  // Refresh products when dialog opens to get latest stock
  const handleDialogOpen = (open: boolean) => {
    setDialogOpen(open);
    if (open) {
      clearCart();
      refreshProducts();
    }
  };

  // Manual refresh function
  const refreshProducts = async () => {
    setRefreshingProducts(true);
    try {
      const productsData = await productsAPI.getAll();
      setProducts(productsData);
      success('Products refreshed!');
    } catch {
      showError('Failed to refresh products');
    } finally {
      setRefreshingProducts(false);
    }
  };

  // Open size/color selection dialog
  const openSizeColorDialog = (product: Product) => {
    // If product has variations, show selection dialog
    if (product.variations && product.variations.length > 0) {
      setSelectedProduct(product);
      setSelectedSize('');
      setSelectedColor('');
      setSizeColorQuantity(1);
      setShowSizeColorDialog(true);
    } else {
      // No variations, add directly to cart
      addToCart(product.id);
    }
  };

  const addToCart = (productId: string, quantity: number = 1, size?: string, color?: string) => {
    // Check if this exact combination already exists in cart
    const existing = cart.find((item) => 
      item.productId === productId && item.size === size && item.color === color
    );
    
    if (existing) {
      setCart(cart.map((item) =>
        item.productId === productId && item.size === size && item.color === color
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setCart([...cart, { productId, quantity, size, color }]);
    }
  };

  // Add product with selected size and color to cart
  const addWithSizeColor = () => {
    if (!selectedProduct || !selectedSize) {
      showError('Please select a size');
      return;
    }
    if (!selectedColor) {
      showError('Please select a color');
      return;
    }
    
    // Validate quantity against available stock
    const variation = selectedProduct.variations?.find(v => v.size === selectedSize);
    if (!variation) {
      showError('Invalid size selected');
      return;
    }
    
    const colorVariation = variation.colors.find(c => c.name === selectedColor);
    if (!colorVariation) {
      showError('Invalid color selected');
      return;
    }
    
    if (sizeColorQuantity > colorVariation.stock) {
      showError(`Only ${colorVariation.stock} available for ${selectedSize}/${selectedColor}`);
      return;
    }
    
    addToCart(selectedProduct.id, sizeColorQuantity, selectedSize, selectedColor);
    setShowSizeColorDialog(false);
    setSelectedProduct(null);
  };

  const updateCartQuantity = (productId: string, quantity: number, size?: string, color?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, size, color);
      return;
    }
    setCart(cart.map((item) =>
      item.productId === productId && item.size === size && item.color === color
        ? { ...item, quantity }
        : item
    ));
  };

  const removeFromCart = (productId: string, size?: string, color?: string) => {
    setCart(cart.filter((item) => 
      !(item.productId === productId && item.size === size && item.color === color)
    ));
  };

  const clearCart = () => {
    setCart([]);
    setMobileNumber('');
  };

  const getTotal = () => {
    return cart.reduce((total, item) => {
      const product = products.find((p) => p.id === item.productId);
      return total + (product?.price || 0) * item.quantity;
    }, 0);
  };

  const handleProceedToPayment = () => {
    if (cart.length === 0) {
      showError('Add at least one product to the cart');
      return;
    }
    setShowPaymentConfirmation(true);
  };

  const handleCompleteSale = async () => {
    // Prevent double submission
    if (submitting) return;
    
    if (paymentMethod === 'mobile_money' && !mobileNumber) {
      showError('Enter mobile money number');
      return;
    }

    setSubmitting(true);
    try {
      await salesAPI.createMulti({
        items: cart,
        paymentMethod,
      });
      success(`Sale completed! ${paymentMethod === 'mobile_money' ? 'STK push sent.' : 'Cash payment received.'}`);
      setDialogOpen(false);
      setShowPaymentConfirmation(false);
      clearCart();
      // Refresh both sales and products to show updated stock
      fetchData();
    } catch (err: any) {
      showError(err.response?.data?.error || err.message || 'Failed to record sale');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const url = await salesAPI.exportCSV();
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      success('Report exported successfully');
    } catch (err) {
      showError('Failed to export report');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-4xl font-bold font-display tracking-wide">Sales History</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => handleDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Sale
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleFilter} className="w-full">
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sales.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No sales recorded yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => {
                  const itemCount = sale.saleItems?.length || 1;
                  const itemNames = sale.saleItems
                    ? sale.saleItems.map((si) => `${si.product?.name || 'Product'} x${si.quantity}`).join(', ')
                    : `${sale.product?.name || 'Product'} x${sale.quantity}`;
                  const totalAmount = sale.totalAmount || sale.totalPrice || 0;

                  return (
                    <TableRow key={sale.id}>
                      <TableCell>{formatDate(sale.createdAt)}</TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="font-medium">{itemCount} item{itemCount > 1 ? 's' : ''}</p>
                          <p className="text-xs text-muted-foreground truncate" title={itemNames}>
                            {itemNames}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={sale.paymentMethod === 'mobile_money' ? 'default' : 'secondary'}>
                          {sale.paymentMethod === 'mobile_money' ? '📱 Mobile Money' : '💵 Cash'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            sale.status === 'paid' ? 'default' :
                            sale.status === 'pending' ? 'secondary' : 'destructive'
                          }
                        >
                          {sale.status === 'paid' ? '✓ Paid' : sale.status === 'pending' ? '⏳ Pending' : '✗ Cancelled'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-primary">
                          {formatCurrency(totalAmount)}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Total Revenue */}
      {!loading && sales.length > 0 && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">Total Revenue</span>
              <span className="text-4xl font-bold font-display tracking-wide text-primary">
                {formatCurrency(sales.reduce((sum, sale) => sum + (sale.totalAmount || sale.totalPrice || 0), 0))}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* New Sale Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogOpen}>
        <DialogContent title={showPaymentConfirmation ? 'Confirm Payment' : 'New Sale'} className="max-w-2xl md:max-w-4xl">
          {!showPaymentConfirmation ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Product Selection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Add Products</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={refreshProducts}
                      disabled={refreshingProducts}
                      className="h-8"
                    >
                      <RefreshCw className={`h-4 w-4 mr-1 ${refreshingProducts ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {products
                      .filter((p) => p.stock > 0)
                      .map((product) => {
                        const inCart = cart.find((c) => c.productId === product.id);
                        const hasVariations = product.variations && product.variations.length > 0;
                        
                        return (
                          <div
                            key={product.id}
                            className="flex flex-col p-3 bg-muted rounded-lg gap-2"
                          >
                            {/* Product Info */}
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium">{product.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatCurrency(product.price)} • Stock: {product.stock}
                                </p>
                              </div>
                              {!inCart && (
                                <Button
                                  size="sm"
                                  onClick={() => openSizeColorDialog(product)}
                                  disabled={product.stock === 0}
                                >
                                  Add
                                </Button>
                              )}
                            </div>

                            {/* Show Available Sizes and Colors */}
                            {hasVariations && (
                              <div className="space-y-1.5 mt-1">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Shirt className="h-3 w-3" />
                                  <span className="font-medium">Available:</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {product.variations?.slice(0, 4).map((variation) => (
                                    <div key={variation.size} className="flex items-center gap-1">
                                      <span className="px-2 py-0.5 bg-background rounded text-xs font-semibold border">
                                        {variation.size}
                                      </span>
                                      <div className="flex gap-0.5">
                                        {variation.colors?.slice(0, 3).map((color) => {
                                          const isLowStock = color.stock <= 5;
                                          const isOutOfStock = color.stock === 0;
                                          return (
                                            <span
                                              key={color.name}
                                              className={`px-1.5 py-0.5 rounded text-xs ${
                                                isOutOfStock
                                                  ? 'bg-gray-100 text-gray-400 line-through'
                                                  : isLowStock
                                                  ? 'bg-destructive/10 text-destructive font-semibold'
                                                  : 'bg-primary/10 text-primary'
                                              }`}
                                              title={`${color.name}: ${color.stock} left${isLowStock ? ' (Low Stock!)' : ''}`}
                                            >
                                              {color.name} ({color.stock})
                                            </span>
                                          );
                                        })}
                                        {variation.colors && variation.colors.length > 3 && (
                                          <span className="text-xs text-muted-foreground">
                                            +{variation.colors.length - 3}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                  {product.variations && product.variations.length > 4 && (
                                    <span className="text-xs text-muted-foreground self-center">
                                      +{product.variations.length - 4} more sizes
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Cart Controls */}
                            {inCart && (
                              <div className="flex items-center gap-2 justify-end">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => updateCartQuantity(product.id, inCart.quantity - 1, inCart.size, inCart.color)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <div className="text-center min-w-[60px]">
                                  <span className="font-semibold">{inCart.quantity}</span>
                                  {inCart.size && (
                                    <div className="text-xs text-muted-foreground">
                                      {inCart.size}{inCart.color ? `/${inCart.color}` : ''}
                                    </div>
                                  )}
                                </div>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => updateCartQuantity(product.id, inCart.quantity + 1, inCart.size, inCart.color)}
                                  disabled={inCart.quantity >= product.stock}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => removeFromCart(product.id, inCart.size, inCart.color)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Cart Summary */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Cart ({cart.length} items)</h3>
                  {cart.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No items added</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {cart.map((item) => {
                          const product = products.find((p) => p.id === item.productId);
                          if (!product) return null;
                          return (
                            <div key={`${item.productId}-${item.size}-${item.color}`} className="flex justify-between p-2 bg-muted rounded">
                              <div>
                                <p className="font-medium text-sm">{product.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {item.quantity} × {formatCurrency(product.price)}
                                  {item.size && (
                                    <span className="ml-1">
                                      • Size: <span className="font-semibold">{item.size}</span>
                                    </span>
                                  )}
                                  {item.color && (
                                    <span>
                                      • Color: <span className="font-semibold">{item.color}</span>
                                    </span>
                                  )}
                                </p>
                              </div>
                              <p className="font-semibold">{formatCurrency(product.price * item.quantity)}</p>
                            </div>
                          );
                        })}
                      </div>

                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold">Total</span>
                          <span className="text-2xl font-bold text-primary">{formatCurrency(getTotal())}</span>
                        </div>
                      </div>

                      <Button
                        className="w-full"
                        size="lg"
                        onClick={handleProceedToPayment}
                        disabled={cart.length === 0}
                      >
                        Proceed to Payment
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              {/* Payment Method Selection */}
              <div className="space-y-4">
                <Label>Select Payment Method</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                      paymentMethod === 'cash'
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Banknote className={`h-6 w-6 ${paymentMethod === 'cash' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="text-left">
                      <p className="font-semibold">Cash</p>
                      <p className="text-sm text-muted-foreground">Customer paid with cash</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('mobile_money')}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                      paymentMethod === 'mobile_money'
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Phone className={`h-6 w-6 ${paymentMethod === 'mobile_money' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="text-left">
                      <p className="font-semibold">Mobile Money</p>
                      <p className="text-sm text-muted-foreground">STK push to customer phone</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Mobile Money Number */}
              {paymentMethod === 'mobile_money' && (
                <div className="space-y-2">
                  <Label htmlFor="mobileNumber">Mobile Number</Label>
                  <Input
                    id="mobileNumber"
                    placeholder="e.g., 0541234567"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    An STK push will be sent to this number
                  </p>
                </div>
              )}

              {/* Order Summary */}
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <h4 className="font-semibold">Order Summary</h4>
                {cart.map((item) => {
                  const product = products.find((p) => p.id === item.productId);
                  if (!product) return null;
                  return (
                    <div key={item.productId} className="flex justify-between text-sm">
                      <span>{product.name} × {item.quantity}</span>
                      <span>{formatCurrency(product.price * item.quantity)}</span>
                    </div>
                  );
                })}
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(getTotal())}</span>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPaymentConfirmation(false)}
                >
                  Back to Cart
                </Button>
                <Button
                  onClick={handleCompleteSale}
                  disabled={submitting || (paymentMethod === 'mobile_money' && !mobileNumber)}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      {paymentMethod === 'mobile_money' ? 'Send STK Push & Complete' : 'Confirm Payment & Complete'}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Size/Color Selection Dialog */}
      <Dialog open={showSizeColorDialog} onOpenChange={setShowSizeColorDialog}>
        <DialogContent title="Select Size & Color" className="max-w-md">
          <DialogHeader>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Palette className="h-5 w-5" />
              {selectedProduct?.name}
            </h3>
            <p className="text-sm text-muted-foreground">Choose size and color for this product</p>
          </DialogHeader>

          {selectedProduct && selectedProduct.variations && (
            <div className="space-y-4">
              {/* Size Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Shirt className="h-4 w-4" />
                  Size *
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {selectedProduct.variations.map((variation) => (
                    <Button
                      key={variation.size}
                      type="button"
                      variant={selectedSize === variation.size ? 'default' : 'outline'}
                      onClick={() => {
                        setSelectedSize(variation.size);
                        setSelectedColor('');
                      }}
                      className="h-10"
                      disabled={variation.stock === 0}
                    >
                      <div className="text-center">
                        <div className="font-semibold">{variation.size}</div>
                        <div className="text-xs opacity-75">{variation.stock} left</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Color Selection */}
              {selectedSize && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Color *
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedProduct.variations
                      .find((v) => v.size === selectedSize)
                      ?.colors.map((color) => (
                        <Button
                          key={color.name}
                          type="button"
                          variant={selectedColor === color.name ? 'default' : 'outline'}
                          onClick={() => setSelectedColor(color.name)}
                          className="h-10"
                          disabled={color.stock === 0}
                        >
                          <div className="text-center">
                            <div className="font-semibold text-sm">{color.name}</div>
                            <div className="text-xs opacity-75">{color.stock} left</div>
                          </div>
                        </Button>
                      ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              {selectedColor && (
                <div className="space-y-2">
                  <Label htmlFor="size-color-quantity">Quantity</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setSizeColorQuantity(Math.max(1, sizeColorQuantity - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      id="size-color-quantity"
                      type="number"
                      min="1"
                      max={
                        selectedProduct.variations
                          ?.find((v) => v.size === selectedSize)
                          ?.colors.find((c) => c.name === selectedColor)?.stock || 1
                      }
                      value={sizeColorQuantity}
                      onChange={(e) => setSizeColorQuantity(parseInt(e.target.value) || 1)}
                      className="w-20 text-center"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const maxStock =
                          selectedProduct.variations
                            ?.find((v) => v.size === selectedSize)
                            ?.colors.find((c) => c.name === selectedColor)?.stock || 1;
                        setSizeColorQuantity(Math.min(maxStock, sizeColorQuantity + 1));
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground ml-2">
                      Available: {
                        selectedProduct.variations
                          ?.find((v) => v.size === selectedSize)
                          ?.colors.find((c) => c.name === selectedColor)?.stock || 0
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowSizeColorDialog(false);
                setSelectedProduct(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={addWithSizeColor}
              disabled={!selectedSize || !selectedColor}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
