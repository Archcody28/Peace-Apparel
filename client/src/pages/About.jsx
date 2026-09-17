import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Award, Users, Heart, Globe } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal.jsx';

const stats = [
  { icon: Users, value: '5,000+', label: 'Happy Clients' },
  { icon: Award, value: '12+', label: 'Years of Excellence' },
  { icon: Heart, value: '15,000+', label: 'Garments Crafted' },
  { icon: Globe, value: '36', label: 'States Served' },
];

const values = [
  { title: 'Heritage', desc: 'Every stitch honors African tradition and tells a story of cultural pride.' },
  { title: 'Craftsmanship', desc: 'Meticulous tailoring by master artisans with decades of experience.' },
  { title: 'Innovation', desc: 'Modern silhouettes infused with timeless patterns and luxury fabrics.' },
  { title: 'Service', desc: 'Personalized fittings and white-glove customer care from start to finish.' },
];

export default function About() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);

  return (
    <main className="min-h-screen pt-24">
      <section ref={ref} className="relative h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        <motion.div style={{ y }} className="absolute inset-0">
          <img
            src="/images/fashion-hero.jpg"
            alt="Peace Apparel Atelier"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
        </motion.div>
        <div className="relative z-10 text-center text-white px-4">
          <ScrollReveal>
            <p className="text-gold-light uppercase tracking-[0.3em] text-sm mb-4">Our Story</p>
            <h1 className="font-display text-5xl md:text-7xl font-bold mb-6">Peace Apparel</h1>
            <p className="max-w-2xl mx-auto text-lg text-white/90">Redefining African luxury fashion through heritage, artistry, and impeccable fit.</p>
          </ScrollReveal>
        </div>
      </section>

      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <ScrollReveal>
            <p className="text-gold-dark uppercase tracking-[0.2em] text-xs mb-4">Founded in Aba</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">Where Tradition Meets Modern Luxury</h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>Peace Apparel began as a small tailoring studio in the heart of Aba, Nigeria — a city renowned for its textile heritage and skilled artisans. What started as a passion for beautiful African prints has grown into a luxury fashion house serving clients across Nigeria and beyond.</p>
              <p>We specialize in bespoke tailoring, custom fittings, bridal asoebi, senator wears, and ready-to-wear collections that celebrate the beauty of African craftsmanship. Every garment is designed to make you feel confident, elegant, and connected to your roots.</p>
              <p>From sketch to final stitch, our team works closely with each client to ensure a flawless fit and a design that reflects their unique personality.</p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <div className="grid grid-cols-2 gap-4">
              <img src="/images/fashion-portrait.jpg" alt="Fashion" className="rounded-3xl shadow-lg" />
              <img src="/images/native-wear.jpg" alt="Tailoring" className="rounded-3xl shadow-lg mt-8" />
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="py-20 bg-charcoal text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <ScrollReveal key={stat.label} delay={i * 0.1}>
                <div className="text-center">
                  <stat.icon className="w-8 h-8 text-gold mx-auto mb-4" />
                  <p className="font-display text-4xl font-bold mb-2">{stat.value}</p>
                  <p className="text-white/60 text-sm uppercase tracking-wider">{stat.label}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <ScrollReveal className="text-center mb-16">
          <p className="text-gold-dark uppercase tracking-[0.2em] text-xs mb-3">Our Values</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold">What We Stand For</h2>
        </ScrollReveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((value, i) => (
            <ScrollReveal key={value.title} delay={i * 0.1}>
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 h-full">
                <h3 className="font-display text-2xl font-bold mb-3">{value.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{value.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>
    </main>
  );
}
