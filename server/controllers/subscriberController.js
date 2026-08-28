const Subscriber = require('../models/Subscriber');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Re-subscribing with an address that's already stored is treated as success
// rather than a duplicate-key error -- from the visitor's side "you're on the
// list" is true either way, and surfacing "already subscribed" would leak
// whether a given address is in the database.
async function subscribe(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }
  const existing = await Subscriber.findOne({ email });
  if (!existing) await Subscriber.create({ email, source: req.body.source || 'homepage' });
  return res.status(201).json({ message: "You're on the list." });
}

module.exports = { subscribe };
