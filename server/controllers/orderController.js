const Order = require('../models/Order');
const Product = require('../models/Product');

async function createOrder(req, res) {
  const { items, shippingAddress, paymentMethod } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'No order items provided' });
  }

  const productIds = items.map((i) => i.product);
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  if (paymentMethod === 'COD') {
    const codBlocked = items.some((item) => {
      const product = productMap.get(item.product);
      return product && product.codAvailable === false;
    });
    if (codBlocked) {
      return res.status(400).json({ message: 'Cash on Delivery is not available for one or more items in your cart' });
    }
  }

  let itemsPrice = 0;
  const orderItems = items.map((item) => {
    const product = productMap.get(item.product);
    if (!product) throw new Error(`Product not found: ${item.product}`);
    if (product.stock < item.qty) {
      throw new Error(`Insufficient stock for ${product.name}`);
    }
    itemsPrice += product.price * item.qty;
    return {
      product: product._id,
      name: product.name,
      sku: product.sku || '',
      image: product.image,
      price: product.price,
      qty: item.qty,
    };
  });

  const shippingPrice = itemsPrice >= 499 ? 0 : 49;
  const totalPrice = itemsPrice + shippingPrice;

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    shippingPrice,
    totalPrice,
  });

  await Promise.all(
    orderItems.map((item) =>
      Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.qty } })
    )
  );

  res.status(201).json(order);
}

async function myOrders(req, res) {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
}

async function getOrder(req, res) {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) return res.status(404).json({ message: 'Order not found' });

  const isOwner = order.user._id.toString() === req.user._id.toString();
  if (!isOwner && !req.user.isAdmin) {
    return res.status(403).json({ message: 'Not authorized to view this order' });
  }
  res.json(order);
}

async function listAllOrders(req, res) {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const orders = await Order.find(filter).populate('user', 'name email').sort({ createdAt: -1 });
  res.json(orders);
}

async function updateOrderStatus(req, res) {
  const { status } = req.body;
  const valid = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  if (!valid.includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status, ...(status === 'Delivered' ? { isPaid: true, paidAt: new Date() } : {}) },
    { new: true }
  );
  if (!order) return res.status(404).json({ message: 'Order not found' });
  res.json(order);
}

async function updateTracking(req, res) {
  const { trackingId, courierName } = req.body;
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { trackingId: (trackingId || '').trim(), courierName: (courierName || '').trim() },
    { new: true }
  );
  if (!order) return res.status(404).json({ message: 'Order not found' });
  res.json(order);
}

async function stats(req, res) {
  const [totalOrders, totalProducts, revenueAgg, pendingOrders] = await Promise.all([
    Order.countDocuments(),
    Product.countDocuments(),
    Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]),
    Order.countDocuments({ status: 'Pending' }),
  ]);

  res.json({
    totalOrders,
    totalProducts,
    totalRevenue: revenueAgg[0]?.total || 0,
    pendingOrders,
  });
}

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function monthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function startOfWeek(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - date.getDay());
  return date;
}
function daysInMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

async function aggregateByDay(start, end) {
  const rows = await Order.aggregate([
    { $match: { createdAt: { $gte: start, $lt: end }, status: { $ne: 'Cancelled' } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$totalPrice' },
        orders: { $sum: 1 },
      },
    },
  ]);
  return new Map(rows.map((r) => [r._id, r]));
}

async function aggregateByMonth(start, end) {
  const rows = await Order.aggregate([
    { $match: { createdAt: { $gte: start, $lt: end }, status: { $ne: 'Cancelled' } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        revenue: { $sum: '$totalPrice' },
        orders: { $sum: 1 },
      },
    },
  ]);
  return new Map(rows.map((r) => [r._id, r]));
}

function buildDailySeries(start, days, map, labelStyle) {
  const series = { labels: [], orders: [], revenue: [] };
  for (let i = 0; i < days; i++) {
    const d = new Date(start.getTime() + i * DAY_MS);
    const entry = map.get(dateKey(d));
    series.labels.push(labelStyle === 'weekday' ? WEEKDAY_LABELS[d.getDay()] : String(d.getDate()));
    series.orders.push(entry?.orders || 0);
    series.revenue.push(entry?.revenue || 0);
  }
  return series;
}

function buildMonthlySeries(start, months, map) {
  const series = { labels: [], orders: [], revenue: [] };
  for (let i = 0; i < months; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const entry = map.get(monthKey(d));
    series.labels.push(MONTH_LABELS[d.getMonth()]);
    series.orders.push(entry?.orders || 0);
    series.revenue.push(entry?.revenue || 0);
  }
  return series;
}

async function analytics(req, res) {
  const now = new Date();

  const weekStart = startOfWeek(now);
  const weekEnd = new Date(weekStart.getTime() + 7 * DAY_MS);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthDays = daysInMonth(now);

  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearEnd = new Date(now.getFullYear() + 1, 0, 1);

  const [weekMap, monthMap, yearMap] = await Promise.all([
    aggregateByDay(weekStart, weekEnd),
    aggregateByDay(monthStart, monthEnd),
    aggregateByMonth(yearStart, yearEnd),
  ]);

  const weekly = buildDailySeries(weekStart, 7, weekMap, 'weekday');
  const monthly = buildDailySeries(monthStart, monthDays, monthMap, 'daynum');
  const yearly = buildMonthlySeries(yearStart, 12, yearMap);

  res.json({ weekly, monthly, yearly });
}

module.exports = {
  createOrder,
  myOrders,
  getOrder,
  listAllOrders,
  updateOrderStatus,
  updateTracking,
  stats,
  analytics,
};
