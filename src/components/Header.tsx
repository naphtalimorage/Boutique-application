import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { categoriesAPI } from '@/services/api';
import type { Category } from '@/types';
import ThemeToggle from '@/components/ThemeToggle';
import {
  ShoppingCart,
  Heart,
  User,
  Search,
  Menu,
  X,
  ChevronDown,
  Store,
  LogOut,
  LayoutDashboard,
} from 'lucide-react';

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const { getCartCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    categoriesAPI.getAll().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (selectedCategory) params.set('category', selectedCategory);
    navigate(`/?${params.toString()}`);
  };

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    setCategoryDropdownOpen(false);
    const catName = catId ? categories.find(c => c.id === catId)?.name : '';
    console.log('Category selected:', catName);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const cartCount = getCartCount();
  const selectedCategoryName = selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : null;

  return (
    <header className={`sticky top-0 z-50 transition-shadow duration-300 ${scrolled ? 'shadow-lg' : 'shadow-md'}`}>
      {/* Top Bar */}
      <div className="bg-dark text-white text-xs py-2">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <span>🏪 Visit Lin Collection - Open today 9AM - 8PM</span>
          <div className="hidden md:flex items-center gap-4">
            <a href="mailto:support@lincollection.com" className="hover:text-primary transition-colors">Help & Support</a>
            <span className="text-muted-foreground">|</span>
            <span className="text-gray-300">📞 0800-LIN-COLL</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-3 md:gap-4 py-3">
            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden flex-shrink-0 p-1 text-foreground hover:text-primary"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-9 h-9 md:w-10 md:h-10 bg-primary rounded-lg flex items-center justify-center">
                <Store className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg md:text-xl font-bold text-foreground leading-tight font-display tracking-wide">Lin Collection</h1>
              </div>
            </Link>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-xl lg:max-w-2xl">
              <div className="flex w-full border-2 border-primary rounded-lg overflow-hidden">
                {/* Category Dropdown */}
                <div ref={dropdownRef} className="relative hidden lg:block">
                  <button
                    type="button"
                    className="h-10 px-3 bg-muted border-r border-border text-sm text-foreground hover:bg-muted/80 flex items-center gap-1 whitespace-nowrap"
                    onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                  >
                    {selectedCategoryName || 'All Categories'}
                    <ChevronDown className="h-3 w-3 opacity-70" />
                  </button>
                  {categoryDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-card border border-border rounded-lg shadow-xl py-1 z-50 animate-scale-in">
                      <button
                        type="button"
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                        onClick={() => handleCategorySelect('')}
                      >
                        All Categories
                      </button>
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                            selectedCategory === cat.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'
                          }`}
                          onClick={() => handleCategorySelect(cat.id)}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Search products, brands and categories"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 h-10 px-3 md:px-4 text-sm focus:outline-none bg-card text-foreground placeholder:text-muted-foreground"
                />
                <button type="submit" className="h-10 px-4 md:px-6 bg-primary text-white hover:bg-primary-dark transition-colors">
                  <Search className="h-4 w-4 md:h-5 md:w-5" />
                </button>
              </div>
            </form>

            {/* Actions */}
            <div className="flex items-center gap-1 md:gap-3 ml-auto">
              {/* Theme Toggle */}
              <div className="flex items-center">
                <ThemeToggle />
              </div>

              {/* Account - Click on mobile, hover on desktop */}
              <div className="relative group">
                <button 
                  className="flex items-center gap-1 text-foreground hover:text-primary transition-colors p-2 min-h-[44px] min-w-[44px]"
                  onClick={() => {}}  // Click handled by hover on desktop, always accessible on mobile
                >
                  <User className="h-5 w-5" />
                  <span className="hidden md:inline text-sm font-medium">
                    {isAuthenticated ? user?.name?.split(' ')[0] || 'Account' : 'Account'}
                  </span>
                </button>
                {/* Mobile: Always visible dropdown, Desktop: Hover */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-lg shadow-xl py-1 md:opacity-0 md:invisible md:group-hover:opacity-100 md:group-hover:visible transition-all duration-200 z-50 opacity-100 visible md:hidden">
                  {isAuthenticated ? (
                    <>
                      <Link to="/dashboard" className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-muted transition-colors min-h-[44px]">
                        <LayoutDashboard className="h-4 w-4" /> Dashboard
                      </Link>
                      <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-3 text-sm hover:bg-muted transition-colors text-destructive min-h-[44px]">
                        <LogOut className="h-4 w-4" /> Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="block px-4 py-3 text-sm hover:bg-muted transition-colors min-h-[44px]">Sign In</Link>
                      <Link to="/register" className="block px-4 py-3 text-sm hover:bg-muted transition-colors min-h-[44px]">Create Account</Link>
                    </>
                  )}
                </div>
              </div>

              {/* Wishlist */}
              <Link to="/wishlist" className="relative flex items-center p-1 text-foreground hover:text-primary transition-colors">
                <Heart className="h-5 w-5" />
                {wishlistItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {wishlistItems.length}
                  </span>
                )}
                <span className="hidden md:inline text-sm font-medium ml-1">Wishlist</span>
              </Link>

              {/* Cart */}
              <Link to="/cart" className="relative flex items-center p-1 text-foreground hover:text-primary transition-colors">
                <div className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="hidden md:inline text-sm font-medium ml-1">Cart</span>
              </Link>
            </div>
          </div>

          {/* Mobile Search */}
          <form onSubmit={handleSearch} className="pb-3 md:hidden">
            <div className="flex w-full border-2 border-primary rounded-lg overflow-hidden">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 h-10 px-4 text-sm focus:outline-none bg-card text-foreground placeholder:text-muted-foreground"
              />
              <button type="submit" className="h-10 px-4 bg-primary text-white">
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Category Nav */}
      <nav className="bg-card border-b hidden md:block">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-1 py-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => { setSelectedCategory(''); navigate('/'); }}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                !selectedCategory ? 'bg-primary text-white' : 'text-foreground hover:bg-muted'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategory(cat.id); navigate(`/?category=${cat.id}`); }}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === cat.id ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {cat.name}
              </button>
            ))}
            <Link to="/?deals=true" className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors whitespace-nowrap">
              🔥 Top Deals
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-72 bg-card shadow-xl overflow-y-auto">
            <div className="p-4 bg-dark text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  {isAuthenticated ? (
                    <>
                      <p className="font-medium">{user?.name}</p>
                      <p className="text-sm text-gray-300">{user?.email}</p>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="font-medium hover:underline" onClick={() => setMobileMenuOpen(false)}>
                        Sign In
                      </Link>
                      <p className="text-sm text-gray-300">for the best experience</p>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 border-b">
              <h3 className="font-medium mb-2">Categories</h3>
              <div className="space-y-1">
                <button
                  onClick={() => { setSelectedCategory(''); navigate('/'); setMobileMenuOpen(false); }}
                  className="block w-full text-left py-2 px-2 rounded text-foreground hover:bg-muted transition-colors"
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat.id); navigate(`/?category=${cat.id}`); setMobileMenuOpen(false); }}
                    className={`block w-full text-left py-2 px-2 rounded transition-colors ${
                      selectedCategory === cat.id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 space-y-1">
              <Link to="/wishlist" className="flex items-center gap-3 py-2.5 text-foreground hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>
                <Heart className="h-5 w-5" /> Wishlist ({wishlistItems.length})
              </Link>
              <Link to="/cart" className="flex items-center gap-3 py-2.5 text-foreground hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>
                <ShoppingCart className="h-5 w-5" /> Cart ({cartCount} items)
              </Link>
              {isAuthenticated && (
                <Link to="/dashboard" className="flex items-center gap-3 py-2.5 text-foreground hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  <LayoutDashboard className="h-5 w-5" /> Dashboard
                </Link>
              )}
              <div className="flex items-center gap-3 py-2.5 mt-2 pt-2 border-t">
                <span className="text-sm text-foreground">Dark Mode</span>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
