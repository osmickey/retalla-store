import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { wishlist } from '../lib/wishlist';
import { cart, showToast } from '../lib/cart';
import Icon from '../icons/Icon';

function StarRow({ rating, size = 13 }) {
  const rounded = Math.round(rating);
  return (
    <span className="star-row">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`star-ico ${i <= rounded ? 'filled' : 'muted'}`}>
          <Icon name="star" size={size} />
        </span>
      ))}
    </span>
  );
}

const REMOVE_DURATION = 250;

export default function WishlistPage() {
  useDocumentTitle('My Wishlist — Retalla');
  const [items, setItems] = useState(null); // null while loading
  const [removingIds, setRemovingIds] = useState(() => new Set());
  const reduceMotion = useReducedMotion();

  function load() {
    wishlist
      .getProducts()
      .then(setItems)
      .catch((err) => {
        showToast(err.message);
        setItems([]);
      });
  }

  useEffect(() => {
    load();
    window.addEventListener('retalla:wishlist-changed', load);
    return () => window.removeEventListener('retalla:wishlist-changed', load);
  }, []);

  // Fades the row first (matches CartPage's removal pattern), then removes
  // it from the list once the fade finishes -- not just an instant cut.
  function handleRemove(productId) {
    setRemovingIds((prev) => new Set(prev).add(productId));
    setTimeout(async () => {
      try {
        await wishlist.remove(productId);
      } catch (err) {
        showToast(err.message);
      }
      setItems((prev) => (prev || []).filter((p) => p._id !== productId));
      setRemovingIds((prev) => {
        const copy = new Set(prev);
        copy.delete(productId);
        return copy;
      });
    }, REMOVE_DURATION);
  }

  function handleAddToCart(product) {
    cart.add(product, 1);
    showToast(`${product.name} added to cart`);
  }

  return (
    <main className="container">
      <div className="breadcrumb">
        <a href="/index.html">Home</a> / <span>My Wishlist</span>
      </div>

      <div className="cart-head">
        <h1>My Wishlist</h1>
        <a href="/shop.html" className="btn btn-outline btn-sm">
          Continue Shopping
        </a>
      </div>

      {items === null ? (
        <div className="dot-loader">
          <span></span>
          <span></span>
          <span></span>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="icon-circle">
            <Icon name="heart" size={30} />
          </div>
          <p>Your wishlist is empty.</p>
          <a className="btn btn-primary" href="/shop.html">
            Discover Products
          </a>
        </div>
      ) : (
        <div>
          {items.map((p) => {
            const removing = removingIds.has(p._id);
            const outOfStock = p.stock <= 0;
            return (
              <motion.div
                key={p._id}
                className="wishlist-item"
                layout={!reduceMotion}
                // Under reduced motion, opacity/height are driven by a plain
                // style prop instead of framer's animate -- see CartPage.jsx
                // for why (animate + a duration:0 transition doesn't
                // reliably commit on updates once multiple sibling rows
                // share this animate shape).
                initial={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                animate={reduceMotion ? undefined : { opacity: removing ? 0 : 1, height: removing ? 0 : 'auto' }}
                transition={{ duration: REMOVE_DURATION / 1000, ease: 'easeOut' }}
                style={reduceMotion ? { opacity: removing ? 0 : 1, height: removing ? 0 : 'auto', overflow: 'hidden' } : undefined}
              >
                <img src={p.image} alt={p.name} />
                <div className="wishlist-item-info">
                  <h4>{p.name}</h4>
                  <div className="rating-row">
                    <StarRow rating={p.rating} />
                    <span>({p.numReviews})</span>
                  </div>
                  <span className={`wishlist-item-availability ${outOfStock ? 'out-of-stock' : 'in-stock'}`}>
                    {outOfStock ? 'Out of stock' : 'In stock'}
                  </span>
                </div>
                <div className="wishlist-item-actions">
                  <span className="price">Rs. {p.price.toFixed(2)}</span>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={outOfStock}
                    onClick={() => handleAddToCart(p)}
                  >
                    {outOfStock ? 'Unavailable' : 'Add to Cart'}
                  </button>
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => handleRemove(p._id)}
                    disabled={removing}
                    aria-label="Remove from wishlist"
                    title="Remove from wishlist"
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </main>
  );
}
