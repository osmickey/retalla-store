const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { listWishlist, listWishlistIds, addToWishlist, removeFromWishlist } = require('../controllers/wishlistController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, asyncHandler(listWishlist));
router.get('/ids', protect, asyncHandler(listWishlistIds));
router.post('/:productId', protect, asyncHandler(addToWishlist));
router.delete('/:productId', protect, asyncHandler(removeFromWishlist));

module.exports = router;
