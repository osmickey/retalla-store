import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { api } from '../lib/api';
import { CATEGORIES, CATEGORY_ICONS, CATEGORY_COLORS } from '../lib/config';
import { useWishlistIds } from '../lib/wishlist';
import { showToast } from '../lib/cart';
import Icon from '../icons/Icon';
import ProductGrid, { ProductCard } from '../components/ProductGrid';
import BannerCarousel from '../components/BannerCarousel';
import SlidableRail from '../components/SlidableRail';
import LiveVideoSection from '../components/LiveVideoSection';

const MotionLink = motion(Link);

const HERO_DEFAULTS = {
  badge: 'Mega Sale — Up to 50% Off',
  title: 'Smart Picks for',
  highlight: 'Everyday Living',
  subtitle:
    'Handpicked kitchen, fashion, beauty and home essentials — trusted by thousands of happy shoppers across India.',
  ctaText: 'Shop Now',
  ctaLink: '/shop.html',
  secondaryText: 'Explore Deals',
  secondaryLink: '/shop.html?category=Home%20%26%20Kitchen',
  image: '',
  active: true,
};

function Hero() {
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

  if (hero === undefined) return null;
  const h = { ...HERO_DEFAULTS, ...Object.fromEntries(Object.entries(hero).filter(([, v]) => v !== '' && v != null)) };
  if (h.active === false) return null;

  return (
    <section className="hero hero--ready">
      <span className="hero-orb hero-orb-1" />
      <span className="hero-orb hero-orb-2" />
      <div className="container hero-inner">
        <div className="hero-copy">
          {h.badge && (
            <span className="hero-badge">
              <span className="pulse-dot" />
              {h.badge}
            </span>
          )}
          <h1>
            {h.title}
            {h.highlight && <span className="hero-highlight"> {h.highlight}</span>}
          </h1>
          {h.subtitle && <p>{h.subtitle}</p>}
          <div className="hero-actions">
            {h.ctaText && (
              <a href={h.ctaLink || '/shop.html'} className="btn btn-accent hero-cta">
                {h.ctaText} <span aria-hidden="true">→</span>
              </a>
            )}
            {h.secondaryText && (
              <a href={h.secondaryLink || '/shop.html'} className="btn btn-hero-outline">
                {h.secondaryText}
              </a>
            )}
          </div>
          <div className="hero-trust">
            <span>
              <Icon name="check" size={15} /> Free shipping
            </span>
            <span>
              <Icon name="check" size={15} /> 7-day returns
            </span>
            <span>
              <Icon name="check" size={15} /> Cash on delivery
            </span>
          </div>
        </div>
        <div className="hero-visual">
          {h.image ? (
            <div className="hero-art">
              <img src={h.image} alt="" />
            </div>
          ) : (
            <div className="hero-art hero-art-fallback">
              <span className="hero-tile hero-tile-main">
                <Icon name="bag" size={64} />
              </span>
              <span className="hero-tile hero-tile-a">
                <Icon name="kitchen" size={24} />
              </span>
              <span className="hero-tile hero-tile-b">
                <Icon name="sparkle" size={22} />
              </span>
              <span className="hero-tile hero-tile-c">
                <Icon name="gem" size={20} />
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function PromoTilesSection() {
  const [tiles, setTiles] = useState(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let cancelled = false;
    api
      .get('/promo-tiles')
      .then((d) => !cancelled && setTiles(d))
      .catch(() => !cancelled && setTiles([]));
    return () => {
      cancelled = true;
    };
  }, []);

  if (!tiles || tiles.length === 0) return null;

  return (
    <section className="section" id="promo-tiles-section">
      <div className="section-head">
        <div>
          <span className="eyebrow">Hot Deals</span>
          <h2>Today's Deals</h2>
        </div>
        <Link to="/shop.html">View all →</Link>
      </div>
      <div className="promo-tiles-grid">
        {tiles.map((t, i) => (
          <motion.a
            key={t._id}
            href={t.link || '/shop.html'}
            className="promo-tile"
            style={{ background: t.bgColor || '#f3f2fb' }}
            initial={reduceMotion ? false : { opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.12, margin: '0px 0px -40px 0px' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: reduceMotion ? 0 : Math.min(i, 8) * 0.05 }}
          >
            {t.badge && <span className="promo-tile-badge">{t.badge}</span>}
            <div className="promo-tile-copy">
              <h3>{t.heading}</h3>
              <span className="promo-tile-cta">Shop now</span>
            </div>
            <img src={t.image} alt="" loading="lazy" />
          </motion.a>
        ))}
      </div>
    </section>
  );
}

function BestsellerSection() {
  const [products, setProducts] = useState(null);
  const wishlistIds = useWishlistIds();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let cancelled = false;
    api
      .get('/products?bestseller=true&limit=8')
      .then((d) => !cancelled && setProducts(d))
      .catch(() => !cancelled && setProducts([]));
    return () => {
      cancelled = true;
    };
  }, []);

  if (!products || products.length === 0) return null;

  return (
    <section className="section" id="bestseller-section">
      <div className="section-head">
        <div>
          <span className="eyebrow">Top Picks</span>
          <h2>Best Selling</h2>
        </div>
        <Link to="/shop.html">View all →</Link>
      </div>
      <SlidableRail
        wrapClassName="bestseller-rail"
        railClassName="bestseller-shelf"
        visibleCount={5}
        prevLabel="Previous best sellers"
        nextLabel="More best sellers"
      >
        {products.map((p, i) => (
          <ProductCard key={p._id} product={p} delay={reduceMotion ? 0 : Math.min(i, 8) * 0.05} isWishlisted={wishlistIds.has(p._id)} />
        ))}
      </SlidableRail>
    </section>
  );
}

function CategoryTile({ cat, delay, reduceMotion }) {
  const [c1, c2] = CATEGORY_COLORS[cat] || ['#4f46e5', '#7c3aed'];
  return (
    <MotionLink
      className="category-tile"
      to={`/shop.html?category=${encodeURIComponent(cat)}`}
      style={{ '--cat-c1': c1, '--cat-c2': c2 }}
      initial={reduceMotion ? false : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12, margin: '0px 0px -40px 0px' }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay }}
    >
      <div className="icon-circle">
        <Icon name={CATEGORY_ICONS[cat]} size={26} />
      </div>
      {cat}
    </MotionLink>
  );
}

