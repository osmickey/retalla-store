const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const {
  createOrder,
  myOrders,
  getOrder,
  listAllOrders,
  updateOrderStatus,
  updateTracking,
  stats,
  analytics,
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, asyncHandler(createOrder));
router.get('/myorders', protect, asyncHandler(myOrders));
router.get('/stats/summary', protect, admin, asyncHandler(stats));
router.get('/stats/analytics', protect, admin, asyncHandler(analytics));
router.get('/', protect, admin, asyncHandler(listAllOrders));
router.get('/:id', protect, asyncHandler(getOrder));
router.put('/:id/status', protect, admin, asyncHandler(updateOrderStatus));
router.put('/:id/tracking', protect, admin, asyncHandler(updateTracking));

module.exports = router;
