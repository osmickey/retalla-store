import { useMemo } from 'react';

export const PRICE_BUCKETS = [
  { key: 'under-500', label: 'Under Rs. 500', min: 0, max: 500 },
  { key: '500-1000', label: 'Rs. 500 – Rs. 1,000', min: 500, max: 1000 },
  { key: '1000-2000', label: 'Rs. 1,000 – Rs. 2,000', min: 1000, max: 2000 },
  { key: '2000-5000', label: 'Rs. 2,000 – Rs. 5,000', min: 2000, max: 5000 },
  { key: 'over-5000', label: 'Over Rs. 5,000', min: 5000, max: Infinity },
];

export const RATING_OPTIONS = [4, 3, 2, 1];

export const DISCOUNT_OPTIONS = [
  { key: '10', label: '10% off or more' },
  { key: '25', label: '25% off or more' },
  { key: '50', label: '50% off or more' },
];

function FilterGroup({ title, children }) {
  return (
    <div className="filter-group">
      <h4>{title}</h4>
      <div className="filter-options">{children}</div>
    </div>
  );
}

// Category isn't repeated here -- it already has a dedicated, animated pill
// row at the top of ShopPage; duplicating it in the sidebar would just be
// two controls for the same nine values. Size/Color are intentionally
// absent: the Product schema has no such field anywhere (verified against
// server/models/Product.js, the listing API, and the admin product editor)
// -- rendering a disabled section would look broken, not honest.
export default function ShopFilters({ products, filters, onChange, onClear }) {
  const brands = useMemo(() => [...new Set(products.map((p) => p.brand).filter(Boolean))].sort(), [products]);

  const hasActiveFilters = Boolean(filters.price || filters.brand.length || filters.rating || filters.inStock || filters.discount);

  return (
    <div className="shop-filters-inner">
      <div className="shop-filters-head">
        <h3>Filters</h3>
        {hasActiveFilters && (
          <button type="button" className="filter-clear" onClick={onClear}>
            Clear all
          </button>
        )}
      </div>

      <FilterGroup title="Price">
        {PRICE_BUCKETS.map((b) => (
          <label key={b.key} className="filter-option">
            <input
              type="radio"
              name="price"
              checked={filters.price === b.key}
              onChange={() => onChange({ price: filters.price === b.key ? '' : b.key })}
            />
            <span>{b.label}</span>
          </label>
        ))}
      </FilterGroup>

      {brands.length > 0 && (
        <FilterGroup title="Brand">
          {brands.map((b) => (
            <label key={b} className="filter-option">
              <input
                type="checkbox"
                checked={filters.brand.includes(b)}
                onChange={() => {
                  const next = filters.brand.includes(b) ? filters.brand.filter((x) => x !== b) : [...filters.brand, b];
                  onChange({ brand: next });
                }}
              />
              <span>{b}</span>
            </label>
          ))}
        </FilterGroup>
      )}

      <FilterGroup title="Rating">
        {RATING_OPTIONS.map((r) => (
          <label key={r} className="filter-option">
            <input
              type="radio"
              name="rating"
              checked={filters.rating === String(r)}
              onChange={() => onChange({ rating: filters.rating === String(r) ? '' : String(r) })}
            />
            <span>{r}★ &amp; up</span>
          </label>
        ))}
      </FilterGroup>

      <FilterGroup title="Discount">
        {DISCOUNT_OPTIONS.map((d) => (
          <label key={d.key} className="filter-option">
            <input
              type="radio"
              name="discount"
              checked={filters.discount === d.key}
              onChange={() => onChange({ discount: filters.discount === d.key ? '' : d.key })}
            />
            <span>{d.label}</span>
          </label>
        ))}
      </FilterGroup>

      <FilterGroup title="Availability">
        <label className="filter-option">
          <input type="checkbox" checked={filters.inStock} onChange={() => onChange({ inStock: !filters.inStock })} />
          <span>In Stock Only</span>
        </label>
      </FilterGroup>
    </div>
  );
}