function CategorySection() {
  const reduceMotion = useReducedMotion();
  return (
    <section className="section category-section">
      <div className="section-head">
        <div>
          <span className="eyebrow">Browse</span>
          <h2>Shop by Category</h2>
        </div>
        <Link to="/shop.html">View all →</Link>
      </div>
      <SlidableRail
        wrapClassName="category-rail"
        railClassName="category-grid"
        visibleCount={3}
        prevLabel="Previous categories"
        nextLabel="More categories"
      >
        {CATEGORIES.map((cat, i) => (
          <CategoryTile key={cat} cat={cat} delay={reduceMotion ? 0 : Math.min(i, 8) * 0.04} reduceMotion={reduceMotion} />
        ))}
      </SlidableRail>
    </section>
  );
}

const QUOTES = [
  "Great style shouldn't cost a fortune.",
  'Shop today, glow tomorrow.',
  'Where quality meets everyday prices.',
  'Small cart, big smiles.',
  'Your happiness, delivered to your door.',
];

function QuoteStrip() {
  const [index, setIndex] = useState(0);
  const [swapping, setSwapping] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setSwapping(true);
      setTimeout(() => {
        setIndex((i) => (i + 1) % QUOTES.length);
        setSwapping(false);
      }, 350);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="quote-strip">
      <span className="quote-mark">✦</span>
      <p className={`quote-text${swapping ? ' swap' : ''}`}>{QUOTES[index]}</p>
    </section>
  );
}

