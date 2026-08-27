require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const heroRoutes = require('./routes/heroRoutes');
const promoTileRoutes = require('./routes/promoTileRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const addressRoutes = require('./routes/addressRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

connectDB();

app.use(cors());
app.use(express.json({ limit: '20mb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/hero', heroRoutes);
app.use('/api/promo-tiles', promoTileRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/addresses', addressRoutes);

// --- React SPA (web/) -- incremental page migration -------------------------
// Allowlist of URL paths served by the Vite-built React app in web/dist
// instead of the matching static file in public/. Every path here must also
// exist as a <Route> in web/src/App.jsx. To migrate another page: add it to
// both places, rebuild, redeploy. Do not remove express.static(publicDir)
// below -- every path NOT in this list still needs to come from public/.
//
// ORDERING IS LOAD-BEARING: this block must stay above
// app.use(express.static(publicDir)). Express serves the first matching
// handler it finds in registration order; if this block is ever moved below
// the public/ static mount, these paths will silently start serving the old
// public/*.html files again instead of the React app -- no error, no crash,
// just wrong content.
const REACT_ROUTES = [
  '/',
  '/index.html',
  '/login.html',
  '/register.html',
  '/customer-service.html',
  '/shipping-returns.html',
  '/privacy-policy.html',
  '/terms.html',
  '/shop.html',
  '/product.html',
  '/cart.html',
  '/wishlist.html',
  '/account.html',
  '/checkout.html',
  '/order-success.html',
];

const webDistDir = path.join(__dirname, '..', 'web', 'dist');

// Scoped to the assets/ subdirectory only, not all of web/dist -- public/ has
// no assets/ folder of its own today, so this can't collide with anything.
// Mounting the WHOLE dist dir at "/" would let web/dist/index.html intercept
// every request before public/ ever saw them -- which is exactly what the
// explicit REACT_ROUTES allowlist above does deliberately for "/" and
// "/index.html" (the live homepage). Scoping to assets/ guards against ever
// doing that as an uncontrolled blanket mount.
app.use('/assets', express.static(path.join(webDistDir, 'assets')));

app.get(REACT_ROUTES, (req, res) => {
  res.sendFile(path.join(webDistDir, 'index.html'));
});

const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

app.get('/admin', (req, res) => res.sendFile(path.join(publicDir, 'admin', 'index.html')));
app.get('/admin/*', (req, res) => {
  const requested = path.join(publicDir, req.path);
  res.sendFile(requested, (err) => {
    if (err) res.sendFile(path.join(publicDir, 'admin', 'index.html'));
  });
});

app.use('/api', notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`[server] Retalla running on http://localhost:${PORT}`));
