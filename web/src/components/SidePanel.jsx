import { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useDelayedUnmount } from '../hooks/useDelayedUnmount';
import { useFocusTrap } from '../hooks/useFocusTrap';

// Shared slide-in drawer chrome -- backdrop + panel + Escape-to-close +
// body-scroll-lock. Extracted from Navbar's mobile drawer once a second
// real call site (the Shop filter drawer) needed the exact same behavior.
// Uses useDelayedUnmount (plain animate, no AnimatePresence/exit) for the
// same reason documented there: the exit-completion signal got stuck in
// this project's sandboxed test browser when a tab loses visibility.
export default function SidePanel({
  open,
  onClose,
  side = 'left',
  delayMs = 250,
  backdropClassName = 'drawer-backdrop',
  panelClassName = 'mobile-drawer open',
  ariaLabel = 'Panel',
  children,
}) {
  const reduceMotion = useReducedMotion();
  const render = useDelayedUnmount(open, delayMs);
  const panelRef = useRef(null);
  // Gated on `render`, not `open` -- see Modal.jsx's identical comment.
  useFocusTrap(panelRef, render);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!render) return null;

  const offscreen = side === 'right' ? '100%' : '-100%';
  const panelVariants = reduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : { hidden: { x: offscreen }, visible: { x: 0 } };

  return (
    <>
      <motion.div
        className={backdropClassName}
        onClick={onClose}
        animate={{ opacity: open ? 1 : 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.2 }}
      />
      <motion.div
        ref={panelRef}
        className={panelClassName}
        style={side === 'right' ? { left: 'auto', right: 0 } : undefined}
        variants={panelVariants}
        animate={open ? 'visible' : 'hidden'}
        transition={{ duration: reduceMotion ? 0 : 0.25, ease: 'easeOut' }}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
      >
        {children}
      </motion.div>
    </>
  );
}
