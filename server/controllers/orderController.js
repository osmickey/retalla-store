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

async function analytics(req, res) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 6 * DAY_MS);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const [dailyAgg, monthlyAgg] = await Promise.all([
    Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo }, status: { $ne: 'Cancelled' } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalPrice' },
          orders: { $sum: 1 },
        },
      },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo }, status: { $ne: 'Cancelled' } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: '$totalPrice' },
          orders: { $sum: 1 },
        },
      },
    ]),
  ]);

  const dailyMap = new Map(dailyAgg.map((d) => [d._id, d]));
  const weekly = { labels: [], orders: [], revenue: [] };
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo.getTime() + i * DAY_MS);
    const entry = dailyMap.get(dateKey(d));
    weekly.labels.push(WEEKDAY_LABELS[d.getDay()]);
    weekly.orders.push(entry?.orders || 0);
    weekly.revenue.push(entry?.revenue || 0);
  }

  const monthlyMap = new Map(monthlyAgg.map((d) => [d._id, d]));
  const monthly = { labels: [], orders: [], revenue: [] };
  for (let i = 0; i < 12; i++) {
    const d = new Date(twelveMonthsAgo.getFullYear(), twelveMonthsAgo.getMonth() + i, 1);
    const entry = monthlyMap.get(monthKey(d));
    monthly.labels.push(MONTH_LABELS[d.getMonth()]);
    monthly.orders.push(entry?.orders || 0);
    monthly.revenue.push(entry?.revenue || 0);
  }

  res.json({ weekly, monthly });
}

module.exports = {
  createOrder,
  myOrders,
  getOrder,
  listAllOrders,
  updateOrderStatus,
  stats,
  analytics,
};
