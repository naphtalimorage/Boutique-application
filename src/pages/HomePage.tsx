import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productsAPI, categoriesAPI, subCategoriesAPI } from '@/services/api';
import type { Product, Category, SubCategory, Gender } from '@/types';
import ProductCard from '@/components/ProductCard';
import HeroCarousel from '@/components/HeroCarousel';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, SlidersHorizontal, ChevronDown, Grid3X3, List } from 'lucide-react';

const GENDER_OPTIONS: { value: Gender | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'unisex', label: 'Unisex' },
  { value: 'men', label: 'Men' },
  { value: 'women', label: 'Women' },
  { value: 'kids', label: 'Kids' },
];

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [filteredSubCategories, setFilteredSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedGender, setSelectedGender] = useState<Gender | ''>(searchParams.get('gender') as Gender | '' || '');
  const [selectedSubCategory, setSelectedSubCategory] = useState(searchParams.get('subCategory') || '');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const gender = searchParams.get('gender') || '';
    const subCategory = searchParams.get('subCategory') || '';
    setSearchTerm(search);
    setSelectedCategory(category);
    setSelectedGender(gender as Gender | '');
    setSelectedSubCategory(subCategory);
  }, [searchParams]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setError(null);
        setLoading(true);
        console.log('📦 Fetching products...');
        const productsData = await productsAPI.getAll(
          searchTerm, 
          selectedCategory || undefined, 
          selectedGender || undefined,
          selectedSubCategory || undefined
        );
        console.log(`✅ Loaded ${productsData?.length || 0} products`);
        setProducts(productsData || []);
      } catch (error) {
        console.error('❌ Failed to fetch products:', error);
        setError('Failed to load products. Please check your connection and try again.');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedCategory, selectedGender, selectedSubCategory]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const [cats, subCats] = await Promise.all([
          categoriesAPI.getAll(),
          subCategoriesAPI.getAll(),
        ]);
        setCategories(cats);
        setSubCategories(subCats || []);
      } catch {
        // Subcategories endpoint might not exist on older backends
        const cats = await categoriesAPI.getAll();
        setCategories(cats);
        setSubCategories([]);
      }
    };
    fetchCategories();
  }, []);

  // Filter subcategories when category changes
  useEffect(() => {
    if (selectedCategory) {
      const filtered = subCategories.filter(sc => sc.categoryId === selectedCategory || sc.category_id === selectedCategory);
      setFilteredSubCategories(filtered);
    } else {
      setFilteredSubCategories([]);
    }
    setSelectedSubCategory('');
  }, [selectedCategory, subCategories]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    productsAPI.getAll(
      searchTerm, 
      selectedCategory || undefined, 
      selectedGender || undefined,
      selectedSubCategory || undefined
    ).then((data) => { setProducts(data); setError(null); })
      .catch(() => setError('Failed to load products.'))
      .finally(() => setLoading(false));
    categoriesAPI.getAll().then(setCategories).catch(() => {});
  };

  // Filter and sort products
  const filteredProducts = products
    .filter((p) => {
      if (inStockOnly && p.stock === 0) return false;
      if (p.price < priceRange[0] || p.price > priceRange[1]) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low': return a.price - b.price;
        case 'price-high': return b.price - a.price;
        case 'name': return a.name.localeCompare(b.name);
        default: return 0; // newest is default order
      }
    });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params: Record<string, string> = { search: searchTerm };
    if (selectedCategory) params.category = selectedCategory;
    if (selectedGender) params.gender = selectedGender;
    if (selectedSubCategory) params.subCategory = selectedSubCategory;
    setSearchParams(params);
  };

  const selectedCategoryName = categories.find(c => c.id === selectedCategory)?.name;

  return (
    <div>
      {/* Hero Carousel */}
      <HeroCarousel />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Category Banner */}
        {selectedCategory && (
        <div className="bg-gradient-to-r from-primary/10 to-accent rounded-lg p-6 mb-6 border border-primary/20">
          <h2 className="text-3xl font-bold text-foreground font-display tracking-wide">{selectedCategoryName}</h2>
          <p className="text-muted-foreground mt-1">Browse our collection of {(selectedCategoryName || '').toLowerCase()}</p>
          <button
            onClick={() => { setSelectedCategory(''); setSearchParams({}); }}
            className="mt-3 text-sm text-primary hover:underline"
          >
            ← View all categories
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-card rounded-lg border border-border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </form>

          {/* Gender Quick Filter */}
          <div className="flex items-center gap-1 flex-wrap">
            {GENDER_OPTIONS.slice(1).map((option) => (
              <Button
                key={option.value}
                variant={selectedGender === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedGender(option.value as Gender | '')}
                className="capitalize"
              >
                {option.label}
              </Button>
            ))}
          </div>

          {/* Sort & View */}
          <div className="flex items-center gap-3">
            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-40">
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name A-Z</option>
            </Select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              <ChevronDown className={`h-3 w-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            <div className="hidden md:flex items-center border border-border rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-primary text-white' : 'hover:bg-muted'}`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'hover:bg-muted'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Sub-Category</label>
              <Select 
                value={selectedSubCategory} 
                onChange={(e) => setSelectedSubCategory(e.target.value)}
                disabled={!selectedCategory}
              >
                <option value="">All Sub-Categories</option>
                {filteredSubCategories.map((subCat) => (
                  <option key={subCat.id} value={subCat.id}>{subCat.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Price Range</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={priceRange[0]}
                  onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                  className="w-24"
                  placeholder="Min"
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="number"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                  className="w-24"
                  placeholder="Max"
                />
              </div>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded border-border"
                />
                <span className="text-sm">In Stock Only</span>
              </label>
            </div>
            <div className="md:col-span-4 flex items-end justify-end">
              <button
                onClick={() => { 
                  setSelectedCategory(''); 
                  setSelectedGender('');
                  setSelectedSubCategory('');
                  setPriceRange([0, 100000]); 
                  setInStockOnly(false); 
                  setSearchParams({});
                }}
                className="text-sm text-primary hover:underline"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
          {selectedCategoryName && ` in ${selectedCategoryName}`}
          {selectedGender && ` for ${selectedGender}`}
        </p>
        {searchTerm && (
          <p className="text-sm text-muted-foreground">
            Results for "<span className="text-dark font-medium">{searchTerm}</span>"
          </p>
        )}
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="bg-card rounded-lg border overflow-hidden">
              <div className="skeleton aspect-square" />
              <div className="p-3 space-y-2">
                <div className="skeleton h-4 w-full rounded" />
                <div className="skeleton h-4 w-2/3 rounded" />
                <div className="skeleton h-6 w-1/2 rounded" />
                <div className="skeleton h-9 w-full rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-card rounded-lg border">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Unable to load products</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark transition-colors btn-press"
          >
            Try Again
          </button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-lg border">
          <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No products found</h3>
          <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
          <button
            onClick={() => { setSearchTerm(''); setSelectedCategory(''); setSearchParams({}); }}
            className="text-primary hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className={`gap-4 ${
          viewMode === 'list'
            ? 'flex flex-col'
            : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
        }`}>
          {filteredProducts.map((product) => (
            viewMode === 'list' ? (
              <ProductCard key={product.id} product={product} />
            ) : (
              <ProductCard key={product.id} product={product} />
            )
          ))}
        </div>
      )}
    </div>
  </div>
  );
}
