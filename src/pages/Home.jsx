import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight, Sparkles, Scissors, Crown, Gem,
  Calendar, Mail, ChevronDown, Play, Heart
} from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal.jsx';
import ProductCard from '../components/ProductCard.jsx';
import QuickViewModal from '../components/QuickViewModal.jsx';
import TestimonialWall from '../components/TestimonialWall.jsx';
import { formatCurrency } from '../lib/utils.js';

const services = [
  { icon: Scissors, title: 'Bespoke Tailoring', desc: 'Precision-cut garments tailored to your exact measurements and style.' },
  { icon: Crown, title: 'Bridal & Occasion', desc: 'Show-stopping bridal asoebi and occasion outfits crafted for unforgettable moments.' },
  { icon: Gem, title: 'Custom Fittings', desc: 'One-on-one fittings ensuring every stitch celebrates your silhouette.' },
  { icon: Sparkles, title: 'Ready-to-Wear', desc: 'Curated luxury pieces available for immediate delivery across Nigeria.' },
];

const faqs = [
  { q: 'How long does custom tailoring take?', a: 'Custom pieces typically take 7-14 business days depending on complexity. Bridal and occasion outfits may require 3-6 weeks.' },
  { q: 'Do you offer nationwide delivery?', a: 'Yes! We offer pickup in Aba, doorstep delivery within Aba (+₦3,000), and waybill delivery to Lagos motor parks.' },
  { q: 'Can I book a fitting appointment?', a: 'Absolutely. Use the Book a Fitting button or contact us via WhatsApp to schedule your private fitting.' },
  { q: 'What sizes do you carry?', a: 'Our ready-to-wear ranges from XS to 3XL. Custom orders are made to your exact measurements.' },
];

const defaultTestimonials = () => [
  { id: 1, name: 'Ngozi Okafor', location: 'Lagos', content: 'Peace Apparel made my wedding dress dreams come true. The attention to detail was impeccable.', rating: 5, service: 'Bridal' },
  { id: 2, name: 'Chidi Obi', location: 'Abuja', content: 'My senator wear received compliments all evening. Fit like a glove and the fabric quality is top notch.', rating: 5, service: 'Senator Wear' },
  { id: 3, name: 'Amara Nwosu', location: 'Aba', content: 'The Ankara styles are always unique. I have never worn the same design as anyone else at an event.', rating: 5, service: 'Ankara' },
  { id: 4, name: 'Emeka Ibe', location: 'Port Harcourt', content: 'Professional fitting session, great customer service, and delivery was prompt.', rating: 5, service: 'Custom Fitting' },
  { id: 5, name: 'Zainab Yusuf', location: 'Kano', content: 'The asoebi set for my sister\'s wedding was absolutely stunning. Everyone asked where I got it.', rating: 5, service: 'Bridal' },
  { id: 6, name: 'Tochi Eze', location: 'Enugu', content: 'Luxury quality at fair prices. I am a returning customer for life.', rating: 5, service: 'Ready-to-Wear' },
];

