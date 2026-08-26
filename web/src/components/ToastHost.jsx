import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useDelayedUnmount } from '../hooks/useDelayedUnmount';

// Mounted once at the app root. showToast() (web/src/lib/cart.js) dispatches
// 'retalla:toast' instead of touching the DOM directly, so this can animate
// the exit properly -- the old version just yanked the node out via
// setTimeout+remove() with no way to animate out. Uses useDelayedUnmount
// (a plain timer) rather than AnimatePresence to drive the actual
// removal -- see that hook's comment for why.
export default function ToastHost() {
  const [message, setMessage] = useState(null);
  const [visible, setVisible] = useState(false);
  const render = useDelayedUnmount(visible, 250);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let hideTimer;
    const onToast = (e) => {
      setMessage(e.detail);
      setVisible(true);
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setVisible(false), 2200);
    };
    window.addEventListener('retalla:toast', onToast);
    return () => {
      window.removeEventListener('retalla:toast', onToast);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!render) return null;

  return (
    <motion.div
      className="toast"
      animate={{ opacity: visible ? 1 : 0, y: reduceMotion ? 0 : visible ? 0 : 10 }}
      transition={{ duration: reduceMotion ? 0 : 0.25 }}
    >
      {message}
    </motion.div>
  );
}
