import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { CATEGORIES } from '../lib/config';
import { api } from '../lib/api';
import ProductGrid from '../components/ProductGrid';
import ShopFilters, { PRICE_BUCKETS } from '../components/ShopFilters';
import SortMenu, { SORT_OPTIONS } from '../components/SortMenu';
import SidePanel from '../components/SidePanel';
import Icon from '../icons/Icon';
import ErrorState from '../components/ErrorState';
import NoResultsState from '../components/NoResultsState';
import { ProductGridSkeleton } from '../components/Skeleton';

function CategoryPill({ label, to, active }) {
  return (
    <Link className="shop-pill" to={to} data-active={active}>
      {active && (
        <motion.span
          className="shop-pill-bg"
          layoutId="shop-pill-active"
          transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
        />
      )}
      <span className="shop-pill-label">{label}</span>
    </Link>
  );
}

// "offers" (still a valid Navbar-linked sort value, see Navbar.jsx's
// SORT_LINKS) isn't in SortMenu's own SORT_OPTIONS since it was folded into
// the Discount filter -- kept here only so the page heading still reads
// "Offers" instead of falling back to "All Products".
const SORT_HEADINGS = { ...Object.fromEntries(SORT_OPTIONS.filter((o) => o.key).map((o) => [o.key, o.label])), offers: 'Offers' };

function applyFilters(products, { discount, price, brand, rating, inStock }) {
  let result = products;
  if (discount) {
    const min = Number(discount);
    result = result.filter((p) => (p.discountPercent ?? 0) >= min);
  }
  if (price) {
    const bucket = PRICE_BUCKETS.find((b) => b.key === price);
    if (bucket) result = result.filter((p) => p.price >= bucket.min && p.price < bucket.max);
  }
  if (brand.length) {
    result = result.filter((p) => brand.includes(p.brand));
  }
  if (rating) {
    const min = Number(rating);
    result = result.filter((p) => p.rating >= min);
  }
  if (inStock) {
    result = result.filter((p) => p.stock > 0);
  }
  return result;
}

function applySort(products, sortKey) {
  if (sortKey === 'price-asc') return [...products].sort((a, b) => a.price - b.price);
  if (sortKey === 'price-desc') return [...products].sort((a, b) => b.price - a.price);
  if (sortKey === 'rating') return [...products].sort((a, b) => b.rating - a.rating);
  return products;
}

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || '';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const heading = search ? `Search: "${search}"` : SORT_HEADINGS[sort] || category || 'All Products';
  useDocumentTitle(`${heading} — Retalla`);

  // Only the params that change the SERVER query live here. Sidebar filters
  // (price/brand/rating/inStock/discount) are read via the same
  // searchParams below but applied client-side in the useMemo pipeline, so
  // they don't need to re-trigger a fetch.
  function loadProducts() {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const query = new URLSearchParams();
    if (category) query.set('category', category);
    if (search) query.set('search', search);
    if (sort === 'bestseller') query.set('bestseller', 'true');

    api
      .get(`/products?${query.toString()}`)
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => loadProducts(), [category, search, sort]);

  const filters = {
    price: searchParams.get('price') || '',
    brand: (searchParams.get('brand') || '').split(',').filter(Boolean),
    rating: searchParams.get('rating') || '',
    inStock: searchParams.get('inStock') === 'true',
    discount: searchParams.get('discount') || '',
  };

  function updateParams(patch) {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      const isEmpty = value === '' || value == null || value === false || (Array.isArray(value) && value.length === 0);
      if (isEmpty) next.delete(key);
      else next.set(key, Array.isArray(value) ? value.join(',') : String(value));
    });
    setSearchParams(next);
  }

  const clearFilters = () => updateParams({ price: '', brand: [], rating: '', inStock: false, discount: '' });
  const hasActiveFilters = Boolean(filters.price || filters.brand.length || filters.rating || filters.inStock || filters.discount);

  const visibleProducts = useMemo(() => {
    // sort=offers is a Navbar shortcut (see Navbar.jsx SORT_LINKS) folded
    // into the same discount pipeline the sidebar's Discount filter uses,
    // rather than a second, separate filtering code path.
    const effectiveDiscount = filters.discount || (sort === 'offers' ? '1' : '');
    const filtered = applyFilters(products, { ...filters, discount: effectiveDiscount });
    return applySort(filtered, sort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, sort, filters.price, filters.brand.join(','), filters.rating, filters.inStock, filters.discount]);

  const signature = `${category}|${search}|${sort}|${filters.price}|${filters.brand.join(',')}|${filters.rating}|${filters.inStock}|${filters.discount}`;

  return (
    <main className="container">
      <div className="breadcrumb">
        <a href="/index.html">Home</a> / <span>{heading}</span>
      </div>

      <div className="category-nav" style={{ border: 'none', marginBottom: '20px' }}>
        <div className="container" style={{ padding: 0, display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <CategoryPill label="All" to="/shop.html" active={!category && !sort} />
          {CATEGORIES.map((cat) => (
            <CategoryPill
              key={cat}
              label={cat}
              to={`/shop.html?category=${encodeURIComponent(cat)}`}
              active={cat === category}
            />
          ))}
        </div>
      </div>

      <div className="shop-layout">
        <aside className="shop-filters">
          <ShopFilters products={products} filters={filters} onChange={updateParams} onClear={clearFilters} />
        </aside>

        <div className="shop-main">
          <div className="shop-toolbar">
            <span className="shop-count">
              {error ? '' : loading ? 'Loading…' : `${visibleProducts.length} product${visibleProducts.length === 1 ? '' : 's'}`}
            </span>
            <div className="shop-toolbar-actions">
              <button type="button" className="shop-filter-btn" onClick={() => setFiltersOpen(true)}>
                <Icon name="filter" size={16} />
                Filters
              </button>
              <SortMenu value={sort} onChange={(value) => updateParams({ sort: value })} />
            </div>
          </div>

          {loading ? (
            <ProductGridSkeleton count={8} />
          ) : error ? (
            <ErrorState message={error} onRetry={loadProducts} />
          ) : visibleProducts.length === 0 && search ? (
            <NoResultsState
              query={search}
              onPopularSearch={(term) => navigate(`/shop.html?search=${encodeURIComponent(term)}`)}
            />
          ) : (
            <motion.div key={signature} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
              <ProductGrid
                products={visibleProducts}
                emptyMessage="No products match these filters."
                emptyAction={
                  hasActiveFilters
                    ? { label: 'Clear Filters', onClick: clearFilters }
                    : { label: 'Browse All Products', href: '/shop.html' }
                }
              />
            </motion.div>
          )}
        </div>
      </div>

      <SidePanel open={filtersOpen} onClose={() => setFiltersOpen(false)} ariaLabel="Filters">
        <ShopFilters products={products} filters={filters} onChange={updateParams} onClear={clearFilters} />
        <button type="button" className="btn btn-primary btn-block filter-apply-btn" onClick={() => setFiltersOpen(false)}>
          Show {visibleProducts.length} Result{visibleProducts.length === 1 ? '' : 's'}
        </button>
      </SidePanel>
    </main>
  );
}
