import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, Mail, MapPin, Phone, ArrowUpRight } from 'lucide-react';
import ScrollReveal from './ScrollReveal.jsx';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    shop: [
      { name: 'Ankara Collection', path: '/products?category=Ankara' },
      { name: 'Senator Wears', path: '/products?category=Senator' },
      { name: 'Bridal Outfits', path: '/products?category=Bridal' },
      { name: 'Native Wears', path: '/products?category=Native' },
      { name: 'Accessories', path: '/products?category=Accessories' },
    ],
    services: [
      { name: 'Fashion Design', path: '/about' },
      { name: 'Custom Tailoring', path: '/about' },
      { name: 'Bridal Styling', path: '/about' },
      { name: 'Book a Fitting', path: '/contact' },
    ],
    company: [
      { name: 'About Us', path: '/about' },
      { name: 'Contact', path: '/contact' },
      { name: 'Lookbook', path: '/products' },
      { name: 'Admin', path: '/login' },
    ],
  };

  return (
    <footer className="bg-charcoal text-white pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
            <div className="lg:col-span-2">
              <Link to="/" className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-gold flex items-center justify-center">
                  <span className="font-display font-bold text-charcoal text-xl">P</span>
                </div>
                <div>
                  <span className="font-display text-2xl font-bold block leading-none">Peace Apparel</span>
                  <span className="text-xs uppercase tracking-[0.2em] text-gold">Luxury African Fashion</span>
                </div>
              </Link>
              <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-sm">
                Crafting timeless African luxury fashion with precision tailoring, vibrant Ankara designs, and bespoke bridal elegance.
              </p>
              <div className="space-y-3 text-sm text-gray-400">
                <a href="tel:+2348012345678" className="flex items-center gap-3 hover:text-gold transition-colors">
                  <Phone className="w-4 h-4" /> +234 801 234 5678
                </a>
                <a href="mailto:hello@peaceapparel.com" className="flex items-center gap-3 hover:text-gold transition-colors">
                  <Mail className="w-4 h-4" /> hello@peaceapparel.com
                </a>
                <p className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 mt-0.5" /> 12 Fashion Avenue, Aba, Abia State, Nigeria
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-display text-lg mb-6">Shop</h4>
              <ul className="space-y-3">
                {footerLinks.shop.map(link => (
                  <li key={link.name}>
                    <Link to={link.path} className="text-gray-400 text-sm hover:text-gold transition-colors flex items-center gap-1 group">
                      {link.name} <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-display text-lg mb-6">Services</h4>
              <ul className="space-y-3">
                {footerLinks.services.map(link => (
                  <li key={link.name}>
                    <Link to={link.path} className="text-gray-400 text-sm hover:text-gold transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-display text-lg mb-6">Company</h4>
              <ul className="space-y-3">
                {footerLinks.company.map(link => (
                  <li key={link.name}>
                    <Link to={link.path} className="text-gray-400 text-sm hover:text-gold transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </ScrollReveal>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">&copy; {currentYear} Peace Apparel. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-gold hover:border-gold hover:text-charcoal transition-all">
              <Instagram className="w-4 h-4" />
            </a>
            <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-gold hover:border-gold hover:text-charcoal transition-all">
              <Facebook className="w-4 h-4" />
            </a>
            <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-gold hover:border-gold hover:text-charcoal transition-all">
              <Twitter className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
