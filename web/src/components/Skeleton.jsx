// Thin presentational primitives over the shared `.skeleton` shimmer class
// (web/src/styles/style.css), composed below into per-feature shapes so
// every loading state in the app shares one shimmer implementation.
// Primitives are aria-hidden because a composed skeleton announces itself
// ONCE via a role="status" wrapper -- individual shimmer boxes must stay
// silent so screen readers don't read out N unlabeled empty regions.
export function SkeletonBlock({ width = '100%', height = 16, radius, className = '', style }) {
  return (
    <div
      className={`skeleton ${className}`.trim()}
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  );
}

export function SkeletonLine({ width = '100%', height = 12, style }) {
  return <SkeletonBlock width={width} height={height} radius="4px" style={style} />;
}

export function SkeletonCircle({ size = 40, style }) {
  return <SkeletonBlock width={size} height={size} radius="50%" style={style} />;
}

// Mirrors ProductCard: .product-card > .thumb(img) + .product-info(.cat, h3, .rating-row, .price-row, .free-delivery, button)
export function ProductCardSkeleton() {
  return (
    <div className="product-card" aria-hidden="true">
      <div className="thumb">
        <SkeletonBlock width="100%" height="100%" radius="0" />
      </div>
      <div className="product-info">
        <SkeletonLine width="40%" height={11} />
        <SkeletonLine width="85%" height={16} style={{ margin: '8px 0' }} />
        <SkeletonLine width="60%" height={12} />
        <SkeletonLine width="50%" height={18} style={{ margin: '10px 0' }} />
        <SkeletonBlock width="100%" height={34} radius="var(--radius-sm)" style={{ marginTop: '10px' }} />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="product-grid" role="status" aria-live="polite" aria-label="Loading products">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Mirrors .product-detail > .pd-gallery(.main-image, .pd-thumbs 64x64) + .pd-info(...)
export function ProductDetailSkeleton() {
  return (
    <div className="product-detail" role="status" aria-live="polite" aria-label="Loading product">
      <div className="pd-gallery" aria-hidden="true">
        <div className="main-image">
          <SkeletonBlock width="100%" height="100%" radius="0" />
        </div>
        <div className="pd-thumbs">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} width={64} height={64} radius="var(--radius-sm)" />
          ))}
        </div>
      </div>
      <div className="pd-info" aria-hidden="true">
        <SkeletonLine width="30%" height={12} />
        <SkeletonLine width="70%" height={28} style={{ margin: '10px 0' }} />
        <SkeletonLine width="40%" height={13} />
        <SkeletonLine width="35%" height={22} style={{ margin: '14px 0' }} />
        <SkeletonBlock width="100%" height={56} radius="var(--radius-sm)" style={{ margin: '16px 0' }} />
        <SkeletonBlock width={140} height={44} radius="var(--radius-sm)" style={{ margin: '10px 0' }} />
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <SkeletonBlock width="100%" height={48} radius="var(--radius-sm)" />
          <SkeletonBlock width="100%" height={48} radius="var(--radius-sm)" />
        </div>
      </div>
    </div>
  );
}

// Mirrors .review-card > .review-card-head(.avatar 36px circle + who) + .review-comment lines
export function ReviewSkeleton() {
  return (
    <div className="review-card" aria-hidden="true">
      <div className="review-card-head">
        <SkeletonCircle size={36} />
        <div className="review-card-who" style={{ gap: 6, display: 'flex', flexDirection: 'column' }}>
          <SkeletonLine width={110} height={13} />
          <SkeletonLine width={70} height={11} />
        </div>
      </div>
      <SkeletonLine width="95%" height={12} style={{ marginBottom: 6 }} />
      <SkeletonLine width="70%" height={12} />
    </div>
  );
}

export function ReviewListSkeleton({ count = 3 }) {
  return (
    <div className="review-list" role="status" aria-live="polite" aria-label="Loading reviews">
      {Array.from({ length: count }).map((_, i) => (
        <ReviewSkeleton key={i} />
      ))}
    </div>
  );
}

