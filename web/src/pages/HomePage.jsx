import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { api } from '../lib/api';
import { CATEGORIES, CATEGORY_ICONS } from '../lib/config';
import { useWishlistIds } from '../lib/wishlist';
import { EASE } from '../lib/motion';
import { BRAND_STORY, CATEGORY_BLURBS, HERO_COPY, NEWSLETTER_COPY, SHOP_THE_LOOK } from '../lib/homeContent';
import Icon from '../icons/Icon';
import { ProductCard } from '../components/ProductGrid';
import BannerCarousel from '../components/BannerCarousel';
import SlidableRail from '../components/SlidableRail';
import LiveVideoSection from '../components/LiveVideoSection';
import ErrorState from '../components/ErrorState';
import { PromoTilesGridSkeleton, ProductCardSkeleton } from '../components/Skeleton';

// Shared scroll-reveal. One helper instead of re-declaring the same
// initial/whileInView/viewport triple on every element -- §19 asks for groups
// to animate, not each node individually.
function reveal(reduceMotion, delay = 0) {
  return {
    initial: reduceMotion ? false : { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.15, margin: '0px 0px -60px 0px' },
    transition: { duration: reduceMotion ? 0 : 0.7, ease: EASE, delay: reduceMotion ? 0 : delay },
  };
}

// Explicit 3-state fetch (loading / error / data), matching the pattern the
// rest of the app uses so a failed request never renders as "empty".
function useProducts(path) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  function load() {
    setError(null);
    setData(null);
    let cancelled = false;
    api
      .get(path)
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => load(), [path]);
  return { data, error, reload: load };
}

function SectionHead({ eyebrow, title, href, linkLabel = 'View all', align = 'left' }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div className={`section-head section-head--${align}`} {...reveal(reduceMotion)}>
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
      </div>
      {href && (
        <Link className="link-arrow" to={href}>
          {linkLabel} <span aria-hidden="true">→</span>
        </Link>
      )}
    </motion.div>
  );
}

/* ============================== 1. HERO ============================== */

