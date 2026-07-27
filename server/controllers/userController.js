const User = require('../models/User');

async function listUsers(req, res) {
  const users = await User.find({ isAdmin: false }).select('-password').sort({ createdAt: -1 });
  res.json(users);
}

module.exports = { listUsers };
