const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    phone: { type: String, trim: true },
    phoneVerified: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },

    resetOtpHash: String,
    resetOtpExpires: Date,
    resetOtpAttempts: { type: Number, default: 0 },
    resetOtpLastSentAt: Date,
    resetTokenHash: String,
    resetTokenExpires: Date,
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function toSafeJSON() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetOtpHash;
  delete obj.resetOtpExpires;
  delete obj.resetOtpAttempts;
  delete obj.resetOtpLastSentAt;
  delete obj.resetTokenHash;
  delete obj.resetTokenExpires;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
