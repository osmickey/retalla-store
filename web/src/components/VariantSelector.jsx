import { motion, useReducedMotion } from 'framer-motion';

// Controlled, presentational -- owns no cart/price knowledge. Renders
// nothing when `groups` is empty/absent, which is the case for every
// product in the live catalog today (no admin-authoring UI exists yet for
// this field -- it's populated directly on the Product document).
export default function VariantSelector({ groups, selected, onSelect }) {
  const reduceMotion = useReducedMotion();
  if (!groups || groups.length === 0) return null;

  return (
    <div className="variant-selector">
      {groups.map((group) => (
        <div className="variant-group" key={group.name}>
          <div className="variant-group-label">
            {group.name}
            {selected[group.name] && (
              <span className="variant-group-value">
                {group.options.find((o) => o.value === selected[group.name])?.label}
              </span>
            )}
          </div>
          <div className="variant-options" role="radiogroup" aria-label={group.name}>
            {group.options.map((opt) => {
              const isSelected = selected[group.name] === opt.value;
              const isOut = opt.stock != null && opt.stock <= 0;
              const shape =
                group.type === 'swatch' ? 'variant-swatch' : group.type === 'card' ? 'variant-card' : 'variant-btn';
              return (
                <motion.button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={`${group.name}: ${opt.label}${isOut ? ' (out of stock)' : ''}`}
                  className={`${shape}${isSelected ? ' selected' : ''}${isOut ? ' out-of-stock' : ''}`}
                  style={group.type === 'swatch' && opt.swatch ? { background: opt.swatch } : undefined}
                  disabled={isOut}
                  onClick={() => onSelect(group.name, opt.value)}
                  whileTap={reduceMotion ? {} : { scale: 0.93 }}
                >
                  {group.type === 'swatch' && !opt.swatch && opt.image && <img src={opt.image} alt="" />}
                  {group.type !== 'swatch' && (
                    <>
                      {group.type === 'card' && opt.image && <img src={opt.image} alt="" />}
                      <span>{opt.label}</span>
                      {opt.priceDelta > 0 && <span className="variant-price-delta">+Rs. {opt.priceDelta}</span>}
                    </>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
