import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingCart, MessageSquare, Users,
  Settings, Home, Menu, X, LogOut, Search, Plus, Trash2, Edit,
  Sun, Moon, Command, DollarSign, ShoppingBag, UserCheck, Loader2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { apiFetch } from '../lib/api.js';
import { formatCurrency } from '../lib/utils.js';
import CommandPalette from '../components/CommandPalette.jsx';
import SimpleLineChart from '../components/SimpleLineChart.jsx';
import SimpleDoughnutChart from '../components/SimpleDoughnutChart.jsx';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'testimonials', label: 'Testimonials', icon: MessageSquare },
  { id: 'homepage', label: 'Homepage Products', icon: Home },
  { id: 'subscribers', label: 'Subscribers', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const orderStatuses = ['pending', 'processing', 'completed'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { setIsAdmin } = useAuth();
  const [section, setSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [homeFeatures, setHomeFeatures] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [settings, setSettings] = useState({ store_name: 'Peace Apparel', phone: '+2348012345678', email: 'hello@peaceapparel.com', address: '12 Fashion Avenue, Aba' });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('All');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [editingFeature, setEditingFeature] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen(open => !open);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

      const fetchAll = useCallback(async () => {
    try {
      const [p, o, s, t, h, a, st] = await Promise.all([
        apiFetch('/api/products?limit=200').then(r => r.json()),
        apiFetch('/api/orders').then(r => r.json()),
        apiFetch('/api/subscribers').then(r => r.json()),
        apiFetch('/api/testimonials').then(r => r.json()),
        apiFetch('/api/homepage-features').then(r => r.json()),
        apiFetch('/api/analytics').then(r => r.json()),
        apiFetch('/api/settings').then(r => r.json().catch(() => ({}))),
      ]);
      setProducts(p);
      setOrders(o);
      setSubscribers(s);
      setTestimonials(t);
      setHomeFeatures(h);
      setAnalytics(a);
      if (st && Object.keys(st).length) setSettings(st);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

    useEffect(() => {
    // Initial data load; state updates happen asynchronously after fetches.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll();
  }, [fetchAll]);

  const logout = () => {
    localStorage.removeItem('pa_admin_token');
    setIsAdmin(false);
    navigate('/login');
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = productCategoryFilter === 'All' || p.categories?.includes(productCategoryFilter);
      return matchesSearch && matchesCategory;
    });
  }, [products, search, productCategoryFilter]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
      const matchesSearch = !search || o.customer_name?.toLowerCase().includes(search.toLowerCase()) || o.id?.toLowerCase().includes(search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [orders, orderStatusFilter, search]);

  const handleUpload = async (file, setter) => {
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1];
      try {
        const res = await apiFetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, fileBase64: base64, contentType: file.type }),
        });
        const data = await res.json();
        setter(data.url);
      } catch (err) {
        console.error(err);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const saveProduct = async (e) => {
    e.preventDefault();
    const form = e.target;
    const product = {
      name: form.name.value,
      price: Number(form.price.value),
      old_price: form.old_price.value ? Number(form.old_price.value) : null,
      stock: Number(form.stock.value),
      category: form.category.value,
      categories: [form.category.value, form.gender.value].filter(Boolean),
      description: form.description.value,
      sizes: form.sizes.value.split(',').map(s => s.trim()).filter(Boolean),
      colors: form.colors.value.split(',').map(c => c.trim()).filter(Boolean),
      images: [form.image.value],
      featured: form.featured.checked,
    };
    // `editingProduct` is `{}` (truthy) when adding, so discriminate on id.
    const isUpdate = Boolean(editingProduct && editingProduct.id);
    const method = isUpdate ? 'PUT' : 'POST';
    if (isUpdate) product.id = editingProduct.id;

    await apiFetch('/api/products', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    setEditingProduct(null);
    fetchAll();
  };

  const deleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return;
    await apiFetch('/api/products', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    fetchAll();
  };

  const updateOrderStatus = async (id, status) => {
    await apiFetch('/api/orders', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    fetchAll();
  };

  const deleteOrder = async (id) => {
    if (!confirm('Delete this order?')) return;
    await apiFetch('/api/orders', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    fetchAll();
  };

  const saveTestimonial = async (e) => {
    e.preventDefault();
    const form = e.target;
    const testimonial = {
      name: form.name.value,
      location: form.location.value,
      content: form.content.value,
      rating: Number(form.rating.value),
      service: form.service.value,
      avatar: form.avatar.value,
    };
    // `editingTestimonial` is `{}` (truthy) when adding, so discriminate on id.
    const isUpdate = Boolean(editingTestimonial && editingTestimonial.id);
    const method = isUpdate ? 'PUT' : 'POST';
    if (isUpdate) testimonial.id = editingTestimonial.id;
    await apiFetch('/api/testimonials', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(testimonial) });
    setEditingTestimonial(null);
    fetchAll();
  };

  const deleteTestimonial = async (id) => {
    if (!confirm('Delete this testimonial?')) return;
    await apiFetch('/api/testimonials', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    fetchAll();
  };

  const saveFeature = async (e) => {
    e.preventDefault();
    const form = e.target;
    const feature = {
      section: form.section.value,
      title: form.title.value,
      subtitle: form.subtitle.value,
      image: form.image.value,
      sort_order: Number(form.sort_order.value),
    };
    // `editingFeature` is `{}` (truthy) when adding, so discriminate on id.
    const isUpdate = Boolean(editingFeature && editingFeature.id);
    const method = isUpdate ? 'PUT' : 'POST';
    if (isUpdate) feature.id = editingFeature.id;
    await apiFetch('/api/homepage-features', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(feature) });
    setEditingFeature(null);
    fetchAll();
  };

  const deleteFeature = async (id) => {
    if (!confirm('Delete this feature?')) return;
    await apiFetch('/api/homepage-features', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    fetchAll();
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    const form = e.target;
    const newSettings = {
      store_name: form.store_name.value,
      phone: form.phone.value,
      email: form.email.value,
      address: form.address.value,
      whatsapp_number: form.whatsapp_number.value,
    };
    await apiFetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newSettings) });
    setSettings(newSettings);
  };

  const deleteSubscriber = async (id) => {
    if (!confirm('Delete this subscriber?')) return;
    await apiFetch('/api/subscribers', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    fetchAll();
  };

  const themeClass = darkMode ? 'dark bg-charcoal text-white' : 'bg-gray-50 text-charcoal';

  const chartData = useMemo(() => {
    if (!analytics) return null;
    return {
      revenueByDay: analytics.revenueByDay,
      statusCounts: analytics.statusCounts,
    };
  }, [analytics]);

  return (
    <div className={`min-h-screen ${themeClass}`}>
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-charcoal sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-gold flex items-center justify-center">
            <span className="font-display font-bold text-charcoal">P</span>
          </div>
          <span className="font-display font-bold">Peace Apparel</span>
        </div>
        <button onClick={() => setSidebarOpen(true)} className="p-2">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-white dark:bg-charcoal border-r border-gray-200 dark:border-white/10 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="p-6 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center">
                <span className="font-display font-bold text-charcoal text-lg">P</span>
              </div>
              <div>
                <span className="font-display font-bold block leading-none">Peace Apparel</span>
                <span className="text-[10px] uppercase tracking-wider text-gold-dark">Admin</span>
              </div>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="px-4 space-y-1">
            {navItems.map(item => {
              const isActive = section === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setSection(item.id); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? `${darkMode ? 'bg-gold text-charcoal' : 'bg-charcoal text-white'} shadow-md`
                      : `${darkMode ? 'text-gray-300 hover:bg-white/10 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-charcoal'}`
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${isActive ? (darkMode ? 'text-charcoal' : 'text-gold') : 'text-gold-dark/70'}`} /> {item.label}
                </button>
              );
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-white/10">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-gray-100 dark:hover:bg-white/5 mb-2"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />} {darkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </aside>

        {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* Main Content */}
        <main className="flex-1 min-h-screen p-4 lg:p-8 overflow-x-hidden">
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-display text-2xl lg:text-3xl font-bold capitalize">{section}</h1>
            <button
              onClick={() => setCommandOpen(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm hover:border-gold transition-colors"
            >
              <Command className="w-4 h-4" /> Command Palette <span className="text-xs text-gray-400">Ctrl K</span>
            </button>
          </div>

          {loading && section === 'dashboard' ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-gold" />
            </div>
          ) : section === 'dashboard' && analytics && (
            <div className="space-y-8">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Revenue', value: formatCurrency(analytics.totalRevenue), icon: DollarSign, color: 'bg-green-100 text-green-600' },
                  { label: 'Total Orders', value: analytics.totalOrders, icon: ShoppingBag, color: 'bg-blue-100 text-blue-600' },
                  { label: 'Products', value: analytics.totalProducts, icon: Package, color: 'bg-purple-100 text-purple-600' },
                  { label: 'Subscribers', value: analytics.totalSubscribers, icon: UserCheck, color: 'bg-gold/20 text-gold-dark' },
                ].map((card, i) => (
                  <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white dark:bg-white/5 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/10"
                  >
                    <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center mb-4`}>
                      <card.icon className="w-5 h-5" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{card.label}</p>
                    <p className="font-display text-2xl font-bold">{card.value}</p>
                  </motion.div>
                ))}
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-white/5 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/10">
                  <h3 className="font-display text-lg font-bold mb-4">Revenue (Last 14 Days)</h3>
                  <div className="h-64">
                    <SimpleLineChart data={chartData?.revenueByDay} darkMode={darkMode} />
                  </div>
                </div>
                <div className="bg-white dark:bg-white/5 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/10">
                  <h3 className="font-display text-lg font-bold mb-4">Order Status</h3>
                  <div className="h-64 flex items-center justify-center">
                    <SimpleDoughnutChart data={chartData?.statusCounts} darkMode={darkMode} />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-white/5 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/10">
                <h3 className="font-display text-lg font-bold mb-4">Recent Orders</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-white/10 text-left">
                        <th className="pb-3 font-medium">Order ID</th>
                        <th className="pb-3 font-medium">Customer</th>
                        <th className="pb-3 font-medium">Total</th>
                        <th className="pb-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 5).map(order => (
                        <tr key={order.id} className="border-b border-gray-50 dark:border-white/5">
                          <td className="py-3 font-mono">{order.id}</td>
                          <td className="py-3">{order.customer_name}</td>
                          <td className="py-3 font-semibold">{formatCurrency(order.total)}</td>
                          <td className="py-3"><StatusBadge status={order.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {section === 'products' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5"
                  />
                </div>
                <button
                  onClick={() => setEditingProduct({})}
                  className="px-5 py-2.5 bg-charcoal text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-gold hover:text-charcoal transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Product
                </button>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2">
                {['All', 'Ankara', 'Senator', 'Native', 'Bridal', 'Casual', 'Corporate', 'Men', 'Women', 'Accessories'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setProductCategoryFilter(cat)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                      productCategoryFilter === cat
                        ? `${darkMode ? 'bg-gold text-charcoal' : 'bg-charcoal text-white'} shadow-sm`
                        : `${darkMode ? 'bg-white/5 text-gray-300 border-white/10 hover:text-gold' : 'bg-white text-gray-600 border-gray-200 hover:border-gold hover:text-gold-dark'}`
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="bg-white dark:bg-white/5 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-white/10 text-left bg-gray-50 dark:bg-white/5">
                        <th className="p-4 font-medium">Product</th>
                        <th className="p-4 font-medium">Category</th>
                        <th className="p-4 font-medium">Price</th>
                        <th className="p-4 font-medium">Stock</th>
                        <th className="p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map(product => (
                        <tr key={product.id} className="border-b border-gray-50 dark:border-white/5">
                          <td className="p-4 flex items-center gap-3">
                            <img src={product.images?.[0] || product.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
                            <span className="font-medium">{product.name}</span>
                          </td>
                          <td className="p-4">{product.categories?.join(', ')}</td>
                          <td className="p-4 font-semibold">{formatCurrency(product.price)}</td>
                          <td className="p-4">{product.stock}</td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <button onClick={() => setEditingProduct(product)} className="p-2 hover:bg-gold/20 rounded-lg"><Edit className="w-4 h-4" /></button>
                              <button onClick={() => deleteProduct(product.id)} className="p-2 hover:bg-red-100 text-red-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <AnimatePresence>
                {editingProduct && (
                  <ProductFormModal
                    product={editingProduct}
                    onClose={() => setEditingProduct(null)}
                    onSubmit={saveProduct}
                    uploading={uploading}
                    onUpload={handleUpload}
                    fileInputRef={fileInputRef}
                  />
                )}
              </AnimatePresence>
            </div>
          )}

          {section === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search orders..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5"
                  />
                </div>
                <select
                  value={orderStatusFilter}
                  onChange={e => setOrderStatusFilter(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5"
                >
                  <option value="all">All Statuses</option>
                  {orderStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="bg-white dark:bg-white/5 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-white/10 text-left bg-gray-50 dark:bg-white/5">
                        <th className="p-4 font-medium">Order ID</th>
                        <th className="p-4 font-medium">Customer</th>
                        <th className="p-4 font-medium">Items</th>
                        <th className="p-4 font-medium">Total</th>
                        <th className="p-4 font-medium">Delivery</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map(order => (
                        <tr key={order.id} className="border-b border-gray-50 dark:border-white/5">
                          <td className="p-4 font-mono text-xs">{order.id}</td>
                          <td className="p-4">
                            <p className="font-medium">{order.customer_name}</p>
                            <p className="text-xs text-gray-500">{order.customer_email}</p>
                            <p className="text-xs text-gray-500">{order.customer_phone}</p>
                          </td>
                          <td className="p-4 text-xs">{(order.items || []).length} items</td>
                          <td className="p-4 font-semibold">{formatCurrency(order.total)}</td>
                          <td className="p-4 text-xs capitalize">{order.delivery_method}</td>
                          <td className="p-4"><StatusBadge status={order.status} /></td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <select
                                value={order.status}
                                onChange={e => updateOrderStatus(order.id, e.target.value)}
                                className="text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent"
                              >
                                {orderStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                              <button onClick={() => deleteOrder(order.id)} className="p-2 hover:bg-red-100 text-red-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {section === 'testimonials' && (
            <div className="space-y-6">
              <button
                onClick={() => setEditingTestimonial({})}
                className="px-5 py-2.5 bg-charcoal text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-gold hover:text-charcoal transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Testimonial
              </button>
              <div className="grid md:grid-cols-2 gap-4">
                {testimonials.map(t => (
                  <div key={t.id} className="bg-white dark:bg-white/5 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/10">
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">&ldquo;{t.content}&rdquo;</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={t.avatar || `https://ui-avatars.com/api/?name=${t.name}&background=d4af37&color=fff`} alt="" className="w-10 h-10 rounded-full" />
                        <div>
                          <p className="font-semibold text-sm">{t.name}</p>
                          <p className="text-xs text-gray-500">{t.location}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingTestimonial(t)} className="p-2 hover:bg-gold/20 rounded-lg"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => deleteTestimonial(t.id)} className="p-2 hover:bg-red-100 text-red-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <AnimatePresence>
                {editingTestimonial && (
                  <TestimonialFormModal testimonial={editingTestimonial} onClose={() => setEditingTestimonial(null)} onSubmit={saveTestimonial} />
                )}
              </AnimatePresence>
            </div>
          )}

          {section === 'homepage' && (
            <div className="space-y-6">
              <button
                onClick={() => setEditingFeature({})}
                className="px-5 py-2.5 bg-charcoal text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-gold hover:text-charcoal transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Homepage Feature
              </button>
              <div className="grid md:grid-cols-2 gap-4">
                {homeFeatures.map(f => (
                  <div key={f.id} className="bg-white dark:bg-white/5 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-white/10">
                    <img src={f.image} alt={f.title} className="w-full h-40 object-cover" />
                    <div className="p-4">
                      <p className="text-xs text-gold-dark uppercase tracking-wider">{f.section}</p>
                      <h4 className="font-display font-bold">{f.title}</h4>
                      <p className="text-xs text-gray-500">{f.subtitle}</p>
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => setEditingFeature(f)} className="p-2 hover:bg-gold/20 rounded-lg"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => deleteFeature(f.id)} className="p-2 hover:bg-red-100 text-red-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <AnimatePresence>
                {editingFeature && (
                  <FeatureFormModal feature={editingFeature} onClose={() => setEditingFeature(null)} onSubmit={saveFeature} />
                )}
              </AnimatePresence>
            </div>
          )}

          {section === 'subscribers' && (
            <div className="bg-white dark:bg-white/5 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-white/10 text-left bg-gray-50 dark:bg-white/5">
                      <th className="p-4 font-medium">Email</th>
                      <th className="p-4 font-medium">Date</th>
                      <th className="p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers.map(s => (
                      <tr key={s.id} className="border-b border-gray-50 dark:border-white/5">
                        <td className="p-4">{s.email}</td>
                        <td className="p-4 text-xs text-gray-500">{new Date(s.created_at).toLocaleDateString()}</td>
                        <td className="p-4">
                          <a href={`mailto:${s.email}`} className="text-gold-dark hover:underline text-sm mr-3">Email</a>
                          <button onClick={() => deleteSubscriber(s.id)} className="p-2 hover:bg-red-100 text-red-500 rounded-lg inline-flex"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {section === 'settings' && (
            <div className="max-w-2xl bg-white dark:bg-white/5 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-white/10">
              <h2 className="font-display text-xl font-bold mb-6">Store Settings</h2>
              <form onSubmit={saveSettings} className="space-y-5">
                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold mb-2 block">Store Name</label>
                  <input name="store_name" defaultValue={settings.store_name} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-cream dark:bg-white/5" />
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs uppercase tracking-wider font-semibold mb-2 block">Phone</label>
                    <input name="phone" defaultValue={settings.phone} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-cream dark:bg-white/5" />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider font-semibold mb-2 block">WhatsApp Number</label>
                    <input name="whatsapp_number" defaultValue={settings.whatsapp_number || settings.phone} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-cream dark:bg-white/5" />
                  </div>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold mb-2 block">Email</label>
                  <input name="email" defaultValue={settings.email} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-cream dark:bg-white/5" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold mb-2 block">Address</label>
                  <textarea name="address" defaultValue={settings.address} rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-cream dark:bg-white/5" />
                </div>
                <button type="submit" className="px-6 py-3 bg-charcoal text-white rounded-xl font-semibold hover:bg-gold hover:text-charcoal transition-colors">Save Settings</button>
              </form>
            </div>
          )}
        </main>
      </div>

      <CommandPalette isOpen={commandOpen} onClose={() => setCommandOpen(false)} onNavigate={setSection} />
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    pending: 'bg-amber-100 text-amber-700',
    processing: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${colors[status] || 'bg-gray-100'}`}>
      {status}
    </span>
  );
}

function ProductFormModal({ product, onClose, onSubmit, uploading, onUpload, fileInputRef }) {
  const [imageUrl, setImageUrl] = useState(product.images?.[0] || product.image || '');
  const isNew = !product.id;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white dark:bg-charcoal rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8"
      >
        <h2 className="font-display text-2xl font-bold mb-6">{isNew ? 'Add Product' : 'Edit Product'}</h2>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
            <input name="name" defaultValue={product.name} placeholder="Product Name" required className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-cream dark:bg-white/5" />
            <select name="category" defaultValue={product.category || product.categories?.[0] || 'Ankara'} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-cream dark:bg-white/5">
              {['Ankara', 'Senator', 'Native', 'Bridal', 'Casual', 'Corporate', 'Men', 'Women', 'Accessories'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            <input name="price" type="number" defaultValue={product.price} placeholder="Price" required className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-cream dark:bg-white/5" />
            <input name="old_price" type="number" defaultValue={product.old_price} placeholder="Old Price" className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-cream dark:bg-white/5" />
            <input name="stock" type="number" defaultValue={product.stock ?? 10} placeholder="Stock" required className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-cream dark:bg-white/5" />
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <input name="sizes" defaultValue={(product.sizes || []).join(', ')} placeholder="Sizes (e.g. S, M, L, XL)" className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-cream dark:bg-white/5" />
            <select name="gender" defaultValue={product.categories?.includes('Women') ? 'Women' : 'Men'} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-cream dark:bg-white/5">
              <option value="Men">Men</option>
              <option value="Women">Women</option>
              <option value="Unisex">Unisex</option>
            </select>
          </div>
          <input name="colors" defaultValue={(product.colors || []).join(', ')} placeholder="Colors (e.g. Red, Blue, Gold)" className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-cream dark:bg-white/5" />
          <textarea name="description" defaultValue={product.description} placeholder="Description" rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-cream dark:bg-white/5" />

          <div>
            <label className="text-xs uppercase tracking-wider font-semibold mb-2 block">Product Image</label>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={e => onUpload(e.target.files[0], setImageUrl)} className="mb-2" />
            <input name="image" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Image URL" required className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-cream dark:bg-white/5" />
            {imageUrl && <img src={imageUrl} alt="Preview" className="mt-3 h-32 rounded-xl object-cover" />}
            {uploading && <p className="text-xs text-gold-dark mt-2">Uploading...</p>}
          </div>

          <label className="flex items-center gap-2">
            <input type="checkbox" name="featured" defaultChecked={product.featured} className="w-4 h-4" />
            <span className="text-sm">Featured on homepage</span>
          </label>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-gray-200 dark:border-white/10 rounded-xl font-semibold">Cancel</button>
            <button type="submit" className="flex-1 py-3 bg-charcoal text-white rounded-xl font-semibold hover:bg-gold hover:text-charcoal transition-colors">Save Product</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function TestimonialFormModal({ testimonial, onClose, onSubmit }) {
  const isNew = !testimonial.id;
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white dark:bg-charcoal rounded-3xl shadow-2xl w-full max-w-lg p-8">
        <h2 className="font-display text-2xl font-bold mb-6">{isNew ? 'Add Testimonial' : 'Edit Testimonial'}</h2>
        <form onSubmit={onSubmit} className="space-y-5">
          <input name="name" defaultValue={testimonial.name} placeholder="Name" required className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-cream dark:bg-white/5" />
          <input name="location" defaultValue={testimonial.location} placeholder="Location" className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-cream dark:bg-white/5" />
          <input name="service" defaultValue={testimonial.service} placeholder="Service (e.g. Bridal)" className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-cream dark:bg-white/5" />
          <input name="avatar" defaultValue={testimonial.avatar} placeholder="Avatar URL (optional)" className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-cream dark:bg-white/5" />
          <input name="rating" type="number" min="1" max="5" defaultValue={testimonial.rating || 5} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-cream dark:bg-white/5" />
          <textarea name="content" defaultValue={testimonial.content} placeholder="Testimonial" rows={4} required className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-cream dark:bg-white/5" />
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-gray-200 dark:border-white/10 rounded-xl font-semibold">Cancel</button>
            <button type="submit" className="flex-1 py-3 bg-charcoal text-white rounded-xl font-semibold hover:bg-gold hover:text-charcoal transition-colors">Save</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function FeatureFormModal({ feature, onClose, onSubmit }) {
  const isNew = !feature.id;
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white dark:bg-charcoal rounded-3xl shadow-2xl w-full max-w-lg p-8">
        <h2 className="font-display text-2xl font-bold mb-6">{isNew ? 'Add Feature' : 'Edit Feature'}</h2>
        <form onSubmit={onSubmit} className="space-y-5">
          <select name="section" defaultValue={feature.section || 'transformation'} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-cream dark:bg-white/5">
            <option value="transformation">Transformation</option>
            <option value="hero">Hero</option>
            <option value="lookbook">Lookbook</option>
          </select>
          <input name="title" defaultValue={feature.title} placeholder="Title" required className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-cream dark:bg-white/5" />
          <input name="subtitle" defaultValue={feature.subtitle} placeholder="Subtitle" className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-cream dark:bg-white/5" />
          <input name="image" defaultValue={feature.image} placeholder="Image URL" required className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-cream dark:bg-white/5" />
          <input name="sort_order" type="number" defaultValue={feature.sort_order || 0} placeholder="Sort Order" className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-cream dark:bg-white/5" />
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-gray-200 dark:border-white/10 rounded-xl font-semibold">Cancel</button>
            <button type="submit" className="flex-1 py-3 bg-charcoal text-white rounded-xl font-semibold hover:bg-gold hover:text-charcoal transition-colors">Save</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
