const HomeBanner = require('../models/HomeBanner');

const MAX_BANNERS = 6;

async function listBanners(req, res) {
  const filter = req.query.all === 'true' ? {} : { active: true };
  const banners = await HomeBanner.find(filter).sort({ order: 1, createdAt: 1 });
  res.json(banners);
}

async function createBanner(req, res) {
  const count = await HomeBanner.countDocuments();
  if (count >= MAX_BANNERS) {
    return res.status(400).json({ message: `You can only have up to ${MAX_BANNERS} banners. Delete one first.` });
  }
  const banner = await HomeBanner.create({ ...req.body, order: count });
  res.status(201).json(banner);
}

async function updateBanner(req, res) {
  const banner = await HomeBanner.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!banner) return res.status(404).json({ message: 'Banner not found' });
  res.json(banner);
}

async function deleteBanner(req, res) {
  const banner = await HomeBanner.findByIdAndDelete(req.params.id);
  if (!banner) return res.status(404).json({ message: 'Banner not found' });
  res.json({ message: 'Banner deleted' });
}

module.exports = { listBanners, createBanner, updateBanner, deleteBanner, MAX_BANNERS };
