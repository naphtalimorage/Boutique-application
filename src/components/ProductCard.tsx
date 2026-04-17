import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useToast } from '@/components/ui/toast';
import { formatCurrency } from '@/lib/utils';
import { Heart, ShoppingCart, Star, Zap, Eye } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart, isInCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { success } = useToast();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  // Generate realistic discount
  const discount = product.id.charCodeAt(0) % 40 + 5;
  const originalPrice = Math.round(product.price * (1 + discount / 100));
  const hasDiscount = discount > 15;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isNew = product.stock > 20;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock > 0) {
      addToCart(product);
      success(`${product.name} added to cart`);
    }
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const reviews = useMemo(
    () => Array.from(product.id).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 150 + 20,
    [product.id]
  );

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/product/${product.id}`);
  };

  return (
    <div
      className="group relative bg-white rounded-lg overflow-hidden border border-gray-100 hover:border-primary/30 transition-all duration-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <Link to={`/product/${product.id}`} className="relative block aspect-square overflow-hidden bg-white">
        {(() => {
          const imgUrl = product.imageUrl || product.image_url;
          const hasImage = imgUrl && typeof imgUrl === 'string' && imgUrl.length > 10 && imgUrl.startsWith('http');

          if (hasImage) {
            return (
              <img
                key={imgUrl}
                src={imgUrl}
                alt={product.name}
                className="w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                crossOrigin="anonymous"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  if (!img.dataset.fallback) {
                    img.dataset.fallback = 'true';
                    img.src = '/placeholder-product.svg';
                    img.className = 'w-full h-full object-contain p-4';
                  }
                }}
              />
            );
          }
          return (
            <img
              src="/placeholder-product.svg"
              alt={product.name}
              className="w-full h-full object-contain p-4"
              loading="lazy"
            />
          );
        })()}

        {/* Badges */}
        <div className="absolute top-0 left-0 flex flex-col gap-1 p-2">
          {hasDiscount && (
            <span className="inline-flex items-center px-2 py-0.5 bg-primary text-white text-xs font-bold rounded-sm">
              -{discount}%
            </span>
          )}
          {isNew && (
            <span className="inline-flex items-center px-2 py-0.5 bg-success text-white text-xs font-bold rounded-sm">
              NEW
            </span>
          )}
          {product.gender && product.gender !== 'unisex' && (
            <span className="inline-flex items-center px-2 py-0.5 bg-secondary text-white text-xs font-bold rounded-sm capitalize">
              {product.gender}
            </span>
          )}
        </div>

        {/* Quick Actions Overlay - Desktop hover, Mobile always visible */}
        <div className={`absolute inset-0 bg-black/20 transition-opacity duration-300 opacity-100 md:opacity-0 ${isHovered ? 'md:opacity-100' : ''}`}>
          <div className="absolute right-2 top-2 flex flex-col gap-2">
            <button
              onClick={handleToggleWishlist}
              className="w-11 h-11 md:w-8 md:h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary hover:text-white transition-colors active:scale-95"
              title="Add to Wishlist"
            >
              <Heart className={`h-5 w-5 md:h-4 md:w-4 transition-colors ${isInWishlist(product.id) ? 'fill-primary text-primary' : 'text-gray-600'}`} />
            </button>
            <button
              onClick={handleQuickView}
              className="w-11 h-11 md:w-8 md:h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary hover:text-white transition-colors active:scale-95"
              title="Quick View"
            >
              <Eye className="h-5 w-5 md:h-4 md:w-4 text-gray-600" />
            </button>
          </div>

          {/* Low Stock Warning */}
          {isLowStock && (
            <div className="absolute bottom-2 left-2 right-2">
              <div className="bg-warning/90 text-white text-xs font-medium px-2 py-1 rounded flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Only {product.stock} left!
              </div>
            </div>
          )}

          {/* Out of Stock Overlay */}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-white text-dark px-4 py-2 text-sm font-bold rounded">OUT OF STOCK</span>
            </div>
          )}
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-3">
        {/* Product Name */}
        <Link to={`/product/${product.id}`} className="block">
          <h3 className="text-sm text-gray-800 hover:text-primary transition-colors font-display line-clamp-2 leading-snug min-h-[2.5rem]">
            {product.name}
          </h3>
        </Link>

        {/* Rating & Reviews */}
        <div className="flex items-center gap-1.5 mt-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${i < 4 ? 'fill-warning text-warning' : 'fill-gray-200 text-gray-200'}`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">({reviews})</span>
        </div>

        {/* Price Section */}
        <div className="mt-2.5">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-xl font-bold text-primary">
              {formatCurrency(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">
                {formatCurrency(originalPrice)}
              </span>
            )}
          </div>
          {hasDiscount && (
            <div className="mt-1 flex items-center gap-1 text-xs text-success font-medium">
              <span className="bg-success/10 px-1.5 py-0.5 rounded">
                Save {formatCurrency(originalPrice - product.price)}
              </span>
            </div>
          )}
        </div>

        {/* Add to Cart Button - Mobile-friendly touch target */}
        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className={`w-full mt-3 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 min-h-[44px] md:h-9 active:scale-[0.98] ${
            product.stock === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : isInCart(product.id)
              ? 'bg-success/10 text-success hover:bg-success/20 border border-success/30'
              : 'bg-primary text-white hover:bg-primary-dark'
          }`}
        >
          {product.stock === 0 ? (
            <span className="flex items-center gap-1">
              <ShoppingCart className="h-4 w-4" />
              Sold Out
            </span>
          ) : isInCart(product.id) ? (
            <span className="flex items-center gap-1">
              <ShoppingCart className="h-4 w-4" />
              In Cart
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <ShoppingCart className="h-4 w-4" />
              Add to Cart
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
