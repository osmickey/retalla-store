const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const {
  listProducts,
  getProduct,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.get('/', asyncHandler(listProducts));
router.get('/categories', asyncHandler(getCategories));
router.get('/:id', asyncHandler(getProduct));
router.post('/', protect, admin, asyncHandler(createProduct));
router.put('/:id', protect, admin, asyncHandler(updateProduct));
router.delete('/:id', protect, admin, asyncHandler(deleteProduct));

module.exports = router;
