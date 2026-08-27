import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDelayedUnmount } from '../hooks/useDelayedUnmount';

// Built on the existing .app-modal-overlay/.app-modal CSS (ported from
// public/js/modal.js) rather than a fresh framer-motion implementation --
// this project avoids AnimatePresence for anything that exits/unmounts
// (its completion callback gets stuck when the tab is backgrounded
// mid-animation), using useDelayedUnmount + a toggled CSS class instead.
const CLOSE_MS = 180; // matches appModalFadeOut/appModalPopOut's 0.18s in style.css

export default function Modal({ open, onClose, labelledBy, children }) {
  const render = useDelayedUnmount(open, CLOSE_MS);

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

  return createPortal(
    <div
      className={`app-modal-overlay${open ? '' : ' closing'}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="app-modal app-modal-form" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
        {children}
      </div>
    </div>,
    document.body
  );
}
