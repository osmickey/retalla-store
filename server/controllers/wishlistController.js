const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

async function listWishlist(req, res) {
  const entries = await Wishlist.find({ user: req.user._id }).populate('product').sort({ createdAt: -1 });
  res.json(entries.map((e) => e.product).filter(Boolean));
}

async function listWishlistIds(req, res) {
  const entries = await Wishlist.find({ user: req.user._id }).select('product');
  res.json(entries.map((e) => e.product.toString()));
}

async function addToWishlist(req, res) {
  const productId = req.params.productId;
  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const existing = await Wishlist.findOne({ user: req.user._id, product: productId });
  if (!existing) {
    await Wishlist.create({ user: req.user._id, product: productId });
  }
  res.status(201).json({ added: true });
}

async function removeFromWishlist(req, res) {
  await Wishlist.deleteOne({ user: req.user._id, product: req.params.productId });
  res.json({ removed: true });
}

module.exports = { listWishlist, listWishlistIds, addToWishlist, removeFromWishlist };
