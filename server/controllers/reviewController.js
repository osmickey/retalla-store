const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');

async function hasPurchased(userId, productId) {
  const order = await Order.findOne({
    user: userId,
    status: { $ne: 'Cancelled' },
    'items.product': productId,
  });
  return !!order;
}

async function recalculateProductRating(productId) {
  const reviews = await Review.find({ product: productId });
  const numReviews = reviews.length;
  const rating = numReviews ? reviews.reduce((sum, r) => sum + r.rating, 0) / numReviews : 0;
  await Product.findByIdAndUpdate(productId, { rating, numReviews });
}

async function listReviews(req, res) {
  const reviews = await Review.find({ product: req.params.id })
    .populate('user', 'name')
    .sort({ createdAt: -1 });
  res.json(reviews);
}

async function getEligibility(req, res) {
  const productId = req.params.id;
  const [purchased, existingReview] = await Promise.all([
    hasPurchased(req.user._id, productId),
    Review.findOne({ product: productId, user: req.user._id }),
  ]);

  if (existingReview) {
    return res.json({ canReview: false, reason: 'already_reviewed' });
  }
  if (!purchased) {
    return res.json({ canReview: false, reason: 'not_purchased' });
  }
  res.json({ canReview: true });
}

async function createReview(req, res) {
  const productId = req.params.id;
  const { rating, comment } = req.body;

  const ratingNum = Number(rating);
  if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5' });
  }
  if (!comment || !comment.trim()) {
    return res.status(400).json({ message: 'Please write a comment for your review' });
  }

  const purchased = await hasPurchased(req.user._id, productId);
  if (!purchased) {
    return res.status(403).json({ message: 'You can only review products you have purchased' });
  }

  const existing = await Review.findOne({ product: productId, user: req.user._id });
  if (existing) {
    return res.status(400).json({ message: 'You have already reviewed this product' });
  }

  const review = await Review.create({
    product: productId,
    user: req.user._id,
    rating: ratingNum,
    comment: comment.trim(),
  });
  await recalculateProductRating(productId);

  const populated = await review.populate('user', 'name');
  res.status(201).json(populated);
}

module.exports = { listReviews, getEligibility, createReview };
