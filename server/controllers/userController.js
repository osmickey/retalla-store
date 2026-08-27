const User = require('../models/User');

async function listUsers(req, res) {
  const users = await User.find({ isAdmin: false }).select('-password').sort({ createdAt: -1 });
  res.json(users);
}

async function updateProfile(req, res) {
  const { name, phone, preferredPaymentMethod } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Name is required' });
  }

  const user = req.user;
  if (phone !== undefined) {
    const phoneChanged = phone.trim() !== (user.phone || '');
    user.phone = phone.trim();
    if (phoneChanged) user.phoneVerified = false;
  }
  if (preferredPaymentMethod !== undefined) {
    if (!['COD', 'UPI', 'Card'].includes(preferredPaymentMethod)) {
      return res.status(400).json({ message: 'Invalid payment method' });
    }
    user.preferredPaymentMethod = preferredPaymentMethod;
  }
  user.name = name.trim();

  await user.save();
  res.json({ user });
}

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current password and new password are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters' });
  }

  const user = req.user;
  const matches = await user.comparePassword(currentPassword);
  if (!matches) {
    return res.status(401).json({ message: 'Current password is incorrect' });
  }

  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password updated successfully' });
}

module.exports = { listUsers, updateProfile, changePassword };
