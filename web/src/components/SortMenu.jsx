import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Icon from '../icons/Icon';
import { useDelayedUnmount } from '../hooks/useDelayedUnmount';

// Offers isn't a sort option here on purpose -- it moved to the Discount
// filter group (see ShopFilters.jsx); sort=offers still works as a Navbar
// shortcut, ShopPage just maps it onto the same discount-filter pipeline.
export const SORT_OPTIONS = [
  { key: '', label: 'Featured' },
  { key: 'new', label: 'New Arrivals' },
  { key: 'bestseller', label: 'Best Sellers' },
  { key: 'price-asc', label: 'Price: Low to High' },
  { key: 'price-desc', label: 'Price: High to Low' },
  { key: 'rating', label: 'Top Rated' },
];

// Small anchored dropdown -- not built on SidePanel (a full-height slide-in
// panel is the wrong shape here). Uses the same useDelayedUnmount pattern
// as every other overlay in this app instead of AnimatePresence/exit.
export default function SortMenu({ value, onChange, options = SORT_OPTIONS }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const render = useDelayedUnmount(open, 180);

  useEffect(() => {
    if (!open) return undefined;
    function onDocClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const current = options.find((o) => o.key === value) || options[0];

  return (
    <div className="sort-menu" ref={rootRef}>
      <button type="button" className="sort-menu-trigger" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span>Sort: {current.label}</span>
        <Icon name="chevron-down" size={14} />
      </button>
      {render && (
        <motion.ul
          className="sort-menu-list"
          role="listbox"
          animate={{ opacity: open ? 1 : 0, y: open ? 0 : -6 }}
          transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.16, 1, 0.3, 1] }}
        >
          {options.map((o) => (
            <li key={o.key} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={o.key === value}
                className={o.key === value ? 'active' : undefined}
                onClick={() => {
                  onChange(o.key);
                  setOpen(false);
                }}
              >
                {o.label}
              </button>
            </li>
          ))}
        </motion.ul>
      )}
    </div>
  );
}
