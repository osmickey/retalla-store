import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useMotionValueEvent, animate, useReducedMotion } from 'framer-motion';

// Below this many pixels of travel, a pointer gesture is treated as a click
// rather than a drag. Real taps and mouse clicks almost always move a few px.
const DRAG_SLOP = 6;

// Generic drag-to-scroll rail with prev/next arrows, shared by the homepage's
// category and bestseller sections (mirrors how the vanilla site unified
// both into one initSlidableRail() helper). Presentational only -- no data
// fetching, no domain knowledge of what's inside it.
export default function SlidableRail({ wrapClassName, railClassName, visibleCount, prevLabel, nextLabel, children }) {
  const railRef = useRef(null);
  const draggedRef = useRef(false);
  const x = useMotionValue(0);
  const [step, setStep] = useState(0);
  const [maxX, setMaxX] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const reduceMotion = useReducedMotion();
  const count = Array.isArray(children) ? children.length : 1;

  useEffect(() => {
    function measure() {
      const el = railRef.current;
      if (!el?.firstElementChild) return;
      const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
      const s = el.firstElementChild.getBoundingClientRect().width + gap;
      const m = -Math.max(0, el.scrollWidth - el.clientWidth);
      setStep(s);
      setMaxX(m);
      setAtStart(x.get() >= -2);
      setAtEnd(x.get() <= m + 2);
    }
    measure();
    const ro = new ResizeObserver(measure);
    if (railRef.current) ro.observe(railRef.current);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  useMotionValueEvent(x, 'change', (latest) => {
    setAtStart(latest >= -2);
    setAtEnd(latest <= maxX + 2);
  });

  function goTo(target) {
    animate(x, Math.max(maxX, Math.min(0, target)), reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 34 });
  }

  function handleDragEnd(_, info) {
    setIsDragging(false);
    // Suppress the click only when the pointer actually travelled. Previously
    // this flag was set by onDragStart alone -- so a tap with a few px of
    // jitter, or any click following an earlier drag, had its click eaten and
    // the product needed a second click to open.
    draggedRef.current = Math.abs(info.offset.x) > DRAG_SLOP;
    const projected = x.get() + info.velocity.x * 0.12;
    goTo(Math.round(projected / step) * step);
  }

  return (
    <div className={wrapClassName}>
      <button type="button" className="shelf-nav prev" aria-label={prevLabel} disabled={atStart} onClick={() => goTo(x.get() + step * visibleCount)}>
        ‹
      </button>
      <motion.div
        ref={railRef}
        className={`${railClassName}${isDragging ? ' dragging' : ''}`}
        style={{ overflow: 'hidden', x }}
        drag={count > 1 ? 'x' : false}
        dragConstraints={{ left: maxX, right: 0 }}
        dragElastic={0.08}
        // Clears any flag left over from a previous gesture, so a stale
        // "was dragged" can never swallow a later, unrelated click.
        onPointerDownCapture={() => {
          draggedRef.current = false;
        }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        onClickCapture={(e) => {
          if (draggedRef.current) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        {children}
      </motion.div>
      <button type="button" className="shelf-nav next" aria-label={nextLabel} disabled={atEnd} onClick={() => goTo(x.get() - step * visibleCount)}>
        ›
      </button>
    </div>
  );
}
