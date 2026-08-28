const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { subscribe } = require('../controllers/subscriberController');

const router = express.Router();

router.post('/', asyncHandler(subscribe));

module.exports = router;
