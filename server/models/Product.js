const mongoose = require('mongoose');

const CATEGORIES = [
  'Home Items',
  'Women Western',
  'Lingerie',
  'Men',
  'Kids & Toys',
  'Home & Kitchen',
  'Beauty & Health',
  'Jewellery',
  'Bags & Foot',
];

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, required: true, enum: CATEGORIES },
    image: { type: String, required: true },
    images: { type: [String], default: [] },
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, default: 0, min: 0 },
    rating: { type: Number, default: 4.0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    freeDelivery: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.virtual('discountPercent').get(function computeDiscount() {
  if (!this.mrp || this.mrp <= this.price) return 0;
  return Math.round(((this.mrp - this.price) / this.mrp) * 100);
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
module.exports.CATEGORIES = CATEGORIES;
