import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useScrolledPast } from '../hooks/useScrolledPast';
import { useDelayedUnmount } from '../hooks/useDelayedUnmount';
import { api } from '../lib/api';
import { auth } from '../lib/auth';
import { cart, showToast } from '../lib/cart';
import { EASE } from '../lib/motion';
import { recentlyViewed } from '../lib/recentlyViewed';
import { wishlist, useWishlistIds } from '../lib/wishlist';
import Icon from '../icons/Icon';
import QtyStepper from '../components/QtyStepper';
import SortMenu from '../components/SortMenu';
import SlidableRail from '../components/SlidableRail';
import { ProductCard } from '../components/ProductGrid';
import VariantSelector from '../components/VariantSelector';
import CartDrawer from '../components/CartDrawer';
import ErrorState from '../components/ErrorState';
import { ProductDetailSkeleton, ReviewListSkeleton, ProductGridSkeleton } from '../components/Skeleton';

function StarRow({ rating, size = 16 }) {
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

function ProductGallery({ product, overrideImage }) {
  const images = useMemo(() => {
    const base = [product.image, ...(product.images || [])];
    return overrideImage && !base.includes(overrideImage) ? [overrideImage, ...base] : base;
  }, [product, overrideImage]);
  const [mainSrc, setMainSrc] = useState(images[0]);
  const [zooming, setZooming] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const reduceMotion = useReducedMotion();

  // Nudges the main image to follow the active variant's photo. An option
  // without its own image leaves whatever's showing alone, rather than
  // snapping back to the base image -- less surprising when the *other*
  // variant group is the one being changed.
  useEffect(() => {
    if (overrideImage) setMainSrc(overrideImage);
  }, [overrideImage]);

  // Desktop-only by nature -- touch devices don't fire continuous
  // mousemove, so mobile just keeps tap-a-thumbnail with no zoom.
  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    setOrigin({
      x: Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)),
    });
  }

  return (
    <div className="pd-gallery">
      {/* All images stay mounted, stacked, and cross-fade via opacity --
          rather than unmounting the outgoing one (AnimatePresence's exit),
          which depends on an animation-completion signal that isn't
          reliable when the tab is hidden/backgrounded. This also avoids
          any flash-of-missing-image mid-swap as a side benefit.

          Under reduced motion, opacity is driven by a plain style prop
          instead of framer's `animate` -- verified directly (not assumed)
          that `animate` + a duration:0 transition does not reliably commit
          on *updates* in this framer-motion version once more than one
          motion.img shares this animate shape (only surfaces with 2+
          images; single-image products never exercised this path before).
          Skipping framer's animate pathway entirely under reduced motion
          sidesteps that rather than depending on its duration:0 handling --
          same "skip the animated pathway" convention QtyStepper/CartBadge
          already use elsewhere in this app, just applied at the value
          level instead of the trigger level. This also means zoom's
          `scale` (which only ever applies via `animate`) naturally never
          activates under reduced motion, matching framer's own stance on
          transform-family values -- not fought against.

          Zoom's `scale` lives in the SAME `animate` object as `opacity`
          (not a plain style.transform) -- framer-motion only recomputes
          `transform` itself once a transform-family key is under its own
          tracked values, so mixing a manual transform in alongside a
          framer-tracked one would get silently clobbered. transformOrigin
          stays a plain style prop -- framer never touches that. */}
      <div
        className="main-image"
        style={{ position: 'relative' }}
        onMouseEnter={() => setZooming(true)}
        onMouseLeave={() => setZooming(false)}
        onMouseMove={handleMouseMove}
      >
        {images.map((src) => {
          const isActive = src === mainSrc;
          return (
            <motion.img
              key={src}
              src={src}
              alt={product.name}
              animate={reduceMotion ? undefined : { opacity: isActive ? 1 : 0, scale: zooming && isActive ? 1.8 : 1 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: isActive ? 'auto' : 'none',
                transformOrigin: `${origin.x}% ${origin.y}%`,
                opacity: reduceMotion ? (isActive ? 1 : 0) : undefined,
              }}
            />
          );
        })}
      </div>
      {images.length > 1 && (
        <div className="pd-thumbs">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setMainSrc(src)}
              aria-current={src === mainSrc ? 'true' : undefined}
            >
              <motion.img
                src={src}
                alt={`${product.name} — view ${i + 1}`}
                className={src === mainSrc ? 'active' : ''}
                whileHover={reduceMotion ? {} : { scale: 1.05 }}
                transition={{ duration: 0.15 }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DeliveryCheck({ product }) {
  const [pincode, setPincode] = useState('');
  const [result, setResult] = useState(null); // { type: 'error'|'loading'|'success', ...data }
  const reduceMotion = useReducedMotion();

  async function checkDelivery() {
    if (!/^[0-9]{6}$/.test(pincode)) {
      setResult({ type: 'error', message: 'Enter a valid 6-digit pincode.' });
      return;
    }
    setResult({ type: 'loading' });
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await res.json();
      const postOffice = data?.[0]?.PostOffice?.[0];
      if (!postOffice) {
        setResult({ type: 'error', message: "We couldn't find that pincode. Please check and try again." });
        return;
      }
      const days = product.freeDelivery ? 5 : 7;
      const deliveryDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      });
      setResult({ type: 'success', district: postOffice.District, state: postOffice.State, deliveryDate });
    } catch {
      setResult({ type: 'error', message: "Couldn't check delivery right now. Please try again." });
    }
  }

  return (
    <div className="delivery-check">
      <div className="delivery-check-row">
        <Icon name="truck" size={18} />
        <input
          type="text"
          maxLength={6}
          inputMode="numeric"
          placeholder="Enter pincode to check delivery"
          value={pincode}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        />
        <button type="button" className="btn btn-outline btn-sm" onClick={checkDelivery}>
          Check
        </button>
      </div>
      {result && (
        <motion.div
          key={result.type + (result.message || result.district || '')}
          className="delivery-check-result"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }}
        >
          {result.type === 'loading' && <span className="delivery-check-loading">Checking availability...</span>}
          {result.type === 'error' && <span className="delivery-check-error">{result.message}</span>}
          {result.type === 'success' && (
            <div className="delivery-check-success">
              <Icon name="check" size={16} />
              <div>
                <strong>
                  Delivering to {result.district}, {result.state}
                </strong>
                <span>Estimated delivery by {result.deliveryDate}</span>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

// Real per-product policy facts, reformatted as Q&A -- nothing fabricated,
// nothing shown here that isn't already stated elsewhere on this same page.
function buildFaqItems(product) {
  return [
    {
      q: 'What are the delivery charges?',
      a: product.freeDelivery
        ? 'This product ships free, with no delivery charge.'
        : `A delivery charge of Rs. ${(product.deliveryCharge || 0).toFixed(2)} applies to this product.`,
    },
    {
      q: 'What is the return policy?',
      a: product.isReturnable
        ? 'This product is eligible for a 7-day return window from the date of delivery.'
        : 'This item is part of a final-sale category and is not eligible for return.',
    },
    {
      q: 'Is Cash on Delivery available?',
      a:
        product.codAvailable !== false
          ? 'Yes, Cash on Delivery is available for this product.'
          : 'This product requires prepaid online payment; Cash on Delivery is not available.',
    },
    { q: 'Is checkout secure?', a: 'Yes — all payments are processed through an encrypted, secure checkout.' },
  ];
}

function FaqAccordion({ product }) {
  const [openIndex, setOpenIndex] = useState(null);
  const reduceMotion = useReducedMotion();
  const items = buildFaqItems(product);

  return (
    <section id="faq-section" className="section">
      <div className="section-head">
        <h2>Questions & Answers</h2>
      </div>
      <div className="faq-list">
        {items.map((item, i) => {
          const open = openIndex === i;
          return (
            <div className="faq-item" key={item.q}>
              <button
                type="button"
                className="faq-question"
                aria-expanded={open}
                onClick={() => setOpenIndex(open ? null : i)}
              >
                {item.q}
                <Icon name="chevron-down" size={16} className={open ? 'rotated' : undefined} />
              </button>
              <motion.div
                className="faq-answer"
                animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.2, ease: 'easeOut' }}
                style={reduceMotion ? { height: open ? 'auto' : 0, opacity: open ? 1 : 0 } : undefined}
              >
                <p>{item.a}</p>
              </motion.div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ProductStory({ product }) {
  return (
    <section id="description-section" className="section">
      <div className="section-head">
        <h2>About This Product</h2>
      </div>
      <p className="pd-story-text">{product.description || 'No description available for this product.'}</p>
      <div className="pd-fact-chips">
        <span className="pd-fact-chip">
          <Icon name="tag" size={14} />
          {product.category}
        </span>
        {product.freeDelivery && (
          <span className="pd-fact-chip">
            <Icon name="truck" size={14} />
            Free Delivery
          </span>
        )}
        {product.isReturnable && (
          <span className="pd-fact-chip">
            <Icon name="return" size={14} />
            7-Day Returns
          </span>
        )}
        {product.codAvailable !== false && (
          <span className="pd-fact-chip">
            <Icon name="wallet" size={14} />
            COD Available
          </span>
        )}
        {product.numReviews > 0 && (
          <span className="pd-fact-chip">
            <Icon name="star" size={14} />
            {product.rating.toFixed(1)} rated
          </span>
        )}
      </div>
    </section>
  );
}

function StickyPurchaseBar({ visible, product, image, displayPrice, discount, outOfStock, onAddToCart, onBuyNow }) {
  const reduceMotion = useReducedMotion();
  const render = useDelayedUnmount(visible, 200);
  if (!render) return null;
  return (
    <motion.div
      className="pd-sticky-bar"
      role="region"
      aria-label="Quick purchase"
      animate={{ y: visible ? 0 : '100%', opacity: visible ? 1 : 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.25, ease: EASE }}
      style={reduceMotion ? { transform: visible ? 'none' : 'translateY(100%)', opacity: visible ? 1 : 0 } : undefined}
    >
      <div className="pd-sticky-bar-inner container">
        <img src={image} alt="" className="pd-sticky-bar-thumb" />
        <div className="pd-sticky-bar-info">
          <strong>{product.name}</strong>
          <span className="pd-sticky-bar-price">
            Rs. {displayPrice.toFixed(2)}
            {discount > 0 && <span className="discount">{discount}% off</span>}
          </span>
        </div>
        <div className="pd-sticky-bar-actions">
          <button type="button" className="btn btn-primary btn-sm" disabled={outOfStock} onClick={onAddToCart}>
            Add to Cart
          </button>
          <button type="button" className="btn btn-accent btn-sm" disabled={outOfStock} onClick={onBuyNow}>
            Buy Now
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ReviewCard({ review }) {
  const name = review.user?.name || 'Anonymous';
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className="review-card"
      layout={!reduceMotion}
      initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.3 }}
    >
      <div className="review-card-head">
        <span className="avatar">{initials}</span>
        <div className="review-card-who">
          <strong>
            {name}
            {/* Every review is purchase-gated server-side (see the eligibility
                check below), so this is true by construction, not a claim
                being invented for display. */}
            <span className="review-verified">
              <Icon name="check" size={11} />
              Verified Purchase
            </span>
          </strong>
          <span className="review-date">
            {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
        <StarRow rating={review.rating} size={14} />
      </div>
      <p className="review-comment">{review.comment}</p>
    </motion.div>
  );
}

function StarInput({ value, onChange }) {
  return (
    <div className="star-input" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.button
          key={i}
          type="button"
          className={`star-btn${i <= value ? ' active' : ''}`}
          onClick={() => onChange(i)}
          whileTap={{ scale: 0.85 }}
          aria-label={`Rate ${i} star${i === 1 ? '' : 's'}`}
        >
          <Icon name="star" size={26} />
        </motion.button>
      ))}
    </div>
  );
}

const REVIEW_SORT_OPTIONS = [
  { key: 'recent', label: 'Most Recent' },
  { key: 'highest', label: 'Highest Rated' },
  { key: 'lowest', label: 'Lowest Rated' },
];

function sortReviews(list, key) {
  const copy = [...list];
  if (key === 'highest') copy.sort((a, b) => b.rating - a.rating);
  else if (key === 'lowest') copy.sort((a, b) => a.rating - b.rating);
  else copy.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return copy;
}

// Eligibility-gated review form, modeled as one explicit state rather than a
// pile of booleans: loading | logged-out | already-reviewed | not-eligible | can-review.
function Reviews({ product, pathname, search }) {
  const [reviews, setReviews] = useState(null);
  const [reviewsError, setReviewsError] = useState(null);
  const [gateState, setGateState] = useState('loading');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewSort, setReviewSort] = useState('recent');

  async function loadReviews() {
    setReviewsError(null);
    try {
      const data = await api.get(`/products/${product._id}/reviews`);
      setReviews(data);
    } catch (err) {
      setReviewsError(err.message);
    }
  }

  async function loadGate() {
    if (!auth.isLoggedIn()) {
      setGateState('logged-out');
      return;
    }
    try {
      const eligibility = await api.get(`/products/${product._id}/reviews/eligibility`);
      if (eligibility.canReview) setGateState('can-review');
      else if (eligibility.reason === 'already_reviewed') setGateState('already-reviewed');
      else setGateState('not-eligible');
    } catch {
      setGateState('not-eligible');
    }
  }

  useEffect(() => {
    loadReviews();
    loadGate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product._id]);

  async function submitReview() {
    setFormError('');
    if (!rating) {
      setFormError('Please select a star rating.');
      return;
    }
    if (!comment.trim()) {
      setFormError('Please write a comment.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/products/${product._id}/reviews`, { rating, comment: comment.trim() });
      showToast('Review submitted — thank you!');
      setRating(0);
      setComment('');
      await loadReviews();
      await loadGate();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const avg = reviews && reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews ? reviews.filter((r) => Math.round(r.rating) === star).length : 0,
  }));
  const sortedReviews = reviews ? sortReviews(reviews, reviewSort) : null;

  return (
    <section id="reviews-section" className="section">
      <div className="section-head">
        <h2>Reviews</h2>
      </div>

      {reviews && reviews.length > 0 && (
        <>
          <div className="review-summary-head">
            <div className="review-summary">
              <div className="review-summary-score">{avg.toFixed(1)}</div>
              <div>
                <StarRow rating={avg} size={18} />
                <div className="review-summary-count">
                  {reviews.length} review{reviews.length === 1 ? '' : 's'}
                </div>
              </div>
            </div>
            <SortMenu value={reviewSort} onChange={setReviewSort} options={REVIEW_SORT_OPTIONS} />
          </div>
          <div className="rating-distribution">
            {distribution.map(({ star, count }) => (
              <div className="rating-distribution-row" key={star}>
                <span>{star} star</span>
                <div className="rating-distribution-track">
                  <div
                    className="rating-distribution-fill"
                    style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : '0%' }}
                  />
                </div>
                <span>{count}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {gateState === 'logged-out' && (
        <div className="review-gate">
          <Icon name="user" size={20} />
          <p>
            Please <a href={`/login.html?redirect=${encodeURIComponent(pathname + search)}`}>login</a> to write a review.
          </p>
        </div>
      )}
      {gateState === 'already-reviewed' && (
        <div className="review-gate success">
          <Icon name="check" size={20} />
          <p>You've already reviewed this product. Thanks for your feedback!</p>
        </div>
      )}
      {gateState === 'not-eligible' && (
        <div className="review-gate">
          <Icon name="box" size={20} />
          <p>Only customers who've purchased this product can write a review.</p>
        </div>
      )}
      {gateState === 'can-review' && (
        <div className="review-form-card">
          <h3>Write a Review</h3>
          <StarInput value={rating} onChange={setRating} />
          {formError && (
            <div id="review-form-error" role="alert" className="form-message error">
              {formError}
            </div>
          )}
          <textarea
            rows={3}
            className="review-textarea"
            placeholder="Share your experience with this product..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button
            className="btn btn-primary"
            onClick={submitReview}
            disabled={submitting}
            aria-describedby={formError ? 'review-form-error' : undefined}
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      )}

      {reviewsError ? (
        <ErrorState message={reviewsError} onRetry={loadReviews} />
      ) : sortedReviews === null ? (
        <ReviewListSkeleton count={3} />
      ) : sortedReviews.length === 0 ? (
        <div className="empty-state">
          <p>No reviews yet — be the first to review this product!</p>
        </div>
      ) : (
        <div className="review-list">
          <AnimatePresence>
            {sortedReviews.map((r) => (
              <ReviewCard key={r._id} review={r} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}

function RelatedProducts({ product, wishlistIds }) {
  const [related, setRelated] = useState(null);
  const [error, setError] = useState(null);

  function load() {
    setError(null);
    let cancelled = false;
    api
      .get(`/products?category=${encodeURIComponent(product.category)}&limit=9`)
      .then((results) => {
        if (cancelled) return;
        setRelated(results.filter((p) => p._id !== product._id).slice(0, 4));
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => load(), [product._id, product.category]);

  if (error) {
    return (
      <section id="related-section" className="section">
        <div className="section-head">
          <h2>You May Also Like</h2>
        </div>
        <ErrorState message={error} onRetry={load} />
      </section>
    );
  }
  if (related === null) {
    return (
      <section id="related-section" className="section">
        <div className="section-head">
          <h2>You May Also Like</h2>
        </div>
        <ProductGridSkeleton count={4} />
      </section>
    );
  }
  if (related.length === 0) return null;

  return (
    <section id="related-section" className="section">
      <div className="section-head">
        <h2>You May Also Like</h2>
      </div>
      <SlidableRail
        wrapClassName="related-rail"
        railClassName="related-shelf"
        visibleCount={4}
        prevLabel="Previous related products"
        nextLabel="More related products"
      >
        {related.map((p, i) => (
          <ProductCard key={p._id} product={p} delay={i * 0.05} isWishlisted={wishlistIds.has(p._id)} />
        ))}
      </SlidableRail>
    </section>
  );
}

export default function ProductPage() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const wishlistIds = useWishlistIds();
  const actionsRef = useRef(null);
  const scrolledPastActions = useScrolledPast(actionsRef);

  useDocumentTitle(product ? `${product.name} — Retalla` : 'Product — Retalla');

  function loadProduct() {
    if (!id) {
      setError('Product not found.');
      return undefined;
    }
    setError('');
    let cancelled = false;
    api
      .get(`/products/${id}`)
      .then((p) => {
        if (cancelled) return;
        setProduct(p);
        setQty(1);
        recentlyViewed.record(p._id);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => loadProduct(), [id]);

  // Reset + re-seed default (first option per group) whenever a different
  // product loads -- same reasoning as the setQty(1) reset above: a stale
  // selection must never leak from one product to the next.
  useEffect(() => {
    if (!product?.variants?.length) {
      setSelectedOptions({});
      return;
    }
    const defaults = {};
    product.variants.forEach((group) => {
      if (group.options?.length) defaults[group.name] = group.options[0].value;
    });
    setSelectedOptions(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?._id]);

  const activeOptions = useMemo(() => {
    if (!product?.variants?.length) return [];
    return product.variants
      .map((group) => group.options?.find((o) => o.value === selectedOptions[group.name]))
      .filter(Boolean);
  }, [product, selectedOptions]);

  // Everything price/stock/image-related that depends on the active variant
  // selection, computed once here so the JSX below and currentVariantDescriptor()
  // both read the same values instead of two separate derivations drifting
  // apart. Safe to run unconditionally (before the !product early return)
  // since every field falls back sensibly when product is still null.
  const variantPriceDelta = activeOptions.reduce((sum, o) => sum + (o.priceDelta || 0), 0);
  const displayPrice = (product?.price || 0) + variantPriceDelta;
  const displayMrp = (product?.mrp || 0) + variantPriceDelta;
  const discount = displayMrp > displayPrice ? Math.round(((displayMrp - displayPrice) / displayMrp) * 100) : 0;
  const optionStocks = activeOptions.map((o) => o.stock).filter((s) => s != null);
  const displayStock = optionStocks.length ? Math.min(product?.stock ?? 0, ...optionStocks) : product?.stock ?? 0;
  const variantImage = activeOptions.map((o) => o.image).find(Boolean) || null;
  const outOfStock = displayStock <= 0;

  function stepQty(delta, max) {
    setQty((q) => Math.min(max || 99, Math.max(1, q + delta)));
  }

  function currentVariantDescriptor() {
    if (!product.variants?.length) return null;
    return {
      key: product.variants.map((g) => `${g.name}:${selectedOptions[g.name] || ''}`).join('|'),
      label: activeOptions.map((o) => o.label).join(' / '),
      image: variantImage,
      priceDelta: variantPriceDelta,
    };
  }

  function addToCart() {
    cart.add(product, qty, currentVariantDescriptor());
    setDrawerOpen(true);
  }

  function buyNow() {
    cart.add(product, qty, currentVariantDescriptor());
    window.location.href = '/checkout.html';
  }

  async function toggleWishlist() {
    if (!auth.requireLogin(window.location.pathname + window.location.search)) return;
    try {
      if (isWishlisted) {
        await wishlist.remove(product._id);
        showToast('Removed from wishlist');
      } else {
        await wishlist.add(product._id);
        showToast('Added to wishlist');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  if (error) {
    return (
      <main className="container">
        <ErrorState
          message={error}
          onRetry={id ? loadProduct : undefined}
          secondaryAction={{ label: 'Back to Shop', href: '/shop.html' }}
        />
      </main>
    );
  }

  if (!product) {
    return (
      <main className="container">
        <ProductDetailSkeleton />
      </main>
    );
  }

  const isWishlisted = wishlistIds.has(product._id);

  return (
    <main className="container product-page">
      <div className="breadcrumb">
        <a href="/index.html">Home</a> / <a href="/shop.html">Shop</a> / <span>{product.name}</span>
      </div>

      <div className="product-detail">
        <ProductGallery key={product._id} product={product} overrideImage={variantImage} />

        <div className="pd-info">
          <span className="cat">
            {product.category}
            {product.brand ? ` · ${product.brand}` : ''}
          </span>
          <h1>{product.name}</h1>
          {product.sku && <div className="pd-sku">SKU: {product.sku}</div>}
          <div className="rating-row">
            <StarRow rating={product.rating} size={16} />
            <span className="rating-pill">{product.rating.toFixed(1)}</span>
            <a href="#reviews-section">({product.numReviews} reviews)</a>
            {product.isBestSeller && (
              <span className="badge" style={{ position: 'static' }}>
                BESTSELLER
              </span>
            )}
          </div>
          <div className="price-row">
            <motion.span
              key={displayPrice}
              className="price"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
            >
              Rs. {displayPrice.toFixed(2)}
            </motion.span>
            {displayMrp > displayPrice && (
              <>
                <span className="mrp">Rs. {displayMrp.toFixed(2)}</span>
                <span className="discount">{discount}% off</span>
              </>
            )}
          </div>

          <VariantSelector
            groups={product.variants}
            selected={selectedOptions}
            onSelect={(groupName, value) => setSelectedOptions((prev) => ({ ...prev, [groupName]: value }))}
          />

          <DeliveryCheck product={product} />

          <QtyStepper
            value={qty}
            min={1}
            max={displayStock}
            onDecrement={() => stepQty(-1, displayStock)}
            onIncrement={() => stepQty(1, displayStock)}
            onInputChange={(v) => {
              const n = Number(v);
              if (n) setQty(Math.min(displayStock || 99, Math.max(1, n)));
            }}
          />
          <div className="pd-actions" ref={actionsRef}>
            <button className="btn btn-primary" disabled={outOfStock} onClick={addToCart}>
              Add to Cart
            </button>
            <button className="btn btn-accent" disabled={outOfStock} onClick={buyNow}>
              Buy Now
            </button>
            <motion.button
              type="button"
              className={`pd-wishlist-btn${isWishlisted ? ' active' : ''}`}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              aria-pressed={isWishlisted}
              onClick={toggleWishlist}
              whileTap={{ scale: 0.85 }}
            >
              <Icon name={isWishlisted ? 'heart-filled' : 'heart'} size={20} />
            </motion.button>
          </div>

          {/* Trimmed to the 3 that matter at the moment of buying -- the
              full 4-card set lives in the Shipping & Returns section below,
              a separate class rather than reusing .pd-badges at a different
              item count (that grid is hard-coded to 2 columns; 3 items in
              2 columns leaves an empty cell). */}
          <div className="pd-trust-strip">
            <div className="pd-badge">
              <span className="icon-circle">
                <Icon name="truck" size={16} />
              </span>
              <div>
                <strong>{product.freeDelivery ? 'Free Delivery' : 'Paid Delivery'}</strong>
                <span>{outOfStock ? 'Out of stock' : `${displayStock} in stock`}</span>
              </div>
            </div>
            <div className="pd-badge">
              <span className="icon-circle">
                <Icon name="return" size={16} />
              </span>
              <div>
                <strong>{product.isReturnable ? '7 Days Return' : 'Non-Returnable'}</strong>
                <span>{product.isReturnable ? 'Easy & free returns' : 'Final sale item'}</span>
              </div>
            </div>
            <div className="pd-badge">
              <span className="icon-circle">
                <Icon name="check" size={16} />
              </span>
              <div>
                <strong>Secure Payment</strong>
                <span>Safe &amp; encrypted checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProductStory product={product} />

      <section id="specifications-section" className="section">
        <div className="section-head">
          <h2>Specifications</h2>
        </div>
        <div className="pd-highlights">
          <table>
            <tbody>
              {product.brand && (
                <tr>
                  <td>Brand</td>
                  <td>{product.brand}</td>
                </tr>
              )}
              <tr>
                <td>Category</td>
                <td>{product.category}</td>
              </tr>
              {product.sku && (
                <tr>
                  <td>Product Code</td>
                  <td>{product.sku}</td>
                </tr>
              )}
              <tr>
                <td>Availability</td>
                <td>{outOfStock ? 'Out of stock' : `${displayStock} units in stock`}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="shipping-section" className="section">
        <div className="section-head">
          <h2>Shipping &amp; Returns</h2>
        </div>
        <div className="pd-badges">
          <div className="pd-badge">
            <span className="icon-circle">
              <Icon name="truck" size={16} />
            </span>
            <div>
              <strong>{product.freeDelivery ? 'Free Delivery' : 'Paid Delivery'}</strong>
              <span>{product.freeDelivery ? 'No delivery charge' : `Rs. ${(product.deliveryCharge || 0).toFixed(2)} delivery charge`}</span>
            </div>
          </div>
          <div className="pd-badge">
            <span className="icon-circle">
              <Icon name="return" size={16} />
            </span>
            <div>
              <strong>{product.isReturnable ? '7 Days Return' : 'Non-Returnable'}</strong>
              <span>{product.isReturnable ? 'Easy & free returns' : 'Final sale item'}</span>
            </div>
          </div>
          <div className="pd-badge">
            <span className="icon-circle">
              <Icon name="wallet" size={16} />
            </span>
            <div>
              <strong>{product.codAvailable !== false ? 'COD Available' : 'Prepaid Only'}</strong>
              <span>{product.codAvailable !== false ? 'Pay on delivery' : 'Online payment required'}</span>
            </div>
          </div>
          <div className="pd-badge">
            <span className="icon-circle">
              <Icon name="check" size={16} />
            </span>
            <div>
              <strong>Secure Payment</strong>
              <span>Safe &amp; encrypted checkout</span>
            </div>
          </div>
        </div>
      </section>

      {product.videoUrl && (
        <section id="video-section" className="section">
          <div className="section-head">
            <h2>Product Video</h2>
          </div>
          <div className="pd-video">
            <video
              src={product.videoUrl}
              poster={product.image}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              onClick={(e) => {
                e.target.controls = true;
              }}
            />
          </div>
        </section>
      )}

      <Reviews product={product} pathname={window.location.pathname} search={window.location.search} />
      <FaqAccordion product={product} />
      <RelatedProducts product={product} wishlistIds={wishlistIds} />

      <StickyPurchaseBar
        visible={scrolledPastActions}
        product={product}
        image={variantImage || product.image}
        displayPrice={displayPrice}
        discount={discount}
        outOfStock={outOfStock}
        onAddToCart={addToCart}
        onBuyNow={buyNow}
      />
      <CartDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </main>
  );
}