function Hero() {
  const reduceMotion = useReducedMotion();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  // Deliberately small ranges -- parallax that stays comfortable to read over.
  const copyY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : 26]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.85], [1, reduceMotion ? 1 : 0.35]);

  const [hero, setHero] = useState(undefined); // undefined = loading

  useEffect(() => {
    let cancelled = false;
    api
      .get('/hero')
      .then((h) => !cancelled && setHero(h))
      .catch(() => !cancelled && setHero({}));
    return () => {
      cancelled = true;
    };
  }, []);

  if (hero === undefined) return <div className="hero-placeholder" aria-hidden="true" />;
  if (hero?.active === false) return null;

  // Admin-set hero copy wins where it's actually filled in; otherwise the
  // editorial defaults carry the section. The live record is currently all
  // empty strings, so the defaults are the real design target here.
  const title = hero?.title || HERO_COPY.title;
  const accent = hero?.title ? hero.highlight : HERO_COPY.titleAccent;
  const subtitle = hero?.subtitle || HERO_COPY.subtitle;
  const badge = hero?.badge || '';
  const primary = {
    label: hero?.ctaText || HERO_COPY.primaryCta.label,
    href: hero?.ctaLink || HERO_COPY.primaryCta.href,
  };
  const secondary = {
    label: hero?.secondaryText || HERO_COPY.secondaryCta.label,
    href: hero?.secondaryLink || HERO_COPY.secondaryCta.href,
  };

  // An admin-set hero image still renders as a full-bleed backdrop, but the
  // section no longer borrows product photography to fill space -- with no
  // image set it stands on typography alone.
  const backdrop = hero?.image || null;

  const stagger = (i) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduceMotion ? 0 : 0.85, ease: EASE, delay: reduceMotion ? 0 : 0.09 * i },
  });

  // The headline reveals word by word from behind a mask -- the one piece of
  // real choreography on the page, and the reason the rest stays quiet.
  const words = `${title}${accent ? ` ${accent}` : ''}`.trim().split(' ');
  const accentFrom = accent ? words.length - accent.trim().split(' ').length : -1;

  return (
    <section className={`hero${backdrop ? ' hero--image' : ''}`} ref={ref}>
      {backdrop && (
        <motion.div
          className="hero-backdrop"
          aria-hidden="true"
          initial={reduceMotion ? false : { opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: reduceMotion ? 0 : 1.4, ease: EASE }}
          style={{ backgroundImage: `url(${backdrop})` }}
        />
      )}
      <motion.div className="container hero-inner" style={{ y: copyY, opacity: copyOpacity }}>
        <motion.span className="hero-eyebrow" {...stagger(0)}>
          {badge || HERO_COPY.eyebrow}
        </motion.span>

        <h1 className="hero-title">
          {words.map((word, i) => (
            <span className="hero-word" key={`${word}-${i}`}>
              <motion.span
                className={i >= accentFrom && accentFrom !== -1 ? 'hero-word-accent' : undefined}
                initial={reduceMotion ? false : { y: '105%' }}
                animate={{ y: '0%' }}
                transition={{ duration: reduceMotion ? 0 : 0.9, ease: EASE, delay: reduceMotion ? 0 : 0.12 + i * 0.06 }}
              >
                {word}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.p className="hero-sub" {...stagger(3)}>
          {subtitle}
        </motion.p>
        <motion.div className="hero-actions" {...stagger(4)}>
          <a href={primary.href} className="btn btn-primary btn-arrow">
            {primary.label} <span aria-hidden="true">→</span>
          </a>
          <a href={secondary.href} className="btn btn-quiet">
            {secondary.label}
          </a>
        </motion.div>
        <motion.ul className="hero-trust" {...stagger(5)}>
          <li>
            <Icon name="truck" size={15} /> Free shipping over Rs. 499
          </li>
          <li>
            <Icon name="return" size={15} /> 7-day returns
          </li>
          <li>
            <Icon name="wallet" size={15} /> Cash on delivery
          </li>
        </motion.ul>
      </motion.div>
    </section>
  );
}

/* ======================== 2. FEATURED CATEGORIES ======================== */

// One evenly-weighted grid rather than the previous large-tile-plus-stack
// arrangement: at 340px tall with an oversized icon, that big tile dominated
// the page and read as heavy rather than editorial. Equal, lighter cards let
// all nine categories show and keep the emphasis on the products below.
function CategoryCard({ cat, index }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="cat-card"
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2, margin: '0px 0px -50px 0px' }}
      transition={{
        duration: reduceMotion ? 0 : 0.55,
        ease: EASE,
        // Capped so the last cards in a 9-item grid don't lag noticeably
        // behind the first.
        delay: reduceMotion ? 0 : Math.min(index, 8) * 0.045,
      }}
      whileHover={reduceMotion ? undefined : { y: -4 }}
    >
      <Link to={`/shop.html?category=${encodeURIComponent(cat)}`}>
        <span className="cat-card-icon">
          <Icon name={CATEGORY_ICONS[cat]} size={20} />
        </span>
        <span className="cat-card-text">
          <span className="cat-card-name">{cat}</span>
          <span className="cat-card-blurb">{CATEGORY_BLURBS[cat]}</span>
        </span>
        <span className="cat-card-arrow" aria-hidden="true">
          →
        </span>
      </Link>
    </motion.div>
  );
}

function FeaturedCategories() {
  return (
    <section className="section" id="categories-section">
      <SectionHead eyebrow="Browse" title="Shop by category" href="/shop.html" />
      <div className="cat-grid">
        {CATEGORIES.map((cat, i) => (
          <CategoryCard key={cat} cat={cat} index={i} />
        ))}
      </div>
    </section>
  );
}

/* ========================== 3. PRODUCT RAILS ========================== */

