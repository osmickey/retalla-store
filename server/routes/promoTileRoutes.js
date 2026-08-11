const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { listPromoTiles, createPromoTile, updatePromoTile, deletePromoTile } = require('../controllers/promoTileController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.get('/', asyncHandler(listPromoTiles));
router.post('/', protect, admin, asyncHandler(createPromoTile));
router.put('/:id', protect, admin, asyncHandler(updatePromoTile));
router.delete('/:id', protect, admin, asyncHandler(deletePromoTile));

module.exports = router;
