import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, animate, useReducedMotion } from 'framer-motion';
import { api } from '../lib/api';

const AUTOPLAY_MS = 2000;

export default function BannerCarousel() {
  const [banners, setBanners] = useState(null); // null = loading
  const railRef = useRef(null);
  const draggedRef = useRef(false);
  const x = useMotionValue(0);
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState(0);
  const [maxX, setMaxX] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let cancelled = false;
    api
      .get('/banners')
      .then((d) => !cancelled && setBanners(d))
      .catch(() => !cancelled && setBanners([]));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function measure() {
      const el = railRef.current;
      if (!el?.firstElementChild) return;
      const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
      setStep(el.firstElementChild.getBoundingClientRect().width + gap);
      setMaxX(-Math.max(0, el.scrollWidth - el.clientWidth));
    }
    measure();
    const ro = new ResizeObserver(measure);
    if (railRef.current) ro.observe(railRef.current);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [banners]);

  useEffect(() => {
    if (!step) return;
    animate(x, Math.max(-index * step, maxX), reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 32 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, step, maxX, reduceMotion]);

  useEffect(() => {
    if (!banners || banners.length <= 1 || paused || !step) return undefined;
    const id = setInterval(() => {
      setIndex((i) => (-(i * step) <= maxX ? 0 : i + 1));
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [banners, paused, step, maxX]);

  if (!banners || banners.length === 0) return null;

  function handleDragEnd(_, info) {
    setPaused(false);
    setIsDragging(false);
    const projected = x.get() + info.velocity.x * 0.15;
    setIndex(Math.max(0, Math.min(banners.length - 1, Math.round(-projected / step))));
  }

  return (
    <section className="banner-carousel-section">
      <motion.div
        ref={railRef}
        className={`banner-carousel${isDragging ? ' dragging' : ''}`}
        style={{ display: 'flex', gap: 14, overflow: 'hidden', x }}
        drag={banners.length > 1 ? 'x' : false}
        dragConstraints={{ left: maxX, right: 0 }}
        dragElastic={0.1}
        onDragStart={() => {
          draggedRef.current = true;
          setIsDragging(true);
          setPaused(true);
        }}
        onDragEnd={handleDragEnd}
      >
        {banners.map((b, i) => (
          <div className="banner-carousel-slide" key={b._id}>
            {b.link ? (
              <a
                href={b.link}
                draggable={false}
                onClickCapture={(e) => {
                  if (draggedRef.current) {
                    e.preventDefault();
                    draggedRef.current = false;
                  }
                }}
              >
                <img src={b.image} alt="Promotional banner" loading={i === 0 ? 'eager' : 'lazy'} draggable={false} />
              </a>
            ) : (
              <img src={b.image} alt="Promotional banner" loading={i === 0 ? 'eager' : 'lazy'} draggable={false} />
            )}
          </div>
        ))}
      </motion.div>
      {banners.length > 1 && (
        <div className="banner-carousel-dots">
          {banners.map((b, i) => (
            <span
              key={b._id}
              className={`banner-carousel-dot${i === index ? ' active' : ''}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
