import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import Icon from '../icons/Icon';
import { api } from '../lib/api';
import { cart, showToast } from '../lib/cart';
import { auth } from '../lib/auth';
import { wishlist, useWishlistIds } from '../lib/wishlist';

// motion(Link) makes the Link itself the animated element (no extra wrapper
// div), so it stays a direct .product-grid child -- required for the CSS
// grid layout to treat each card as a grid item.
const MotionLink = motion(Link);

function StarRow({ rating, size = 14 }) {
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

async function quickAdd(e, productId) {
  e.preventDefault();
  e.stopPropagation();
  try {
    const product = await api.get(`/products/${productId}`);
    cart.add(product, 1);
    showToast(`${product.name} added to cart`);
  } catch (err) {
    showToast(err.message);
  }
}

async function toggleWishlist(e, productId, isWishlisted) {
  e.preventDefault();
  e.stopPropagation();
  if (!auth.requireLogin(window.location.pathname + window.location.search)) return;
  try {
    if (isWishlisted) {
      await wishlist.remove(productId);
      showToast('Removed from wishlist');
    } else {
      await wishlist.add(productId);
      showToast('Added to wishlist');
    }
  } catch (err) {
    showToast(err.message);
  }
}

// Re-fetches the product by id (rather than trusting the grid's possibly
// stale price/stock) before adding -- same as the original quickAdd().
function ProductCard({ product: p, delay = 0, isWishlisted }) {
  const reduceMotion = useReducedMotion();
  const outOfStock = p.stock <= 0;
  const discount = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;

  return (
    <MotionLink
      className="product-card"
      to={`/product.html?id=${p._id}`}
      initial={reduceMotion ? false : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12, margin: '0px 0px -40px 0px' }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay }}
    >
      <div className="thumb">
        {p.isBestSeller && <span className="badge">BESTSELLER</span>}
        <img src={p.image} alt={p.name} loading="lazy" />
        {outOfStock && <div className="badge-outofstock">Out of Stock</div>}
        <motion.button
          type="button"
          className={`wishlist-heart${isWishlisted ? ' active' : ''}`}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={isWishlisted}
          onClick={(e) => toggleWishlist(e, p._id, isWishlisted)}
          whileTap={{ scale: 0.78 }}
        >
          <Icon name={isWishlisted ? 'heart-filled' : 'heart'} size={16} />
        </motion.button>
        {!outOfStock && (
          <button className="quick-add" onClick={(e) => quickAdd(e, p._id)}>
            Quick Add
          </button>
        )}
      </div>
      <div className="product-info">
        <span className="cat">{p.category}</span>
        <h3>{p.name}</h3>
        <div className="rating-row">
          <StarRow rating={p.rating} size={12} />
          <span className="rating-pill">{p.rating.toFixed(1)}</span>
          <span>({p.numReviews})</span>
        </div>
        <div className="price-row">
          <span className="price">Rs. {p.price.toFixed(2)}</span>
          {p.mrp > p.price && (
            <>
              <span className="mrp">Rs. {p.mrp.toFixed(2)}</span>
              <span className="discount">{discount}% off</span>
            </>
          )}
        </div>
        {p.freeDelivery && <span className="free-delivery">Free Delivery</span>}
        <button
          className="btn btn-primary btn-sm add-btn"
          disabled={outOfStock}
          onClick={(e) => quickAdd(e, p._id)}
        >
          {outOfStock ? 'Unavailable' : 'Add to Cart'}
        </button>
      </div>
    </MotionLink>
  );
}

// Stagger is per-card (via whileInView + a capped index-based delay) rather
// than a single parent-orchestrated stagger, so it matches the original
// IntersectionObserver behavior exactly: scroll-triggered, one-shot per
// card, and naturally correct when the product list changes in place (new
// products mean new component instances, so whileInView fires again on its
// own -- no extra remount/key trick needed).
export default function ProductGrid({ products, emptyMessage = 'No products found.' }) {
  const reduceMotion = useReducedMotion();
  // Called once here, not once per card, so N cards don't fire N duplicate
  // /wishlist/ids fetches.
  const wishlistIds = useWishlistIds();

  if (!products.length) {
    return (
      <div className="empty-state">
        <div className="icon-circle">
          <Icon name="search" size={26} />
        </div>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((p, i) => (
        <ProductCard
          key={p._id}
          product={p}
          delay={reduceMotion ? 0 : Math.min(i, 8) * 0.05}
          isWishlisted={wishlistIds.has(p._id)}
        />
      ))}
    </div>
  );
}