const lookbook = [
  '/images/bridal-style.jpg',
  '/images/ankara-style.jpg',
  '/images/fashion-portrait.jpg',
  '/images/senator-wear.jpg',
  '/images/native-wear.jpg',
  '/images/accessories.jpg',
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [homeFeatures, setHomeFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickView, setQuickView] = useState(null);
  const [openFaq, setOpenFaq] = useState(0);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const base = import.meta.env.VITE_API_URL || '';
        const [prodRes, featRes, testRes, hfRes] = await Promise.all([
          fetch(base + '/api/products?limit=8'),
          fetch(base + '/api/products?featured=true&limit=4'),
          fetch(base + '/api/testimonials'),
          fetch(base + '/api/homepage-features'),
        ]);
        const [prods, feats, tests, hfs] = await Promise.all([
          prodRes.json(), featRes.json(), testRes.json(), hfRes.json(),
        ]);
        setProducts(prods);
        setFeatured(feats.length ? feats : prods.slice(0, 4));
        setTestimonials(tests.length ? tests : defaultTestimonials());
        setHomeFeatures(hfs);
      } catch (err) {
        console.error(err);
        setTestimonials(defaultTestimonials());
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <main className="overflow-hidden">
      {/* Hero */}
      <section ref={heroRef} className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden">
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="absolute inset-0 z-0"
        >
          <img
            src="https://images.pexels.com/photos/5706273/pexels-photo-5706273.jpeg?auto=compress&cs=tinysrgb&w=1920"
            alt="Luxury African Fashion"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-cream" />
        </motion.div>

        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gold-light uppercase tracking-[0.3em] text-sm mb-4"
          >
            Luxury African Fashion
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="font-display text-5xl sm:text-7xl md:text-8xl font-bold leading-[0.95] mb-6"
          >
            Wear Your<br />
            <span className="text-gradient-gold">Heritage</span> With Pride
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto"
          >
            Bespoke tailoring, vibrant Ankara, and luxury native wear crafted for the modern African elite.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/contact"
              className="px-8 py-4 bg-gradient-gold text-charcoal font-bold uppercase tracking-wider text-sm rounded-full hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" /> Book a Fitting
            </Link>
            <Link
              to="/products"
              className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/30 text-white font-bold uppercase tracking-wider text-sm rounded-full hover:bg-white hover:text-charcoal transition-all flex items-center justify-center gap-2"
            >
              Shop Collection <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/70 animate-bounce"
        >
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </section>

      {/* Services */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <ScrollReveal className="text-center mb-16">
          <p className="text-gold-dark uppercase tracking-[0.2em] text-xs mb-3">What We Do</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold">Our Craft</h2>
        </ScrollReveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, i) => (
            <ScrollReveal key={service.title} delay={i * 0.1}>
              <div className="group bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 h-full">
                <div className="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center mb-6 group-hover:bg-gold transition-colors">
                  <service.icon className="w-7 h-7 text-gold-dark group-hover:text-charcoal transition-colors" />
                </div>
                <h3 className="font-display text-xl font-bold mb-3">{service.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{service.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Featured Ankara */}
      <section className="py-24 bg-champagne">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <p className="text-gold-dark uppercase tracking-[0.2em] text-xs mb-3">Editor&apos;s Pick</p>
              <h2 className="font-display text-4xl md:text-5xl font-bold">Featured Ankara Styles</h2>
            </div>
            <Link to="/products?category=Ankara" className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 hover:text-gold-dark transition-colors">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </ScrollReveal>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => <div key={i} className="aspect-[3/4] rounded-2xl skeleton" />)}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map(product => (
                <ProductCard key={product.id} product={product} onQuickView={setQuickView} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <ScrollReveal className="text-center mb-16">
          <p className="text-gold-dark uppercase tracking-[0.2em] text-xs mb-3">Just Landed</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold">New Arrivals</h2>
        </ScrollReveal>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <div key={i} className="aspect-[3/4] rounded-2xl skeleton" />)}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.slice(0, 4).map(product => (
              <ProductCard key={product.id} product={product} onQuickView={setQuickView} />
            ))}
          </div>
        )}
      </section>

      {/* Bridal Collection Banner */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/458766/pexels-photo-458766.jpeg?auto=compress&cs=tinysrgb&w=1920"
            alt="Bridal Collection"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <ScrollReveal>
            <p className="text-gold-light uppercase tracking-[0.3em] text-sm mb-4">For Your Special Day</p>
            <h2 className="font-display text-5xl md:text-7xl font-bold mb-6">Bridal & Occasion</h2>
            <p className="text-white/80 max-w-2xl mx-auto mb-10">Elegant bridal asoebi, exquisite lace gowns, and statement occasion wear designed to make you unforgettable.</p>
            <Link
              to="/products?category=Bridal"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-gold text-charcoal font-bold uppercase tracking-wider text-sm rounded-full hover:shadow-xl transition-all"
            >
              Explore Bridal <ArrowRight className="w-4 h-4" />
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* Before/After */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <ScrollReveal className="text-center mb-16">
          <p className="text-gold-dark uppercase tracking-[0.2em] text-xs mb-3">Transformations</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold">Before & After</h2>
        </ScrollReveal>
        <div className="grid md:grid-cols-2 gap-8">
          {homeFeatures.filter(f => f.section === 'transformation').slice(0, 2).map((item, i) => (
            <ScrollReveal key={item.id || i} delay={i * 0.15}>
              <div className="relative rounded-3xl overflow-hidden group">
                <img src={item.image} alt={item.title} className="w-full aspect-[4/3] object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                  <p className="text-gold-light uppercase tracking-wider text-xs mb-2">{item.subtitle}</p>
                  <h3 className="font-display text-2xl font-bold">{item.title}</h3>
                </div>
              </div>
            </ScrollReveal>
          ))}
          {homeFeatures.filter(f => f.section === 'transformation').length === 0 && (
            <>
              <ScrollReveal>
                <div className="relative rounded-3xl overflow-hidden group">
                  <img src="https://images.pexels.com/photos/3755706/pexels-photo-3755706.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Before" className="w-full aspect-[4/3] object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                    <p className="text-gold-light uppercase tracking-wider text-xs mb-2">The Vision</p>
                    <h3 className="font-display text-2xl font-bold">From Sketch to Splendor</h3>
                  </div>
                </div>
              </ScrollReveal>
              <ScrollReveal delay={0.15}>
                <div className="relative rounded-3xl overflow-hidden group">
                  <img src="https://images.pexels.com/photos/5418905/pexels-photo-5418905.jpeg?auto=compress&cs=tinysrgb&w=800" alt="After" className="w-full aspect-[4/3] object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                    <p className="text-gold-light uppercase tracking-wider text-xs mb-2">The Result</p>
                    <h3 className="font-display text-2xl font-bold">Tailored to Perfection</h3>
                  </div>
                </div>
              </ScrollReveal>
            </>
          )}
        </div>
      </section>

      {/* Gallery Masonry */}
      <section className="py-24 bg-charcoal text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="text-center mb-16">
            <p className="text-gold uppercase tracking-[0.2em] text-xs mb-3">The Lookbook</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold">Fashion Gallery</h2>
          </ScrollReveal>
          <div className="masonry">
            {lookbook.map((src, i) => (
              <div key={i} className="masonry-item relative rounded-2xl overflow-hidden group">
                <img src={src} alt={`Gallery ${i + 1}`} className="w-full rounded-2xl transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <ScrollReveal className="text-center mb-16">
          <p className="text-gold-dark uppercase tracking-[0.2em] text-xs mb-3">Client Love</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold">Testimonials</h2>
        </ScrollReveal>
        <TestimonialWall testimonials={testimonials} />
      </section>

      {/* Instagram Lookbook */}
      <section className="py-24 bg-champagne">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="text-center mb-12">
            <p className="text-gold-dark uppercase tracking-[0.2em] text-xs mb-3">@peaceapparel</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold">Follow the Style</h2>
          </ScrollReveal>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {lookbook.slice(0, 6).map((src, i) => (
              <ScrollReveal key={i} delay={i * 0.05}>
                <a href="#" className="relative aspect-square rounded-2xl overflow-hidden group block">
                  <img src={src} alt={`Lookbook ${i + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <Heart className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </a>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <ScrollReveal className="text-center mb-16">
          <p className="text-gold-dark uppercase tracking-[0.2em] text-xs mb-3">Questions</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold">FAQ</h2>
        </ScrollReveal>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <ScrollReveal key={i} delay={i * 0.08}>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="font-display font-semibold text-lg pr-4">{faq.q}</span>
                  <span className={`text-gold transition-transform ${openFaq === i ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-5 h-5" />
                  </span>
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: openFaq === i ? 'auto' : 0, opacity: openFaq === i ? 1 : 0 }}
                  className="overflow-hidden"
                >
                  <p className="px-6 pb-6 text-gray-600 leading-relaxed">{faq.a}</p>
                </motion.div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto bg-charcoal rounded-[2.5rem] p-10 md:p-16 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <Mail className="w-10 h-10 text-gold mx-auto mb-6" />
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">Join the Inner Circle</h2>
            <p className="text-white/70 mb-8 max-w-lg mx-auto">Be the first to know about exclusive drops, styling tips, and private sales.</p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const email = e.target.email.value;
                await fetch('/api/subscribers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
                e.target.reset();
                alert('Thank you for subscribing!');
              }}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <input
                name="email"
                type="email"
                placeholder="Your email address"
                className="flex-1 px-5 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:border-gold"
                required
              />
              <button type="submit" className="px-6 py-3 bg-gradient-gold text-charcoal font-bold rounded-xl hover:shadow-lg transition-all">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>

      <QuickViewModal product={quickView} isOpen={!!quickView} onClose={() => setQuickView(null)} />
    </main>
  );
}
