import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/components/ui/toast';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Minus, Plus, Trash2, ArrowLeft } from 'lucide-react';

export default function CartPage() {
  const { items, updateQuantity, updatePrice, removeFromCart, clearCart, getCartTotal } = useCart();
  const { success } = useToast();
  const navigate = useNavigate();

  const total = getCartTotal();

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-card rounded-lg border p-12">
          <ShoppingCart className="h-20 w-20 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-3xl font-bold font-display tracking-wide mb-3">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">Looks like you haven't added anything to your cart yet</p>
          <Link to="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" /> Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Shopping Cart ({items.reduce((c, i) => c + i.quantity, 0)} items)</h1>
          <Button variant="outline" size="sm" onClick={() => { clearCart(); success('Cart cleared'); }}>
            <Trash2 className="h-4 w-4 mr-2" /> Clear Cart
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-card rounded-lg border p-4 flex gap-4">
                {/* Product Image */}
                <Link to={`/product/${item.product.id}`} className="w-24 h-24 flex-shrink-0 bg-muted rounded-md overflow-hidden">
                  <img
                    src={item.product.imageUrl || '/placeholder-product.svg'}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </Link>

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <Link to={`/product/${item.product.id}`} className="font-medium text-dark hover:text-primary transition-colors line-clamp-2">
                        {item.product.name}
                      </Link>
                      <p className="text-sm text-muted-foreground mt-1">{item.product.category?.name}</p>
                      {item.product.stock < item.quantity && (
                        <span className="inline-block mt-1 text-xs text-destructive font-medium">
                          Only {item.product.stock} available
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => { removeFromCart(item.id); success('Removed from cart'); }}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="flex items-end justify-between mt-4">
                    {/* Quantity Controls */}
                    <div className="flex items-center border rounded-md">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="px-3 py-1.5 hover:bg-muted transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={item.product.stock}
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                        className="w-14 h-8 text-center border-x text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-3 py-1.5 hover:bg-muted transition-colors"
                        disabled={item.quantity >= item.product.stock}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Price with Bargaining */}
                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-xs text-muted-foreground">Ksh</span>
                        <input
                          type="number"
                          min="1"
                          value={item.customPrice ?? item.product.price}
                          onChange={(e) => {
                            const newPrice = parseFloat(e.target.value) || 0;
                            updatePrice(item.id, newPrice > 0 ? newPrice : item.product.price);
                          }}
                          className="w-24 h-8 text-right text-sm border rounded-md px-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        {item.customPrice !== undefined && item.customPrice !== item.product.price && (
                          <button
                            type="button"
                            onClick={() => updatePrice(item.id, item.product.price)}
                            className="text-[10px] text-muted-foreground hover:text-primary underline"
                            title="Reset to original price"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                      <p className="text-lg font-bold text-primary">
                        {formatCurrency(((item.customPrice ?? item.product.price)) * item.quantity)}
                      </p>
                      {item.customPrice !== undefined && item.customPrice !== item.product.price && (
                        <p className="text-xs text-success line-through">
                          Was {formatCurrency(item.product.price)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg border p-6 sticky top-24">
              <h2 className="text-lg font-bold mb-4">Order Summary</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal ({items.reduce((c, i) => c + i.quantity, 0)} items)</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="border-t mt-4 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Total</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-primary">{formatCurrency(total)}</span>
                    <p className="text-xs text-muted-foreground">Tax included</p>
                  </div>
                </div>
              </div>

              <Button onClick={handleCheckout} className="w-full mt-6" size="lg">
                Proceed to Checkout
              </Button>

              {/* Trust Badges */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <svg className="h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  <span>Secure checkout</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <svg className="h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  <span>Instant purchase confirmation</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
