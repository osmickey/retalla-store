import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { CATEGORIES } from '../lib/config';
import { api } from '../lib/api';
import { showToast } from '../lib/cart';
import ProductGrid from '../components/ProductGrid';

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

export default function ShopPage() {
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useDocumentTitle(`${search ? `Search: "${search}"` : category || 'All Products'} — Retalla`);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const query = new URLSearchParams();
    if (category) query.set('category', category);
    if (search) query.set('search', search);

    api
      .get(`/products?${query.toString()}`)
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .catch((err) => {
        if (!cancelled) showToast(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [category, search]);

  return (
    <main className="container">
      <div className="breadcrumb">
        <a href="/index.html">Home</a> / <span>{search ? `Search: "${search}"` : category || 'All Products'}</span>
      </div>

      <div className="category-nav" style={{ border: 'none', marginBottom: '20px' }}>
        <div className="container" style={{ padding: 0, display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <CategoryPill label="All" to="/shop.html" active={!category} />
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

      <section className="section">
        {loading ? (
          <div className="dot-loader">
            <span></span>
            <span></span>
            <span></span>
          </div>
        ) : (
          <ProductGrid products={products} />
        )}
      </section>
    </main>
  );
}
