const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const {
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require('../controllers/addressController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, asyncHandler(listAddresses));
router.post('/', protect, asyncHandler(createAddress));
router.put('/:id', protect, asyncHandler(updateAddress));
router.delete('/:id', protect, asyncHandler(deleteAddress));
router.put('/:id/default', protect, asyncHandler(setDefaultAddress));

module.exports = router;
