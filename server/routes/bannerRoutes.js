const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { listBanners, createBanner, updateBanner, deleteBanner } = require('../controllers/bannerController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.get('/', asyncHandler(listBanners));
router.post('/', protect, admin, asyncHandler(createBanner));
router.put('/:id', protect, admin, asyncHandler(updateBanner));
router.delete('/:id', protect, admin, asyncHandler(deleteBanner));

module.exports = router;
