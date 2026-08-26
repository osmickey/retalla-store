import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import Icon from '../icons/Icon';
import { api } from '../lib/api';
import { CATEGORIES, POPULAR_SEARCHES } from '../lib/config';
import { recentSearches } from '../lib/recentSearches';
import { useDelayedUnmount } from '../hooks/useDelayedUnmount';

// Anchored expanding panel, same shape as SortMenu.jsx (not SidePanel.jsx --
// a full-height slide-in drawer is the wrong shape for this). Uses
// useDelayedUnmount rather than AnimatePresence/exit, same reason as every
// other overlay in this app (see useDelayedUnmount.js).
export default function SearchPanel() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [, forceUpdate] = useState(0);
  const rootRef = useRef(null);
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const render = useDelayedUnmount(open, 220);

  const trimmed = query.trim();

  // MongoDB $text matches whole stemmed words, not prefixes -- a 2-3 char
  // query genuinely won't match most products yet. Recent/Popular/category
  // suggestions (all client-side) don't share that limitation, so they
  // carry more weight while a query is still short.
  useEffect(() => {
    if (trimmed.length < 2) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return undefined;
    }
    setLoadingSuggestions(true);
    const timer = setTimeout(() => {
      api
        .get(`/products?search=${encodeURIComponent(trimmed)}&limit=6`)
        .then((data) => setSuggestions(data))
        .catch(() => setSuggestions([]))
        .finally(() => setLoadingSuggestions(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [trimmed]);

  const matchedCategories = useMemo(() => {
    if (!trimmed) return [];
    const q = trimmed.toLowerCase();
    return CATEGORIES.filter((c) => c.toLowerCase().includes(q));
  }, [trimmed]);

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

  function commit(recordTerm) {
    if (recordTerm) recentSearches.record(recordTerm);
    setOpen(false);
    setQuery('');
  }

  function goSearch(term) {
    const clean = term.trim();
    commit(clean);
    navigate(clean ? `/shop.html?search=${encodeURIComponent(clean)}` : '/shop.html');
  }

  function goCategory(cat) {
    commit(trimmed);
    navigate(`/shop.html?category=${encodeURIComponent(cat)}`);
  }

  function goProduct(p) {
    commit(trimmed);
    navigate(`/product.html?id=${p._id}`);
  }

  function handleSubmit(e) {
    e.preventDefault();
    goSearch(query);
  }

  function handleClearRecent() {
    recentSearches.clear();
    forceUpdate((n) => n + 1);
  }

  const recent = open ? recentSearches.getAll() : [];
  const showNoResults = trimmed.length >= 2 && !loadingSuggestions && suggestions.length === 0 && matchedCategories.length === 0;

  return (
    <div className="search-panel" ref={rootRef}>
      <form className="search-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search for gadgets, fashion, beauty & more..."
          autoComplete="off"
        />
        {query && (
          <button type="button" className="search-clear" aria-label="Clear search" onClick={() => setQuery('')}>
            <Icon name="close" size={14} />
          </button>
        )}
        <button type="submit">
          <span className="icon">
            <Icon name="search" size={18} />
          </span>
        </button>
      </form>

      {render && (
        <motion.div
          className="search-suggest"
          animate={{ opacity: open ? 1 : 0, scale: open ? 1 : 0.96 }}
          transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
          {trimmed.length === 0 ? (
            <>
              {recent.length > 0 && (
                <div className="search-suggest-group">
                  <div className="search-suggest-head">
                    <h4>Recent Searches</h4>
                    <button type="button" className="search-suggest-clear" onClick={handleClearRecent}>
                      Clear
                    </button>
                  </div>
                  <div className="search-pills">
                    {recent.map((term) => (
                      <button key={term} type="button" className="search-pill" onClick={() => goSearch(term)}>
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="search-suggest-group">
                <h4>Popular Searches</h4>
                <div className="search-pills">
                  {POPULAR_SEARCHES.map((term) => (
                    <button key={term} type="button" className="search-pill" onClick={() => goSearch(term)}>
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : showNoResults ? (
            <div className="search-no-results">
              <div className="icon-circle search-no-results-icon">
                <Icon name="search" size={24} />
              </div>
              <p>
                No results for “<em>{trimmed}</em>”
              </p>
              <div className="search-pills">
                {POPULAR_SEARCHES.slice(0, 3).map((term) => (
                  <button key={term} type="button" className="search-pill" onClick={() => goSearch(term)}>
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {matchedCategories.length > 0 && (
                <div className="search-suggest-group">
                  <h4>Categories</h4>
                  <div className="search-pills">
                    {matchedCategories.map((cat) => (
                      <button key={cat} type="button" className="search-pill" onClick={() => goCategory(cat)}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {suggestions.length > 0 && (
                <div className="search-suggest-group">
                  <h4>Products</h4>
                  <div className="search-product-list">
                    {suggestions.map((p) => (
                      <button key={p._id} type="button" className="search-product-row" onClick={() => goProduct(p)}>
                        <img src={p.image} alt="" />
                        <span className="search-product-info">
                          <span className="name">{p.name}</span>
                          <span className="price">Rs. {p.price.toFixed(2)}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button type="button" className="search-suggest-submit" onClick={() => goSearch(trimmed)}>
                Search for “{trimmed}”
              </button>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
