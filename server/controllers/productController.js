const Product = require('../models/Product');

async function listProducts(req, res) {
  const { category, search, featured, bestseller, liveVideo, ids, limit } = req.query;
  const filter = {};

  if (category) filter.category = category;
  if (featured === 'true') filter.isFeatured = true;
  if (bestseller === 'true') filter.isBestSeller = true;
  if (liveVideo === 'true') filter.isLiveVideo = true;
  if (ids) filter._id = { $in: ids.split(',') };
  if (search) filter.$text = { $search: search };

  let query = Product.find(filter).sort({ createdAt: -1 });
  if (limit) query = query.limit(Number(limit));

  const products = await query;
  res.json(products);
}

async function getProduct(req, res) {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
}

async function getCategories(req, res) {
  res.json(Product.CATEGORIES || require('../models/Product').CATEGORIES);
}

async function createProduct(req, res) {
  const product = await Product.create(req.body);
  res.status(201).json(product);
}

async function updateProduct(req, res) {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
}

async function deleteProduct(req, res) {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json({ message: 'Product deleted' });
}

module.exports = {
  listProducts,
  getProduct,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
};
