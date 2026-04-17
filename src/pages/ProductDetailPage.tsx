import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productsAPI } from '@/services/api';
import type { ColorVariation, Product, SizeVariation } from '@/types';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useToast } from '@/components/ui/toast';
import { formatCurrency } from '@/lib/utils';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShoppingCart,
  Heart,
  Share2,
  Star,
  ChevronRight,
  Store,
  Minus,
  Plus,
  Package,
  Shirt,
  Palette,
} from 'lucide-react';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [loading, setLoading] = useState(true);
  const { addToCart, isInCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { success } = useToast();

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      try {
        const data = await productsAPI.getById(id);
        setProduct(data);
        const allProducts = await productsAPI.getAll('', data.categoryId);
        setRelatedProducts(allProducts.filter((p) => p.id !== data.id).slice(0, 4));
      } catch {
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    
    // Refresh data when window regains focus (e.g., after completing a sale)
    const handleFocus = () => {
      fetchProduct();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <div className="skeleton aspect-square rounded-lg" />
          <div className="space-y-4">
            <div className="skeleton h-8 w-3/4 rounded" />
            <div className="skeleton h-4 w-1/2 rounded" />
            <div className="skeleton h-12 w-1/3 rounded" />
            <div className="skeleton h-24 w-full rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 text-center">
        <Package className="h-12 w-12 md:h-16 md:w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl md:text-2xl font-bold mb-2">Product not found</h2>
        <Link to="/" className="text-primary hover:underline">← Back to shop</Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    // If product has variations, require size and color selection
    if (product.variations && product.variations.length > 0) {
      if (!selectedSize) {
        success('Please select a size');
        return;
      }
      if (!selectedColor) {
        success('Please select a color');
        return;
      }
      
      // Check stock for the selected variation
      const variation = product.variations.find(v => v.size === selectedSize);
      if (!variation) {
        success('Invalid size selected');
        return;
      }
      
      const colorVariation = variation.colors.find(c => c.name === selectedColor);
      if (!colorVariation) {
        success('Invalid color selected');
        return;
      }
      
      if (quantity > colorVariation.stock) {
        success(`Only ${colorVariation.stock} available for ${selectedSize}/${selectedColor}`);
        return;
      }
      
      // Add to cart with size and color
      addToCart(product, quantity, selectedSize, selectedColor);
      success(`Added ${quantity} × ${product.name} (${selectedSize}/${selectedColor}) to cart`);
    } else {
      // No variations, add directly
      if (product.stock > 0) {
        for (let i = 0; i < quantity; i++) {
          addToCart(product);
        }
        success(`Added ${quantity} × ${product.name} to cart`);
      }
    }
  };

  const ratings = Array.from(product.id).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 200 + 50;
  const soldCount = Array.from(product.id).reduce((sum, char) => sum + char.charCodeAt(0) * 2, 0) % 500 + 100;

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/cart');
  };

  const getVariationStock = (variation: SizeVariation) =>
    Array.isArray(variation.colors) && variation.colors.length > 0
      ? variation.colors.reduce((sum: number, color: ColorVariation) => sum + (color.stock || 0), 0)
      : variation.stock || 0;

  const availableStock = product.variations && product.variations.length > 0
    ? product.variations.reduce((sum, variation) => sum + getVariationStock(variation), 0)
    : product.stock;

  const availableVariations = product.variations?.filter((variation) => getVariationStock(variation) > 0) ?? [];
  const selectedVariation = selectedSize
    ? product.variations?.find((variation) => variation.size === selectedSize)
    : undefined;
  const selectedColorOption = selectedVariation?.colors?.find((color) => color.name === selectedColor);
  const selectedVariationStock = selectedVariation ? getVariationStock(selectedVariation) : 0;
  const selectedColorStock = selectedColorOption?.stock ?? 0;

  const discount = product.id.charCodeAt(0) % 15 + 10;
  const originalPrice = Math.round(product.price * (1 + discount / 100));

  return (
    <div className="bg-card">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-3">
        <nav className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
          <Link to={`/?category=${product.categoryId}`} className="hover:text-primary transition-colors truncate">
            {product.category?.name || 'Products'}
          </Link>
          <ChevronRight className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
          <span className="text-dark truncate max-w-[150px] sm:max-w-xs">{product.name}</span>
        </nav>
      </div>

      {/* Product Detail */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 md:pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square bg-muted rounded-lg overflow-hidden border">
              <img
                src={product.imageUrl || '/placeholder-product.svg'}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-4 md:space-y-6">
            {/* Brand/Category */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs sm:text-sm">{product.category?.name}</Badge>
              {product.subCategory?.name && (
                <Badge variant="outline" className="text-xs sm:text-sm">{product.subCategory?.name}</Badge>
              )}
              {product.gender && product.gender !== 'unisex' && (
                <Badge variant="secondary" className="text-xs sm:text-sm capitalize">{product.gender}</Badge>
              )}
              {availableStock > 0 && availableStock <= 5 && (
                <Badge className="bg-warning text-white text-xs sm:text-sm">⚡ Only {availableStock} left</Badge>
              )}
              {availableStock === 0 && <Badge className="bg-muted0 text-xs sm:text-sm">SOLD OUT</Badge>}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-dark font-display tracking-wide">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3 w-3 md:h-4 md:w-4 fill-warning text-warning" />
                ))}
              </div>
              <span className="text-xs md:text-sm text-muted-foreground">
                {ratings} ratings • {soldCount} sold
              </span>
            </div>

            {/* Price */}
            <div className="bg-muted p-3 md:p-4 rounded-lg">
              <div className="flex items-baseline gap-2 md:gap-3 flex-wrap">
                <span className="text-2xl md:text-3xl font-bold text-primary">{formatCurrency(product.price)}</span>
                {discount > 10 && (
                  <>
                    <span className="text-sm md:text-lg text-muted-foreground line-through">{formatCurrency(originalPrice)}</span>
                    <Badge className="bg-primary text-white text-xs">-{discount}% OFF</Badge>
                  </>
                )}
              </div>
              {discount > 10 && (
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  You save {formatCurrency(originalPrice - product.price)}
                </p>
              )}
            </div>

            {/* Size Selection */}
            {product.variations && product.variations.length > 0 && (
              <div className="space-y-2 md:space-y-3">
                <div className="flex items-center gap-2">
                  <Shirt className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  <span className="text-xs md:text-sm font-medium">Size: <span className="text-destructive">*</span></span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {availableVariations.map((variation) => {
                    const variationStock = getVariationStock(variation);
                    return (
                      <button
                        key={variation.size}
                        onClick={() => {
                          setSelectedSize(variation.size);
                          setSelectedColor(''); // Reset color when size changes
                        }}
                        disabled={variationStock === 0}
                        className={`p-2 md:p-3 rounded-lg border-2 transition-all text-center min-h-[44px] ${
                          selectedSize === variation.size
                            ? 'border-primary bg-primary/5'
                            : variationStock === 0
                            ? 'border-muted bg-muted/50 cursor-not-allowed opacity-50'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="font-semibold text-xs md:text-sm">{variation.size}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 md:mt-1">
                          {variationStock > 0 ? `${variationStock} left` : 'Sold out'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {selectedSize && product.variations && (
              <div className="space-y-2 md:space-y-3">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  <span className="text-xs md:text-sm font-medium">Color: <span className="text-destructive">*</span></span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {selectedVariation?.colors
                    ?.filter((color) => color.stock > 0)
                    .map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setSelectedColor(color.name)}
                        disabled={color.stock === 0}
                        className={`p-2 md:p-3 rounded-lg border-2 transition-all text-center min-h-[44px] ${
                          selectedColor === color.name
                            ? 'border-primary bg-primary/5'
                            : color.stock === 0
                            ? 'border-muted bg-muted/50 cursor-not-allowed opacity-50'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="font-semibold text-xs md:text-sm">{color.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 md:mt-1">
                          {color.stock > 0 ? `${color.stock} left` : 'Sold out'}
                        </div>
                      </button>
                    )) || []}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center gap-3 md:gap-4 flex-wrap">
              <span className="text-xs md:text-sm font-medium text-dark">Quantity:</span>
              <div className="flex items-center border rounded-md">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-2 md:px-3 py-2 hover:bg-muted transition-colors min-h-[44px]"
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-3 md:px-4 py-2 border-x font-medium min-w-[3rem] text-center text-sm md:text-base">{quantity}</span>
                <button
                  onClick={() => {
                    const maxStock = selectedSize && selectedColor
                      ? selectedColorStock
                      : selectedVariationStock || availableStock;
                    setQuantity(Math.min(maxStock, quantity + 1));
                  }}
                  className="px-2 md:px-3 py-2 hover:bg-muted transition-colors min-h-[44px]"
                  disabled={
                    quantity >= (selectedSize && selectedColor
                      ? selectedColorStock
                      : selectedVariationStock || availableStock)
                  }
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <span className="text-xs md:text-sm text-muted-foreground">
                {selectedSize && selectedColor
                  ? `${selectedColorStock} available for ${selectedSize}/${selectedColor}`
                  : selectedSize
                  ? `${selectedVariationStock} available for ${selectedSize}`
                  : `${availableStock} available`
                }
              </span>
            </div>

            {/* Actions - Mobile-friendly with wrap */}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleAddToCart}
                disabled={availableStock === 0 || (product.variations && (!selectedSize || !selectedColor))}
                variant={isInCart(product.id) ? 'outline' : 'default'}
                size="lg"
                className={`flex-1 min-w-[140px] ${isInCart(product.id) ? 'text-success border-success' : ''}`}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {isInCart(product.id) ? '✓ In Cart' : 'Add to Cart'}
              </Button>
              <Button
                onClick={handleBuyNow}
                disabled={availableStock === 0 || (product.variations && (!selectedSize || !selectedColor))}
                className="flex-1 min-w-[140px] bg-secondary hover:bg-secondary/90"
                size="lg"
              >
                Buy Now
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="min-w-[44px] min-h-[44px]"
                onClick={() => toggleWishlist(product)}
              >
                <Heart className={`h-5 w-5 ${isInWishlist(product.id) ? 'fill-primary text-primary' : ''}`} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="min-w-[44px] min-h-[44px]"
                onClick={() => {
                  const url = window.location.href;
                  if (navigator.share) {
                    navigator.share({ title: product.name, url });
                  } else {
                    navigator.clipboard.writeText(url);
                    success('Link copied to clipboard!');
                  }
                }}
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>

            {/* In-Store Purchase Info */}
            <div className="border-t pt-3 md:pt-4 mt-3 md:mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-muted rounded-lg">
                  <Store className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-xs md:text-sm font-medium">In-Store Pickup</p>
                    <p className="text-xs text-muted-foreground">Available now</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-muted rounded-lg">
                  <Package className="h-4 w-4 md:h-5 md:w-5 text-success flex-shrink-0" />
                  <div>
                    <p className="text-xs md:text-sm font-medium">Ready Immediately</p>
                    <p className="text-xs text-muted-foreground">No waiting</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Seller Info */}
            <div id="seller-info" className="border rounded-lg p-3 md:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Store className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm md:text-base font-medium">Lin Collection Store</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">98% positive ratings</span>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" className="self-start sm:self-auto" onClick={() => {
                const el = document.getElementById('seller-info');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}>Visit Store</Button>
            </div>
          </div>
        </div>

        {/* Product Description */}
        <div className="mt-8 md:mt-12 border-t pt-6 md:pt-8">
          <h2 className="text-lg md:text-xl font-bold mb-4">Product Description</h2>
          <div className="prose max-w-none text-muted-foreground text-sm md:text-base">
            <p>{product.name} - Premium quality product from our exclusive collection. Crafted with attention to detail and designed for comfort and style.</p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Premium quality materials</li>
              <li>Comfortable and stylish design</li>
              <li>Perfect for everyday use</li>
              <li>Easy to care and maintain</li>
              <li>Available in multiple sizes</li>
            </ul>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-8 md:mt-12 border-t pt-6 md:pt-8">
            <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
