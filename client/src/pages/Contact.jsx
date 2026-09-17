import { useState } from 'react';
import ScrollReveal from '../components/ScrollReveal.jsx';
import { Mail, Phone, MapPin, Clock, Send, Calendar } from 'lucide-react';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', service: '', message: '' });
  const [status, setStatus] = useState('idle');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const message = encodeURIComponent(
        `*New Contact Form Submission*\n\n` +
        `*Name:* ${form.name}\n` +
        `*Email:* ${form.email}\n` +
        `*Phone:* ${form.phone}\n` +
        `*Service:* ${form.service}\n` +
        `*Message:* ${form.message}`
      );
      window.open(`https://wa.me/2348012345678?text=${message}`, '_blank');
      setStatus('success');
      setForm({ name: '', email: '', phone: '', service: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  return (
    <main className="min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-16">
          <p className="text-gold-dark uppercase tracking-[0.2em] text-xs mb-3">Get in Touch</p>
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-4">Let&apos;s Create Together</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">Book a fitting, ask about a design, or start your custom order. We&apos;re here to bring your vision to life.</p>
        </ScrollReveal>

        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {[
            { icon: Phone, title: 'Call Us', text: '+234 801 234 5678', href: 'tel:+2348012345678' },
            { icon: Mail, title: 'Email Us', text: 'hello@peaceapparel.com', href: 'mailto:hello@peaceapparel.com' },
            { icon: MapPin, title: 'Visit Us', text: '12 Fashion Avenue, Aba, Abia State', href: '#' },
          ].map((item, i) => (
            <ScrollReveal key={item.title} delay={i * 0.1}>
              <a href={item.href} className="block bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-gold-dark" />
                </div>
                <h3 className="font-display text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.text}</p>
              </a>
            </ScrollReveal>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <ScrollReveal>
            <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-gray-100">
              <h2 className="font-display text-2xl font-bold mb-6">Send a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <input
                    type="text"
                    placeholder="Your Name"
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 bg-cream border border-gray-200 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    required
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 bg-cream border border-gray-200 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                  />
                </div>
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-cream border border-gray-200 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                />
                <select
                  value={form.service}
                  onChange={e => setForm({ ...form, service: e.target.value })}
                  className="w-full px-4 py-3 bg-cream border border-gray-200 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                >
                  <option value="">Select a Service</option>
                  <option value="Fashion Design">Fashion Design</option>
                  <option value="Custom Tailoring">Custom Tailoring</option>
                  <option value="Bridal Styling">Bridal Styling</option>
                  <option value="Ready-to-Wear">Ready-to-Wear</option>
                  <option value="Book a Fitting">Book a Fitting</option>
                </select>
                <textarea
                  placeholder="Tell us about your vision..."
                  rows={5}
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  className="w-full px-4 py-3 bg-cream border border-gray-200 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full bg-charcoal text-white py-4 rounded-xl font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:bg-gold hover:text-charcoal transition-colors disabled:opacity-70"
                >
                  {status === 'loading' ? 'Sending...' : <><Send className="w-4 h-4" /> Send via WhatsApp</>}
                </button>
                {status === 'success' && <p className="text-green-600 text-sm">Your message has been opened in WhatsApp.</p>}
              </form>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <div className="space-y-6">
              <div className="bg-charcoal text-white rounded-3xl p-8 md:p-10">
                <Calendar className="w-8 h-8 text-gold mb-4" />
                <h3 className="font-display text-2xl font-bold mb-3">Book a Private Fitting</h3>
                <p className="text-white/70 text-sm mb-6 leading-relaxed">Experience personalized service with our in-house stylists. Available Monday through Saturday, 9 AM to 6 PM.</p>
                <a
                  href="https://wa.me/2348012345678?text=Hello%20Peace%20Apparel,%20I%20would%20like%20to%20book%20a%20fitting%20appointment."
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-gold text-charcoal font-bold rounded-xl hover:shadow-lg transition-all"
                >
                  Book Appointment
                </a>
              </div>

              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <Clock className="w-8 h-8 text-gold-dark mb-4" />
                <h3 className="font-display text-xl font-bold mb-4">Business Hours</h3>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex justify-between"><span>Monday - Friday</span> <span>9:00 AM - 6:00 PM</span></li>
                  <li className="flex justify-between"><span>Saturday</span> <span>10:00 AM - 4:00 PM</span></li>
                  <li className="flex justify-between"><span>Sunday</span> <span>Closed</span></li>
                </ul>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </main>
  );
}
