import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import ScrollReveal from '../components/ScrollReveal.jsx';

export default function Login() {
  const navigate = useNavigate();
  const { setIsAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem('pa_admin_token', data.token);
      setIsAdmin(true);
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen pt-24 pb-20 flex items-center">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <ScrollReveal className="hidden lg:block">
            <div className="relative rounded-[2.5rem] overflow-hidden h-[700px]">
              <img
                src="https://images.pexels.com/photos/5706273/pexels-photo-5706273.jpeg?auto=compress&cs=tinysrgb&w=1200"
                alt="Peace Apparel"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40" />
              <div className="absolute bottom-0 left-0 right-0 p-12 text-white">
                <p className="text-gold-light uppercase tracking-[0.3em] text-sm mb-4">Admin Portal</p>
                <h2 className="font-display text-4xl font-bold mb-4">Manage Your Fashion Empire</h2>
                <p className="text-white/80">Products, orders, subscribers, and analytics — all in one elegant dashboard.</p>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-gradient-gold flex items-center justify-center mx-auto mb-4">
                  <span className="font-display font-bold text-charcoal text-2xl">P</span>
                </div>
                <h1 className="font-display text-3xl font-bold mb-2">Welcome Back</h1>
                <p className="text-gray-500 text-sm">Sign in to access the admin dashboard</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Admin email"
                    required
                    className="w-full pl-12 pr-4 py-4 bg-cream border border-gray-200 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                    className="w-full pl-12 pr-12 py-4 bg-cream border border-gray-200 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-charcoal text-white py-4 rounded-xl font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:bg-gold hover:text-charcoal transition-colors disabled:opacity-70"
                >
                  {loading ? 'Signing In...' : <><span>Sign In</span> <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>

              <p className="text-center text-gray-500 text-sm mt-6">
                <Link to="/" className="text-gold-dark hover:underline">Return to website</Link>
              </p>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </main>
  );
}
