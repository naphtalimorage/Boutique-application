import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, User, Heart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';

export default function Footer() {
  const { getCartCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const cartCount = getCartCount();

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Desktop Footer */}
      <footer className="bg-dark text-white py-12 mt-12 hidden md:block">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div>
              <h3 className="text-xl font-bold mb-4">Lin Collection</h3>
              <p className="text-gray-400 text-sm">Your one-stop shop for quality fashion items at great prices.</p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
                <li><Link to="/cart" className="hover:text-primary transition-colors">Cart</Link></li>
                <li><Link to="/wishlist" className="hover:text-primary transition-colors">Wishlist</Link></li>
                {isAuthenticated && <li><Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>}
              </ul>
            </div>

            {/* Customer Service */}
            <div>
              <h4 className="font-semibold mb-4">Customer Service</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="mailto:support@lincollection.com" className="hover:text-primary transition-colors">Contact Us</a></li>
                <li><span className="cursor-not-allowed">Shipping Info</span></li>
                <li><span className="cursor-not-allowed">Returns</span></li>
                <li><span className="cursor-not-allowed">FAQ</span></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold mb-4">Contact Us</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>📞 0800-LIN-COLL</li>
                <li>📧 support@lincollection.com</li>
                <li>🏪 Open: 9AM - 8PM</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>© {new Date().getFullYear()} Lin Collection. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t z-40">
        <div className="flex justify-around items-center py-2">
          <Link
            to="/"
            className={`flex flex-col items-center p-2 min-w-[64px] ${isActive('/') ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">Home</span>
          </Link>

          <Link
            to="/wishlist"
            className={`flex flex-col items-center p-2 min-w-[64px] relative ${isActive('/wishlist') ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <Heart className="h-5 w-5" />
            {wishlistItems.length > 0 && (
              <span className="absolute top-0 right-2 bg-primary text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {wishlistItems.length}
              </span>
            )}
            <span className="text-xs mt-1">Wishlist</span>
          </Link>

          <Link
            to="/cart"
            className={`flex flex-col items-center p-2 min-w-[64px] relative ${isActive('/cart') ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <div className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-xs mt-1">Cart</span>
          </Link>

          <Link
            to={isAuthenticated ? "/dashboard" : "/login"}
            className={`flex flex-col items-center p-2 min-w-[64px] ${isActive('/dashboard') || isActive('/login') ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <User className="h-5 w-5" />
            <span className="text-xs mt-1">{isAuthenticated ? 'Account' : 'Login'}</span>
          </Link>
        </div>
      </nav>
    </>
  );
}