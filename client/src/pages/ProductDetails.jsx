import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, ShoppingBag, Heart, Share2, Ruler, Check } from 'lucide-react';
import { useCart } from '../contexts/CartContext.jsx';
import ImageGallery from '../components/ImageGallery.jsx';
import ProductCard from '../components/ProductCard.jsx';
import ScrollReveal from '../components/ScrollReveal.jsx';
import { formatCurrency } from '../lib/utils.js';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products`);
        const allProducts = await res.json();
        const found = allProducts.find(p => p.id === id || p.id.toString() === id);
        setProduct(found || null);
        if (found) {
          setRelated(allProducts.filter(p => p.id !== found.id && p.categories?.some(c => found.categories?.includes(c))).slice(0, 4));
          setSelectedSize(found.sizes?.[0] || '');
          setSelectedColor(found.colors?.[0] || '');

          const viewed = JSON.parse(localStorage.getItem('pa_recently_viewed') || '[]');
          const updated = [found, ...viewed.filter(p => p.id !== found.id)].slice(0, 6);
          localStorage.setItem('pa_recently_viewed', JSON.stringify(updated));
          setRecentlyViewed(updated.slice(1));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, quantity, selectedSize, selectedColor);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <main className="min-h-screen pt-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="aspect-[3/4] rounded-3xl skeleton" />
          <div className="space-y-6">
            <div className="h-8 skeleton w-1/3 rounded" />
            <div className="h-12 skeleton w-2/3 rounded" />
            <div className="h-6 skeleton w-1/4 rounded" />
            <div className="h-32 skeleton w-full rounded" />
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen pt-28 px-4 text-center">
        <p className="font-display text-2xl mb-4">Product not found</p>
        <button onClick={() => navigate('/products')} className="text-gold-dark font-semibold">Back to Collection</button>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold mb-8 hover:text-gold-dark transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 mb-24">
          <ScrollReveal>
            <ImageGallery images={product.images || [product.image]} productName={product.name} />
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <div className="lg:py-8">
              <p className="text-gold-dark uppercase tracking-[0.2em] text-xs mb-3">{product.categories?.join(' / ')}</p>
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">{product.name}</h1>
              <div className="flex items-center gap-4 mb-6">
                <span className="text-3xl font-bold">{formatCurrency(product.price)}</span>
                {product.oldPrice && (
                  <span className="text-xl text-gray-400 line-through">{formatCurrency(product.oldPrice)}</span>
                )}
                {product.stock > 0 ? (
                  <span className="text-xs font-bold uppercase tracking-wider text-green-600 bg-green-50 px-3 py-1 rounded-full">In Stock</span>
                ) : (
                  <span className="text-xs font-bold uppercase tracking-wider text-red-600 bg-red-50 px-3 py-1 rounded-full">Sold Out</span>
                )}
              </div>

              <p className="text-gray-600 leading-relaxed mb-8">{product.description}</p>

              {product.sizes?.length > 0 && (
                <div className="mb-6">
                  <label className="text-xs uppercase tracking-wider font-semibold mb-3 block">Select Size</label>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-5 py-2.5 rounded-xl text-sm border transition-all ${
                          selectedSize === size
                            ? 'bg-charcoal text-white border-charcoal'
                            : 'bg-white border-gray-200 hover:border-gold'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {product.colors?.length > 0 && (
                <div className="mb-6">
                  <label className="text-xs uppercase tracking-wider font-semibold mb-3 block">Select Color</label>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map(color => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-5 py-2.5 rounded-xl text-sm border transition-all ${
                          selectedColor === color
                            ? 'bg-charcoal text-white border-charcoal'
                            : 'bg-white border-gray-200 hover:border-gold'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center border border-gray-200 rounded-xl bg-white">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-4 hover:bg-gray-50 rounded-l-xl">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
                  <button onClick={() => setQuantity(q => q + 1)} className="p-4 hover:bg-gray-50 rounded-r-xl">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className={`flex-1 py-4 rounded-xl font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-all ${
                    added
                      ? 'bg-green-600 text-white'
                      : 'bg-charcoal text-white hover:bg-gold hover:text-charcoal'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {added ? <><Check className="w-4 h-4" /> Added</> : <><ShoppingBag className="w-4 h-4" /> Add to Cart</>}
                </button>
                <button className="p-4 border border-gray-200 rounded-xl hover:bg-gold hover:border-gold transition-colors">
                  <Heart className="w-5 h-5" />
                </button>
                <button className="p-4 border border-gray-200 rounded-xl hover:bg-gold hover:border-gold transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <Ruler className="w-4 h-4 text-gold" />
                  <span className="font-semibold text-sm">Measurements Guide</span>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Not sure about your size? Our pieces are tailored to standard Nigerian sizing. For custom fits, book a fitting or provide your measurements in cm during checkout.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <section className="mb-24">
            <ScrollReveal className="mb-10">
              <h2 className="font-display text-3xl font-bold">You May Also Like</h2>
            </ScrollReveal>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        {/* Recently Viewed */}
        {recentlyViewed.length > 0 && (
          <section>
            <ScrollReveal className="mb-10">
              <h2 className="font-display text-3xl font-bold">Recently Viewed</h2>
            </ScrollReveal>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentlyViewed.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
