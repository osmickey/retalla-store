const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const {
  register,
  login,
  me,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  verifyPhone,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.get('/me', protect, asyncHandler(me));

router.post('/forgot-password', asyncHandler(forgotPassword));
router.post('/verify-reset-otp', asyncHandler(verifyResetOtp));
router.post('/reset-password', asyncHandler(resetPassword));
router.post('/verify-phone', protect, asyncHandler(verifyPhone));

module.exports = router;
