const mongoose = require('mongoose');

// Backs the homepage newsletter section. Without this the email field would
// be pure theater -- a form that looks like it subscribes you and silently
// discards the address.
const subscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    source: { type: String, default: 'homepage' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subscriber', subscriberSchema);