function ProductRail({ id, eyebrow, title, href, state, wishlistIds, visibleCount = 5 }) {
  const reduceMotion = useReducedMotion();
  const { data, error, reload } = state;

  return (
    <section className="section" id={id}>
      <SectionHead eyebrow={eyebrow} title={title} href={href} />
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <SlidableRail
          wrapClassName="product-rail"
          railClassName="product-shelf"
          visibleCount={visibleCount}
          prevLabel={`Previous ${title.toLowerCase()}`}
          nextLabel={`More ${title.toLowerCase()}`}
        >
          {data === null
            ? Array.from({ length: visibleCount }).map((_, i) => <ProductCardSkeleton key={i} />)
            : data.map((p, i) => (
                <ProductCard
                  key={p._id}
                  product={p}
                  delay={reduceMotion ? 0 : Math.min(i, 8) * 0.05}
                  isWishlisted={wishlistIds.has(p._id)}
                />
              ))}
        </SlidableRail>
      )}
    </section>
  );
}

/* ========================= 4. EDITORIAL STORY ========================= */

function BrandStory({ image }) {
  const reduceMotion = useReducedMotion();
  return (
    <section className="brand-story">
      <div className="container brand-story-inner">
        <motion.div className="brand-story-media" {...reveal(reduceMotion)}>
          {image ? <img src={image} alt="" loading="lazy" decoding="async" /> : <div className="brand-story-empty" />}
        </motion.div>
        <motion.div className="brand-story-copy" {...reveal(reduceMotion, 0.1)}>
          <span className="eyebrow">{BRAND_STORY.eyebrow}</span>
          <h2>{BRAND_STORY.title}</h2>
          {BRAND_STORY.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
          <a className="link-arrow link-arrow--lg" href={BRAND_STORY.cta.href}>
            {BRAND_STORY.cta.label} <span aria-hidden="true">→</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}

/* ===================== 5. FEATURED PRODUCT SHOWCASE ===================== */

function FeaturedShowcase({ product }) {
  const reduceMotion = useReducedMotion();
  if (!product) return null;
  const discount = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

  return (
    <section className="section showcase">
      <div className="showcase-inner">
        <motion.div
          className="showcase-media"
          initial={reduceMotion ? false : { opacity: 0, scale: 1.04 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: reduceMotion ? 0 : 1, ease: EASE }}
        >
          <Link to={`/product.html?id=${product._id}`}>
            <img src={product.image} alt={product.name} loading="lazy" decoding="async" />
          </Link>
        </motion.div>
        <motion.div className="showcase-copy" {...reveal(reduceMotion, 0.12)}>
          <span className="eyebrow">Featured</span>
          <h2>{product.name}</h2>
          <p>{product.description}</p>
          <div className="showcase-price">
            <span className="price">Rs. {product.price.toFixed(2)}</span>
            {discount > 0 && (
              <>
                <span className="mrp">Rs. {product.mrp.toFixed(2)}</span>
                <span className="discount">{discount}% off</span>
              </>
            )}
          </div>
          <Link className="btn btn-primary btn-arrow" to={`/product.html?id=${product._id}`}>
            Discover product <span aria-hidden="true">→</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

/* ========================== 6. CAMPAIGN BAND ========================== */

// The headline number is computed from the real catalogue, not written by
// hand -- if nothing is discounted, the section doesn't claim anything.
function CampaignBand({ products }) {
  const reduceMotion = useReducedMotion();
  if (!products || products.length === 0) return null;
  const maxDiscount = products.reduce(
    (max, p) => (p.mrp > p.price ? Math.max(max, Math.round(((p.mrp - p.price) / p.mrp) * 100)) : max),
    0
  );
  if (maxDiscount <= 0) return null;

  return (
    <motion.section className="campaign" {...reveal(reduceMotion)}>
      <div className="container campaign-inner">
        <span className="eyebrow">This season</span>
        <p className="campaign-figure">
          Up to <strong>{maxDiscount}%</strong> off
        </p>
        <p className="campaign-sub">Selected pieces across home, beauty and wardrobe.</p>
        <Link className="btn btn-invert btn-arrow" to="/shop.html?sort=offers">
          Shop the offers <span aria-hidden="true">→</span>
        </Link>
      </div>
    </motion.section>
  );
}

/* ======================= 7. PROMO TILES (admin) ======================= */

function PromoTiles() {
  const reduceMotion = useReducedMotion();
  const [tiles, setTiles] = useState(null);
  const [error, setError] = useState(null);

  function load() {
    setError(null);
    let cancelled = false;
    api
      .get('/promo-tiles')
      .then((d) => !cancelled && setTiles(d))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }
  useEffect(() => load(), []);

  if (error) {
    return (
      <section className="section" id="promo-tiles-section">
        <SectionHead eyebrow="Offers" title="Today's deals" />
        <ErrorState message={error} onRetry={load} />
      </section>
    );
  }
  if (tiles === null) {
    return (
      <section className="section" id="promo-tiles-section">
        <SectionHead eyebrow="Offers" title="Today's deals" />
        <PromoTilesGridSkeleton count={2} />
      </section>
    );
  }
  if (tiles.length === 0) return null;

  return (
    <section className="section" id="promo-tiles-section">
      <SectionHead eyebrow="Offers" title="Today's deals" href="/shop.html" />
      <div className="promo-tiles-grid">
        {tiles.map((t, i) => (
          <motion.a
            key={t._id}
            href={t.link || '/shop.html'}
            className="promo-tile"
            style={{ background: t.bgColor || 'var(--paper)' }}
            {...reveal(reduceMotion, Math.min(i, 8) * 0.05)}
          >
            {t.badge && <span className="promo-tile-badge">{t.badge}</span>}
            <div className="promo-tile-copy">
              <h3>{t.heading}</h3>
              <span className="promo-tile-cta">Shop now</span>
            </div>
            <img src={t.image} alt="" loading="lazy" decoding="async" />
          </motion.a>
        ))}
      </div>
    </section>
  );
}

/* ============================ 8. BENEFITS ============================ */

const BENEFITS = [
  { icon: 'truck', title: 'Free shipping', sub: 'On every order over Rs. 499.' },
  { icon: 'check', title: 'Secure payments', sub: 'Encrypted checkout, UPI, cards and COD.' },
  { icon: 'return', title: 'Easy returns', sub: 'Seven days, no complicated conditions.' },
  { icon: 'gem', title: 'Considered quality', sub: 'A small range, chosen piece by piece.' },
];

function Benefits() {
  const reduceMotion = useReducedMotion();
  return (
    <section className="section">
      <div className="benefits">
        {BENEFITS.map((b, i) => (
          <motion.div className="benefit" key={b.title} {...reveal(reduceMotion, Math.min(i, 8) * 0.05)}>
            <span className="benefit-icon">
              <Icon name={b.icon} size={22} />
            </span>
            <strong>{b.title}</strong>
            <span className="benefit-sub">{b.sub}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* =========================== 9. SOCIAL PROOF =========================== */

const TESTIMONIALS = [
  { stars: 5, quote: 'Amazing quality and super-fast delivery. The vacuum cleaner works perfectly!', name: 'Priya S.', place: 'Mumbai', avatar: 'PS' },
  { stars: 5, quote: 'Great prices and genuine cash on delivery option. Will shop again.', name: 'Rahul K.', place: 'Delhi', avatar: 'RK' },
  { stars: 4, quote: 'Loved the kids toy collection, my daughter is obsessed with it!', name: 'Anita M.', place: 'Pune', avatar: 'AM' },
];

function SocialProof() {
  const reduceMotion = useReducedMotion();
  return (
    <section className="section">
      <SectionHead eyebrow="Customers" title="What people say" align="center" />
      <div className="reviews-row">
        {TESTIMONIALS.map((t, i) => (
          <motion.figure className="review-quote" key={t.name} {...reveal(reduceMotion, Math.min(i, 8) * 0.06)}>
            <div className="review-quote-stars" aria-label={`${t.stars} out of 5 stars`}>
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} className={`star-ico ${s <= t.stars ? 'filled' : 'muted'}`}>
                  <Icon name="star" size={14} />
                </span>
              ))}
            </div>
            <blockquote>{t.quote}</blockquote>
            <figcaption>
              <span className="avatar">{t.avatar}</span>
              <span>
                <strong>{t.name}</strong>
                <span className="review-quote-place">{t.place}</span>
              </span>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  );
}

/* ========================== 10. SHOP THE LOOK ========================== */

function ShopTheLook({ products }) {
  const reduceMotion = useReducedMotion();
  const items = (products || []).slice(0, 5);
  if (items.length < 3) return null;

  return (
    <section className="section">
      <SectionHead eyebrow={SHOP_THE_LOOK.eyebrow} title={SHOP_THE_LOOK.title} href="/shop.html" linkLabel="Shop all" />
      <p className="section-lede">{SHOP_THE_LOOK.body}</p>
      <div className="look-grid">
        {items.map((p, i) => (
          <motion.div className={`look-tile look-tile-${i + 1}`} key={p._id} {...reveal(reduceMotion, Math.min(i, 8) * 0.05)}>
            <Link to={`/product.html?id=${p._id}`}>
              <img src={p.image} alt={p.name} loading="lazy" decoding="async" />
              <span className="look-tile-overlay">
                <span className="look-tile-name">{p.name}</span>
                <span className="look-tile-price">Rs. {p.price.toFixed(2)}</span>
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* =========================== 11. NEWSLETTER =========================== */

function Newsletter() {
  const reduceMotion = useReducedMotion();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null); // { type: 'success'|'error', text }
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus(null);
    setSubmitting(true);
    try {
      const data = await api.post('/subscribers', { email: email.trim() });
      setStatus({ type: 'success', text: data.message || "You're on the list." });
      setEmail('');
    } catch (err) {
      setStatus({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.section className="newsletter" {...reveal(reduceMotion)}>
      <div className="container newsletter-inner">
        <div>
          <span className="eyebrow">{NEWSLETTER_COPY.eyebrow}</span>
          <h2>{NEWSLETTER_COPY.title}</h2>
          <p>{NEWSLETTER_COPY.body}</p>
        </div>
        <form className="newsletter-form" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="newsletter-email">
            Email address
          </label>
          <div className="newsletter-field">
            <input
              id="newsletter-email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-describedby={status ? 'newsletter-status' : undefined}
            />
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Joining...' : 'Join'}
            </button>
          </div>
          {status && (
            <p
              id="newsletter-status"
              role={status.type === 'error' ? 'alert' : 'status'}
              className={`newsletter-status ${status.type}`}
            >
              {status.text}
            </p>
          )}
        </form>
      </div>
    </motion.section>
  );
}

/* ============================== PAGE ============================== */

export default function HomePage() {
  useDocumentTitle('Retalla — Considered pieces for everyday living');
  const wishlistIds = useWishlistIds();

  // Each list is fetched once here and shared by the sections that need it,
  // rather than every section issuing its own duplicate request.
  const bestsellers = useProducts('/products?bestseller=true&limit=8');
  const featured = useProducts('/products?featured=true&limit=8');
  // The products API already sorts newest-first, so this is a real
  // "new arrivals" list rather than an invented one.
  const newest = useProducts('/products?limit=8');

  const showcaseProduct = featured.data?.[0] || bestsellers.data?.[0] || null;
  const storyImage = bestsellers.data?.[3]?.image || featured.data?.[1]?.image || null;

  return (
    <>
      <Hero />
      <main className="home-main">
        <div className="container">
          <BannerCarousel />
          <FeaturedCategories />
          <ProductRail
            id="bestseller-section"
            eyebrow="Most loved"
            title="Best sellers"
            href="/shop.html?sort=bestseller"
            state={bestsellers}
            wishlistIds={wishlistIds}
          />
          <LiveVideoSection />
        </div>

        <BrandStory image={storyImage} />

        <div className="container">
          <FeaturedShowcase product={showcaseProduct} />
        </div>

        <CampaignBand products={[...(bestsellers.data || []), ...(featured.data || [])]} />

        <div className="container">
          <PromoTiles />
          <ProductRail
            id="new-arrivals-section"
            eyebrow="Just in"
            title="New arrivals"
            href="/shop.html?sort=new"
            state={newest}
            wishlistIds={wishlistIds}
          />
          <Benefits />
          <SocialProof />
          <ShopTheLook products={featured.data || bestsellers.data} />
        </div>

        <Newsletter />
      </main>
    </>
  );
}