function TrendingSection() {
  const [products, setProducts] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/products?featured=true&limit=8')
      .then((d) => !cancelled && setProducts(d))
      .catch((err) => {
        if (cancelled) return;
        showToast(err.message);
        setProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="section">
      <div className="section-head">
        <div>
          <span className="eyebrow">Trending</span>
          <h2>Just For You</h2>
        </div>
        <Link to="/shop.html">View all →</Link>
      </div>
      {products === null ? (
        <div className="dot-loader">
          <span></span>
          <span></span>
          <span></span>
        </div>
      ) : (
        <ProductGrid products={products} emptyMessage="No products to show right now." />
      )}
    </section>
  );
}

const PERKS = [
  { icon: 'return', c1: '#16a34a', c2: '#4ade80', title: '7 Days Return', sub: 'Easy & free returns', delay: 0 },
  { icon: 'wallet', c1: '#4f46e5', c2: '#7c3aed', title: 'Cash on Delivery', sub: 'Pay when it arrives', delay: 80 },
  { icon: 'truck', c1: '#ff6b4a', c2: '#ff3e6c', title: 'Free Shipping', sub: 'On orders over Rs. 499', delay: 160 },
  { icon: 'tag', c1: '#eab308', c2: '#f59e0b', title: 'Lowest Prices', sub: 'Best deals guaranteed', delay: 240 },
];

function Perks() {
  const reduceMotion = useReducedMotion();
  return (
    <section className="section">
      <div className="section-head">
        <div>
          <span className="eyebrow">Why Retalla</span>
          <h2>Shopping Made Easy</h2>
        </div>
      </div>
      <div className="perks">
        {PERKS.map((perk) => (
          <motion.div
            key={perk.title}
            className="perk-card"
            style={{ '--perk-c1': perk.c1, '--perk-c2': perk.c2 }}
            initial={reduceMotion ? false : { opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.12, margin: '0px 0px -40px 0px' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: reduceMotion ? 0 : perk.delay / 1000 }}
          >
            <span className="icon-circle">
              <Icon name={perk.icon} size={24} />
            </span>
            <div>
              <strong>{perk.title}</strong>
              <span>{perk.sub}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

const TRUST_STATS = [
  { value: '15,000+', label: 'Happy Customers' },
  { value: '4.8/5', label: 'Average Rating' },
  { value: '50%', label: 'Max Discount' },
  { value: '24/7', label: 'Customer Support' },
];

function TrustStrip() {
  return (
    <section className="section">
      <div className="trust-strip">
        {TRUST_STATS.map((s) => (
          <div className="stat" key={s.label}>
            <strong>{s.value}</strong>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

const TESTIMONIALS = [
  { stars: 5, quote: 'Amazing quality and super-fast delivery. The vacuum cleaner works perfectly!', name: 'Priya S., Mumbai', avatar: 'PS' },
  { stars: 5, quote: 'Great prices and genuine cash on delivery option. Will shop again.', name: 'Rahul K., Delhi', avatar: 'RK' },
  { stars: 4, quote: 'Loved the kids toy collection, my daughter is obsessed with it!', name: 'Anita M., Pune', avatar: 'AM' },
];

function Testimonials() {
  const reduceMotion = useReducedMotion();
  return (
    <section className="section">
      <div className="section-head">
        <h2>What our customers say</h2>
      </div>
      <div className="testimonial-grid">
        {TESTIMONIALS.map((t, i) => (
          <motion.div
            key={t.name}
            className="testimonial-card"
            initial={reduceMotion ? false : { opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.12, margin: '0px 0px -40px 0px' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: reduceMotion ? 0 : Math.min(i, 8) * 0.05 }}
          >
            <div className="stars">{'★'.repeat(t.stars)}{'☆'.repeat(5 - t.stars)}</div>
            <p>"{t.quote}"</p>
            <div className="who">
              <span className="avatar">{t.avatar}</span>
              {t.name}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

const TRUST_GRID = [
  { icon: 'check', c1: '#16a34a', c2: '#4ade80', title: 'Verified Reviews', sub: 'Real feedback from real buyers, every time' },
  { icon: 'return', c1: '#4f46e5', c2: '#7c3aed', title: '7-Day Easy Returns', sub: 'Changed your mind? No hassle, no questions' },
  { icon: 'truck', c1: '#ff6b4a', c2: '#ff3e6c', title: 'Fast, Tracked Delivery', sub: 'Follow your order from dispatch to doorstep' },
  { icon: 'wallet', c1: '#0891b2', c2: '#06b6d4', title: 'Secure Payments', sub: 'Visa · Mastercard · UPI · PayPal · COD' },
];

function TrustGrid() {
  const reduceMotion = useReducedMotion();
  return (
    <section className="section">
      <div className="section-head">
        <div>
          <span className="eyebrow">Shop With Confidence</span>
          <h2>Trusted &amp; Secure Shopping</h2>
        </div>
      </div>
      <div className="trust-grid">
        {TRUST_GRID.map((t, i) => (
          <motion.div
            key={t.title}
            className="trust-card"
            style={{ '--trust-c1': t.c1, '--trust-c2': t.c2 }}
            initial={reduceMotion ? false : { opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.12, margin: '0px 0px -40px 0px' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: reduceMotion ? 0 : Math.min(i, 8) * 0.05 }}
          >
            <span className="icon-circle">
              <Icon name={t.icon} size={24} />
            </span>
            <strong>{t.title}</strong>
            <span>{t.sub}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  useDocumentTitle('Retalla — Smart Shopping for Everyday Life');

  return (
    <>
      <Hero />
      <main className="container home-main">
        <BannerCarousel />
        <PromoTilesSection />
        <BestsellerSection />
        <CategorySection />
        <LiveVideoSection />
        <QuoteStrip />
        <TrendingSection />
        <Perks />
        <TrustStrip />
        <Testimonials />
        <TrustGrid />
      </main>
    </>
  );
}
