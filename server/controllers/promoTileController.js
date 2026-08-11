const PromoTile = require('../models/PromoTile');

const MAX_PROMO_TILES = 8;

async function listPromoTiles(req, res) {
  const filter = req.query.all === 'true' ? {} : { active: true };
  const tiles = await PromoTile.find(filter).sort({ order: 1, createdAt: 1 });
  res.json(tiles);
}

async function createPromoTile(req, res) {
  const count = await PromoTile.countDocuments();
  if (count >= MAX_PROMO_TILES) {
    return res.status(400).json({ message: `You can only have up to ${MAX_PROMO_TILES} deal tiles. Delete one first.` });
  }
  const tile = await PromoTile.create({ ...req.body, order: count });
  res.status(201).json(tile);
}

async function updatePromoTile(req, res) {
  const tile = await PromoTile.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!tile) return res.status(404).json({ message: 'Deal tile not found' });
  res.json(tile);
}

async function deletePromoTile(req, res) {
  const tile = await PromoTile.findByIdAndDelete(req.params.id);
  if (!tile) return res.status(404).json({ message: 'Deal tile not found' });
  res.json({ message: 'Deal tile deleted' });
}

module.exports = { listPromoTiles, createPromoTile, updatePromoTile, deletePromoTile, MAX_PROMO_TILES };
