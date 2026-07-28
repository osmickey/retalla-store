const crypto = require('crypto');

function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

function hashOtp(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = { generateOtp, hashOtp, generateResetToken, hashToken };
