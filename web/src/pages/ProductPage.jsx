import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { api } from '../lib/api';
import { auth } from '../lib/auth';
import { cart, showToast } from '../lib/cart';
import { recentlyViewed } from '../lib/recentlyViewed';
import Icon from '../icons/Icon';
import QtyStepper from '../components/QtyStepper';
import ProductGrid from '../components/ProductGrid';

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

function ProductGallery({ product }) {
  const images = [product.image, ...(product.images || [])];
  const [mainSrc, setMainSrc] = useState(product.image);
  const reduceMotion = useReducedMotion();

  return (
    <div className="pd-gallery">
      {/* All images stay mounted, stacked, and cross-fade via opacity --
          rather than unmounting the outgoing one (AnimatePresence's exit),
          which depends on an animation-completion signal that isn't
          reliable when the tab is hidden/backgrounded. This also avoids
          any flash-of-missing-image mid-swap as a side benefit. */}
      <div className="main-image" style={{ position: 'relative' }}>
        {images.map((src) => (
          <motion.img
            key={src}
            src={src}
            alt={product.name}
            animate={{ opacity: src === mainSrc ? 1 : 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: src === mainSrc ? 'auto' : 'none' }}
          />
        ))}
      </div>
      <div className="pd-thumbs">
        {images.map((src) => (
          <motion.img
            key={src}
            src={src}
            className={src === mainSrc ? 'active' : ''}
            onClick={() => setMainSrc(src)}
            whileHover={reduceMotion ? {} : { scale: 1.05 }}
            transition={{ duration: 0.15 }}
          />
        ))}
      </div>
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
          <strong>{name}</strong>
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
    <div className="star-input">
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.button
          key={i}
          type="button"
          className={`star-btn${i <= value ? ' active' : ''}`}
          onClick={() => onChange(i)}
          whileTap={{ scale: 0.85 }}
        >
          <Icon name="star" size={26} />
        </motion.button>
      ))}
    </div>
  );
}

// Eligibility-gated review form, modeled as one explicit state rather than a
// pile of booleans: loading | logged-out | already-reviewed | not-eligible | can-review.
function Reviews({ product, pathname, search }) {
  const [reviews, setReviews] = useState(null);
  const [gateState, setGateState] = useState('loading');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadReviews() {
    try {
      const data = await api.get(`/products/${product._id}/reviews`);
      setReviews(data);
    } catch {
      setReviews([]);
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

  return (
    <section id="reviews-section" className="section">
      <div className="section-head">
        <h2>Reviews</h2>
      </div>

      {reviews && reviews.length > 0 && (
        <div className="review-summary">
          <div className="review-summary-score">{avg.toFixed(1)}</div>
          <div>
            <StarRow rating={avg} size={18} />
            <div className="review-summary-count">
              {reviews.length} review{reviews.length === 1 ? '' : 's'}
            </div>
          </div>
        </div>
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
          {formError && <div className="form-message error">{formError}</div>}
          <textarea
            rows={3}
            className="review-textarea"
            placeholder="Share your experience with this product..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button className="btn btn-primary" onClick={submitReview} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      )}

      {reviews === null ? (
        <div className="dot-loader">
          <span></span>
          <span></span>
          <span></span>
        </div>
      ) : reviews.length === 0 ? (
        <div className="empty-state">
          <p>No reviews yet — be the first to review this product!</p>
        </div>
      ) : (
        <div className="review-list">
          <AnimatePresence>
            {reviews.map((r) => (
              <ReviewCard key={r._id} review={r} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}

function RelatedProducts({ product }) {
  const [related, setRelated] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get(`/products?category=${encodeURIComponent(product.category)}&limit=9`)
      .then((results) => {
        if (cancelled) return;
        setRelated(results.filter((p) => p._id !== product._id).slice(0, 4));
      })
      .catch(() => {
        if (!cancelled) setRelated([]);
      });
    return () => {
      cancelled = true;
    };
  }, [product._id, product.category]);

  if (!related || related.length === 0) return null;

  return (
    <section id="related-section" className="section">
      <div className="section-head">
        <h2>Related Products</h2>
      </div>
      <ProductGrid products={related} />
    </section>
  );
}

export default function ProductPage() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);

  useDocumentTitle(product ? `${product.name} — Retalla` : 'Product — Retalla');

  useEffect(() => {
    if (!id) {
      setError('Product not found.');
      return;
    }
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
  }, [id]);

  function stepQty(delta) {
    if (!product) return;
    setQty((q) => Math.min(product.stock || 99, Math.max(1, q + delta)));
  }

  function addToCart() {
    cart.add(product, qty);
    showToast(`${product.name} added to cart`);
  }

  function buyNow() {
    cart.add(product, qty);
    window.location.href = '/cart.html';
  }

  if (error) {
    return (
      <main className="container">
        <div className="empty-state">{error}</div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="container">
        <div id="product-detail-wrap" className="product-detail">
          <div className="dot-loader">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </main>
    );
  }

  const discount = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
  const outOfStock = product.stock <= 0;

  return (
    <main className="container">
      <div className="breadcrumb">
        <a href="/index.html">Home</a> / <a href="/shop.html">Shop</a> / <span>{product.name}</span>
      </div>

      <div className="product-detail">
        <ProductGallery product={product} />

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
            <span>({product.numReviews} reviews)</span>
            {product.isBestSeller && (
              <span className="badge" style={{ position: 'static' }}>
                BESTSELLER
              </span>
            )}
          </div>
          <div className="price-row">
            <span className="price">Rs. {product.price.toFixed(2)}</span>
            {product.mrp > product.price && (
              <>
                <span className="mrp">Rs. {product.mrp.toFixed(2)}</span>
                <span className="discount">{discount}% off</span>
              </>
            )}
          </div>

          <DeliveryCheck product={product} />

          <QtyStepper
            value={qty}
            min={1}
            max={product.stock}
            onDecrement={() => stepQty(-1)}
            onIncrement={() => stepQty(1)}
            onInputChange={(v) => {
              const n = Number(v);
              if (n) setQty(Math.min(product.stock || 99, Math.max(1, n)));
            }}
          />
          <div className="pd-actions">
            <button className="btn btn-primary" disabled={outOfStock} onClick={addToCart}>
              Add to Cart
            </button>
            <button className="btn btn-accent" disabled={outOfStock} onClick={buyNow}>
              Buy Now
            </button>
          </div>

          <div className="pd-highlights">
            <h3>Product Details</h3>
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
                  <td>{outOfStock ? 'Out of stock' : `${product.stock} units in stock`}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="pd-badges">
            <div className="pd-badge">
              <span className="icon-circle">
                <Icon name="truck" size={16} />
              </span>
              <div>
                <strong>{product.freeDelivery ? 'Free Delivery' : 'Paid Delivery'}</strong>
                <span>{outOfStock ? 'Out of stock' : `${product.stock} in stock`}</span>
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

          <p className="pd-description">{product.description || ''}</p>
          {product.videoUrl && (
            <div className="pd-video">
              <h3 className="pd-video-title">Product Video</h3>
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
          )}
        </div>
      </div>

      <Reviews product={product} pathname={window.location.pathname} search={window.location.search} />
      <RelatedProducts product={product} />
    </main>
  );
}
