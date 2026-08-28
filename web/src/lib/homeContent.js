// Editorial copy for the homepage, kept out of HomePage.jsx so the page file
// stays about structure and data. Everything here is brand voice -- no
// product claims, no invented statistics, no fabricated scarcity.

// Matches the real free-shipping threshold used elsewhere on the site
// (the Perks section and the Shipping & Returns page both say Rs. 499).
export const FREE_SHIPPING_THRESHOLD = 499;

export const ANNOUNCEMENTS = [
  `Free shipping on orders over Rs. ${FREE_SHIPPING_THRESHOLD}`,
  'Cash on delivery available across India',
  '7-day easy returns on every order',
];

export const HERO_COPY = {
  eyebrow: 'Retalla',
  title: 'Designed for the',
  titleAccent: 'way you live',
  subtitle:
    'Thoughtfully selected pieces for the home, the everyday and everything in between — chosen for quality, function and the way they feel to use.',
  primaryCta: { label: 'Shop the collection', href: '/shop.html' },
  secondaryCta: { label: 'Browse categories', href: '/shop.html' },
};

export const BRAND_STORY = {
  eyebrow: 'Our approach',
  title: 'Made to be lived with.',
  body: [
    'Retalla exists for the things you actually reach for — the kettle on a weekday morning, the shirt you keep going back to, the light you leave on in the hallway.',
    'We keep the range deliberately small. Every piece earns its place by being genuinely useful, honestly priced, and good enough to keep.',
  ],
  cta: { label: 'Read our story', href: '/customer-service.html' },
};

export const CATEGORY_BLURBS = {
  'Home Items': 'Everyday pieces that quietly make a room work.',
  'Women Western': 'Modern silhouettes built for real wardrobes.',
  Lingerie: 'Softness and support, considered in equal measure.',
  Men: 'Clean staples with a considered finish.',
  'Kids & Toys': 'Play that lasts longer than the afternoon.',
  'Home & Kitchen': 'Tools that make the everyday feel easier.',
  'Beauty & Health': 'Simple routines, thoughtfully sourced.',
  Jewellery: 'Small details, worn every day.',
  'Bags & Foot': 'Carried and worn from morning to night.',
};

export const NEWSLETTER_COPY = {
  eyebrow: 'Stay in touch',
  title: 'Be the first to know what lands next.',
  body: 'Early access to new arrivals, seasonal edits and offers worth opening. No noise — a few emails a month at most.',
};

export const SHOP_THE_LOOK = {
  eyebrow: 'Shop the look',
  title: 'Seen together',
  body: 'Pieces from across the range, styled the way our customers actually use them.',
};