// Mirrors .cart-item (grid 90px 1fr auto auto auto): image, name+price, qty stepper, line total, remove button
export function CartItemSkeleton() {
  return (
    <div className="cart-item" aria-hidden="true">
      <SkeletonBlock width={90} height={90} radius="var(--radius-sm)" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <SkeletonLine width="80%" height={15} />
        <SkeletonLine width="40%" height={13} />
      </div>
      <SkeletonBlock width={100} height={36} radius="var(--radius-sm)" />
      <SkeletonLine width={60} height={16} />
      <SkeletonCircle size={32} />
    </div>
  );
}

// Mirrors .search-product-row (44x44 image + 2 lines), wrapped in .search-product-list
export function SearchSuggestionSkeleton({ count = 4 }) {
  return (
    <div className="search-product-list" role="status" aria-live="polite" aria-label="Loading suggestions">
      {Array.from({ length: count }).map((_, i) => (
        <div className="search-product-row" key={i} aria-hidden="true">
          <SkeletonBlock width={44} height={44} radius="var(--radius-sm)" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
            <SkeletonLine width="75%" height={12} />
            <SkeletonLine width="35%" height={11} />
          </div>
        </div>
      ))}
    </div>
  );
}

// Mirrors .wishlist-item (grid 90px 1fr auto): image, name/rating/availability, price+button
export function WishlistItemSkeleton() {
  return (
    <div className="wishlist-item" aria-hidden="true">
      <SkeletonBlock width={90} height={90} radius="var(--radius-sm)" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <SkeletonLine width="70%" height={15} />
        <SkeletonLine width="40%" height={12} />
        <SkeletonLine width="30%" height={11} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
        <SkeletonLine width={60} height={16} />
        <SkeletonBlock width={110} height={34} radius="var(--radius-sm)" />
      </div>
    </div>
  );
}

export function WishlistListSkeleton({ count = 3 }) {
  return (
    <div role="status" aria-live="polite" aria-label="Loading wishlist">
      {Array.from({ length: count }).map((_, i) => (
        <WishlistItemSkeleton key={i} />
      ))}
    </div>
  );
}

// Mirrors .order-card > .head(2 lines + status pill block) + one .order-item-row (48x48 image + line + price)
export function OrderCardSkeleton() {
  return (
    <div className="order-card" aria-hidden="true">
      <div className="head">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <SkeletonLine width={140} height={14} />
          <SkeletonLine width={90} height={11} />
        </div>
        <SkeletonBlock width={80} height={22} radius="999px" />
      </div>
      <div className="order-item-row" style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '9px 0' }}>
        <SkeletonBlock width={48} height={48} radius="8px" />
        <SkeletonLine width="50%" height={13} />
        <SkeletonLine width={60} height={13} />
      </div>
    </div>
  );
}

export function OrdersListSkeleton({ count = 3 }) {
  return (
    <div role="status" aria-live="polite" aria-label="Loading orders">
      {Array.from({ length: count }).map((_, i) => (
        <OrderCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Mirrors .address-card (name line + 3 address lines)
export function AddressCardSkeleton() {
  return (
    <div className="address-card" aria-hidden="true">
      <SkeletonLine width="50%" height={14} style={{ marginBottom: 10 }} />
      <SkeletonLine width="90%" height={12} style={{ marginBottom: 6 }} />
      <SkeletonLine width="70%" height={12} style={{ marginBottom: 6 }} />
      <SkeletonLine width="40%" height={12} />
    </div>
  );
}

export function AddressGridSkeleton({ count = 2 }) {
  return (
    <div className="address-grid" role="status" aria-live="polite" aria-label="Loading addresses">
      {Array.from({ length: count }).map((_, i) => (
        <AddressCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Mirrors .promo-tile (min-height 190px). Real tiles set their own inline
// background per-tile, so this uses a neutral surface instead of guessing one.
export function PromoTileSkeleton() {
  return (
    <div
      className="promo-tile"
      aria-hidden="true"
      style={{ background: 'var(--paper)', border: '1px solid var(--line)', minHeight: 190 }}
    >
      <div className="promo-tile-copy">
        <SkeletonLine width="70%" height={16} style={{ marginBottom: 8 }} />
        <SkeletonLine width="40%" height={12} />
      </div>
    </div>
  );
}

export function PromoTilesGridSkeleton({ count = 4 }) {
  return (
    <div className="promo-tiles-grid" role="status" aria-live="polite" aria-label="Loading deals">
      {Array.from({ length: count }).map((_, i) => (
        <PromoTileSkeleton key={i} />
      ))}
    </div>
  );
}
