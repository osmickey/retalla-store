const mongoose = require('mongoose');

const homeHeroSchema = new mongoose.Schema(
  {
    badge: { type: String, default: '', trim: true },
    title: { type: String, default: '', trim: true },
    highlight: { type: String, default: '', trim: true },
    subtitle: { type: String, default: '', trim: true },
    ctaText: { type: String, default: '', trim: true },
    ctaLink: { type: String, default: '', trim: true },
    secondaryText: { type: String, default: '', trim: true },
    secondaryLink: { type: String, default: '', trim: true },
    image: { type: String, default: '' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('HomeHero', homeHeroSchema);
