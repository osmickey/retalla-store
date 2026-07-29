const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { generateOtp, hashOtp, generateResetToken, hashToken } = require('../utils/otp');
const getFirebaseAuth = require('../config/firebaseAdmin');

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

function signToken(user) {
  const expiresIn = user.isAdmin
    ? process.env.ADMIN_JWT_EXPIRES_IN || '30m'
    : process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn });
}

async function register(req, res) {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(400).json({ message: 'Email is already registered' });

  const user = await User.create({ name, email, password, phone });
  res.status(201).json({ user, token: signToken(user) });
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  res.json({ user, token: signToken(user) });
}

async function me(req, res) {
  res.json({ user: req.user });
}

async function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  const user = await User.findOne({ email: email.toLowerCase() });
  // Always respond the same way so we don't reveal which emails are registered
  const genericResponse = { message: 'If that email is registered, an OTP has been sent.' };
  if (!user) return res.json(genericResponse);

  if (user.resetOtpLastSentAt && Date.now() - user.resetOtpLastSentAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
    return res.status(429).json({ message: 'Please wait a minute before requesting another OTP' });
  }

  const otp = generateOtp();
  user.resetOtpHash = hashOtp(otp);
  user.resetOtpExpires = new Date(Date.now() + OTP_TTL_MS);
  user.resetOtpAttempts = 0;
  user.resetOtpLastSentAt = new Date();
  user.resetTokenHash = undefined;
  user.resetTokenExpires = undefined;
  await user.save();

  await sendEmail({
    to: user.email,
    subject: 'Your Retalla password reset OTP',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;">
        <h2 style="color:#4f46e5;">Retalla</h2>
        <p>Your OTP to reset your password is:</p>
        <p style="font-size:32px;font-weight:700;letter-spacing:6px;color:#1f2937;">${otp}</p>
        <p>This OTP expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });

  res.json(genericResponse);
}

async function verifyResetOtp(req, res) {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.resetOtpHash || !user.resetOtpExpires) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }
  if (user.resetOtpExpires.getTime() < Date.now()) {
    return res.status(400).json({ message: 'OTP has expired, please request a new one' });
  }
  if (user.resetOtpAttempts >= MAX_OTP_ATTEMPTS) {
    return res.status(429).json({ message: 'Too many attempts, please request a new OTP' });
  }

  if (hashOtp(otp) !== user.resetOtpHash) {
    user.resetOtpAttempts += 1;
    await user.save();
    return res.status(400).json({ message: 'Incorrect OTP' });
  }

  const resetToken = generateResetToken();
  user.resetTokenHash = hashToken(resetToken);
  user.resetTokenExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  user.resetOtpHash = undefined;
  user.resetOtpExpires = undefined;
  user.resetOtpAttempts = 0;
  await user.save();

  res.json({ resetToken });
}

async function resetPassword(req, res) {
  const { email, resetToken, newPassword } = req.body;
  if (!email || !resetToken || !newPassword) {
    return res.status(400).json({ message: 'Email, reset token and new password are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.resetTokenHash || !user.resetTokenExpires) {
    return res.status(400).json({ message: 'Invalid or expired reset session, please start again' });
  }
  if (user.resetTokenExpires.getTime() < Date.now() || hashToken(resetToken) !== user.resetTokenHash) {
    return res.status(400).json({ message: 'Invalid or expired reset session, please start again' });
  }

  user.password = newPassword;
  user.resetTokenHash = undefined;
  user.resetTokenExpires = undefined;
  await user.save();

  res.json({ message: 'Password has been reset. You can now log in.' });
}

async function verifyPhone(req, res) {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ message: 'idToken is required' });

  let decoded;
  try {
    decoded = await getFirebaseAuth().verifyIdToken(idToken);
  } catch (err) {
    return res.status(400).json({ message: 'Invalid or expired verification, please try again' });
  }

  if (!decoded.phone_number) {
    return res.status(400).json({ message: 'No verified phone number found for this verification' });
  }

  req.user.phone = decoded.phone_number;
  req.user.phoneVerified = true;
  await req.user.save();

  res.json({ user: req.user });
}

module.exports = {
  register,
  login,
  me,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  verifyPhone,
};
