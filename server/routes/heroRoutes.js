const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { getHero, updateHero } = require('../controllers/heroController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.get('/', asyncHandler(getHero));
router.put('/', protect, admin, asyncHandler(updateHero));

module.exports = router;
