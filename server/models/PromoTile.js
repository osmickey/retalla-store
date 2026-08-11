const mongoose = require('mongoose');

const promoTileSchema = new mongoose.Schema(
  {
    image: { type: String, required: true },
    heading: { type: String, required: true, trim: true },
    badge: { type: String, default: '', trim: true },
    link: { type: String, default: '', trim: true },
    bgColor: { type: String, default: '#fdf1d6' },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PromoTile', promoTileSchema);
