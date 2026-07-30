const mongoose = require('mongoose');

const homeBannerSchema = new mongoose.Schema(
  {
    image: { type: String, required: true },
    link: { type: String, default: '', trim: true },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('HomeBanner', homeBannerSchema);
