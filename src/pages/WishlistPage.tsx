import { Link } from 'react-router-dom';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/components/ui/toast';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingCart, ArrowLeft, Trash2 } from 'lucide-react';

export default function WishlistPage() {
  const { items, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { success } = useToast();

  const handleAddAllToCart = () => {
    items.forEach((product) => {
      if (product.stock > 0) {
        addToCart(product);
      }
    });
    success(`Added available items to cart`);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-card rounded-lg border p-12 text-center">
          <Heart className="h-20 w-20 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-3xl font-bold font-display tracking-wide mb-2">Your wishlist is empty</h2>
          <p className="text-muted-foreground mb-6">Save items you love and we'll keep them here for you</p>
          <Link to="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" /> Start Shopping
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-wide">My Wishlist ({items.length} items)</h1>
          <p className="text-muted-foreground mt-1">Items you've saved for later</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleAddAllToCart}>
            <ShoppingCart className="h-4 w-4 mr-2" /> Add All to Cart
          </Button>
          <Button variant="outline" onClick={() => { clearWishlist(); success('Wishlist cleared'); }}>
            <Trash2 className="h-4 w-4 mr-2" /> Clear Wishlist
          </Button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {items.map((product) => (
          <div key={product.id} className="relative">
            <ProductCard product={product} />
            <button
              onClick={() => { removeFromWishlist(product.id); success('Removed from wishlist'); }}
              className="absolute top-2 right-2 z-10 w-8 h-8 bg-destructive text-white rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors shadow-lg"
              title="Remove from wishlist"
            >
              <Heart className="h-4 w-4 fill-white" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
