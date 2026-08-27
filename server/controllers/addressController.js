const Address = require('../models/Address');

function last10Digits(raw) {
  return String(raw || '').replace(/\D/g, '').slice(-10);
}
function isValidPincode(pincode) {
  return /^[1-9][0-9]{5}$/.test(String(pincode || '').trim());
}
function validatePayload(body) {
  const { fullName, phone, addressLine1, city, state, pincode } = body;
  if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
    return 'Full name, phone, address, city, state and pincode are required';
  }
  if (last10Digits(phone).length !== 10) return 'Enter a valid 10-digit phone number';
  if (!isValidPincode(pincode)) return 'Enter a valid 6-digit pincode';
  return null;
}

async function listAddresses(req, res) {
  const items = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
  res.json(items);
}

async function createAddress(req, res) {
  const error = validatePayload(req.body);
  if (error) return res.status(400).json({ message: error });

  const { fullName, phone, addressLine1, addressLine2, city, state, pincode, isDefault } = req.body;
  const existingCount = await Address.countDocuments({ user: req.user._id });
  const makeDefault = existingCount === 0 || isDefault === true;
  if (makeDefault) await Address.updateMany({ user: req.user._id }, { isDefault: false });

  const address = await Address.create({
    user: req.user._id,
    fullName: fullName.trim(),
    phone: phone.trim(),
    addressLine1: addressLine1.trim(),
    addressLine2: (addressLine2 || '').trim(),
    city: city.trim(),
    state: state.trim(),
    pincode: pincode.trim(),
    isDefault: makeDefault,
  });
  res.status(201).json(address);
}

async function updateAddress(req, res) {
  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
  if (!address) return res.status(404).json({ message: 'Address not found' });

  const error = validatePayload(req.body);
  if (error) return res.status(400).json({ message: error });

  const { fullName, phone, addressLine1, addressLine2, city, state, pincode, isDefault } = req.body;
  if (isDefault === true && !address.isDefault) {
    await Address.updateMany({ user: req.user._id }, { isDefault: false });
    address.isDefault = true;
  }
  address.fullName = fullName.trim();
  address.phone = phone.trim();
  address.addressLine1 = addressLine1.trim();
  address.addressLine2 = (addressLine2 || '').trim();
  address.city = city.trim();
  address.state = state.trim();
  address.pincode = pincode.trim();
  await address.save();
  res.json(address);
}

async function deleteAddress(req, res) {
  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
  if (!address) return res.status(404).json({ message: 'Address not found' });

  const wasDefault = address.isDefault;
  await address.deleteOne();

  if (wasDefault) {
    const mostRecent = await Address.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    if (mostRecent) {
      mostRecent.isDefault = true;
      await mostRecent.save();
    }
  }
  res.json({ removed: true });
}

async function setDefaultAddress(req, res) {
  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
  if (!address) return res.status(404).json({ message: 'Address not found' });

  await Address.updateMany({ user: req.user._id }, { isDefault: false });
  address.isDefault = true;
  await address.save();
  res.json(address);
}

module.exports = { listAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress };
