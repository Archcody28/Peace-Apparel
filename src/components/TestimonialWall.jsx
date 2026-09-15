import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

export default function TestimonialWall({ testimonials }) {
  const cols = 4;
  const columns = Array.from({ length: cols }, (_, i) =>
    testimonials.filter((_, idx) => idx % cols === i)
  );

  return (
    <div className="relative overflow-hidden h-[700px]">
      <div className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-b from-cream via-transparent to-cream" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4">
        {columns.map((col, i) => (
          <div key={i} className={`space-y-4 ${i % 2 === 0 ? 'animate-float' : ''}`} style={{ animationDelay: `${i * 0.5}s` }}>
            <ScrollingColumn items={col} direction={i % 2 === 0 ? 'up' : 'down'} speed={35 + i * 5} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ScrollingColumn({ items, direction, speed }) {
  const duplicated = [...items, ...items, ...items];

  return (
    <motion.div
      className="space-y-4"
      animate={{ y: direction === 'up' ? ['0%', '-50%'] : ['-50%', '0%'] }}
      transition={{ duration: speed, ease: 'linear', repeat: Infinity }}
    >
      {duplicated.map((item, i) => (
        <TestimonialCard key={`${item.id}-${i}`} testimonial={item} />
      ))}
    </motion.div>
  );
}

function TestimonialCard({ testimonial }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="relative perspective group cursor-pointer"
      onClick={() => setFlipped(!flipped)}
      style={{ perspective: '1000px' }}
    >
      <motion.div
        className="relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {!flipped ? (
          <div>
            <Quote className="w-6 h-6 text-gold/40 mb-3" />
            <p className="text-sm text-gray-700 leading-relaxed mb-4">{testimonial.content}</p>
            <div className="flex items-center gap-3">
              <img
                src={testimonial.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.name)}&background=d4af37&color=fff`}
                alt={testimonial.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold text-sm">{testimonial.name}</p>
                <p className="text-xs text-gray-500">{testimonial.location}</p>
              </div>
            </div>
            <div className="flex gap-0.5 mt-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-3 h-3 ${i < (testimonial.rating || 5) ? 'text-gold fill-gold' : 'text-gray-300'}`} />
              ))}
            </div>
          </div>
        ) : (
          <div style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}>
            <p className="text-xs uppercase tracking-wider text-gold-dark mb-2">{testimonial.service}</p>
            <p className="text-sm text-gray-700">{testimonial.result || 'Loved the fit and quality. Will definitely order again!'}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
