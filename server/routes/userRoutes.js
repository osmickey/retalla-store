const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { listUsers } = require('../controllers/userController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, admin, asyncHandler(listUsers));

module.exports = router;
