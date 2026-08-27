const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { listUsers, updateProfile, changePassword } = require('../controllers/userController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, admin, asyncHandler(listUsers));
router.put('/profile', protect, asyncHandler(updateProfile));
router.put('/change-password', protect, asyncHandler(changePassword));

module.exports = router;
