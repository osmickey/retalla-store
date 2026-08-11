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
