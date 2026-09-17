import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

export default function ImageGallery({ images = [], productName }) {
  const [current, setCurrent] = useState(0);
  const [zoom, setZoom] = useState(false);

  if (!images.length) return null;

  const next = () => setCurrent(c => (c + 1) % images.length);
  const prev = () => setCurrent(c => (c - 1 + images.length) % images.length);

  return (
    <div className="space-y-4">
      <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-gray-100 group image-zoom-container">
        <AnimatePresence mode="wait">
          <motion.img
            key={current}
            src={images[current]}
            alt={productName}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className={`w-full h-full object-cover ${zoom ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'}`}
            onClick={() => setZoom(!zoom)}
          />
        </AnimatePresence>

        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gold"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gold"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        <button
          onClick={() => setZoom(!zoom)}
          className="absolute top-4 right-4 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gold"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
      </div>

      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`flex-shrink-0 w-20 h-24 rounded-xl overflow-hidden border-2 transition-all ${current === i ? 'border-gold' : 'border-transparent'}`}
            >
              <img src={img} alt={`${productName} ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
