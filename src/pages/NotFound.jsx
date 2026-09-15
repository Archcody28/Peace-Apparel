import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal.jsx';

export default function NotFound() {
  return (
    <main className="min-h-screen pt-32 pb-20 flex items-center justify-center px-4">
      <ScrollReveal className="text-center max-w-lg">
        <p className="font-display text-[8rem] leading-none font-bold text-gold/30 mb-4">404</p>
        <h1 className="font-display text-4xl font-bold mb-4">Page Not Found</h1>
        <p className="text-gray-600 mb-8">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/" className="px-6 py-3 bg-charcoal text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gold hover:text-charcoal transition-colors">
            <Home className="w-4 h-4" /> Go Home
          </Link>
          <Link to="/products" className="px-6 py-3 border border-gray-200 rounded-xl font-semibold flex items-center justify-center gap-2 hover:border-gold hover:text-gold-dark transition-colors">
            <Search className="w-4 h-4" /> Shop Collection
          </Link>
        </div>
      </ScrollReveal>
    </main>
  );
}
