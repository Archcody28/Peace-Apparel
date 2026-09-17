import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, X, Grid3X3, LayoutList } from 'lucide-react';
import ProductCard from '../components/ProductCard.jsx';
import QuickViewModal from '../components/QuickViewModal.jsx';
import ScrollReveal from '../components/ScrollReveal.jsx';

const categories = [
  'All', 'Ankara', 'Senator', 'Native', 'Bridal', 'Casual', 'Corporate', 'Men', 'Women', 'Accessories'
];

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickView, setQuickView] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  const activeCategory = searchParams.get('category') || 'All';
  const searchQuery = searchParams.get('search') || '';
  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const base = import.meta.env.VITE_API_URL || '';
        const res = await fetch(base + '/api/products?limit=200');
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch) {
        setSearchParams({ search: localSearch });
      } else {
        const params = new URLSearchParams(searchParams);
        params.delete('search');
        setSearchParams(params, { replace: true });
      }
    }, 500);
        return () => clearTimeout(timer);
    // Debounce effect intentionally reacts only to localSearch changes;
    // searchParams/setSearchParams are stable router APIs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = activeCategory === 'All' ||
        (p.categories && p.categories.includes(activeCategory)) ||
        p.category === activeCategory;
      const matchesSearch = !searchQuery ||
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, activeCategory, searchQuery]);

  const setCategory = (cat) => {
    const params = new URLSearchParams(searchParams);
    if (cat === 'All') {
      params.delete('category');
    } else {
      params.set('category', cat);
    }
    setSearchParams(params);
  };

  return (
    <main className="min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-12">
          <p className="text-gold-dark uppercase tracking-[0.2em] text-xs mb-3">The Collection</p>
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-4">Shop African Luxury</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">Explore our curated selection of premium Ankara, senator wears, bridal outfits, and bespoke native fashion.</p>
        </ScrollReveal>

        <div className="sticky top-20 z-30 glass rounded-2xl p-4 mb-10 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={localSearch}
                onChange={e => setLocalSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold text-sm"
              />
              {localSearch && (
                <button
                  onClick={() => setLocalSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 rounded-xl border ${viewMode === 'grid' ? 'bg-charcoal text-white border-charcoal' : 'bg-white border-gray-200'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 rounded-xl border ${viewMode === 'list' ? 'bg-charcoal text-white border-charcoal' : 'bg-white border-gray-200'}`}
              >
                <LayoutList className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2">
            <SlidersHorizontal className="w-4 h-4 text-gold-dark flex-shrink-0" />
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                  activeCategory === cat
                    ? 'bg-charcoal text-white'
                    : 'bg-white border border-gray-200 hover:border-gold'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1'}`}>
            {[...Array(8)].map((_, i) => (
              <div key={i} className={`bg-white rounded-2xl overflow-hidden ${viewMode === 'list' ? 'flex gap-4' : ''}`}>
                <div className={`${viewMode === 'list' ? 'w-48' : 'w-full aspect-[3/4]'} skeleton`} />
                {viewMode === 'list' && <div className="flex-1 p-4 space-y-3"><div className="h-4 skeleton w-1/3 rounded" /><div className="h-6 skeleton w-2/3 rounded" /><div className="h-4 skeleton w-1/4 rounded" /></div>}
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-display text-2xl mb-2">No products found</p>
            <p className="text-gray-500">Try a different search or category.</p>
          </div>
        ) : (
          <motion.div
            layout
            className={`grid gap-6 ${viewMode === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1'}`}
          >
            <AnimatePresence>
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} onQuickView={setQuickView} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <QuickViewModal product={quickView} isOpen={!!quickView} onClose={() => setQuickView(null)} />
    </main>
  );
}
