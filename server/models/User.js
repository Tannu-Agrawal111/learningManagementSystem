const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const sessionSchema = new mongoose.Schema({
  token: String,
  device: String,
  ipAddress: String,
  lastActive: { type: Date, default: Date.now }
});

const mfaSchema = new mongoose.Schema({
  secret: String,
  enabled: { type: Boolean, default: false },
  tempSecret: String,
  backupCodes: [String]
});

const userSchema = new mongoose.Schema({
  _id: { type: String },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['SuperAdmin', 'OrganizationAdmin', 'Instructor', 'Student'], 
    default: 'Student' 
  },
  bio: String,
  headline: String,
  location: String,
  website: String,
  avatar: String,
  experience: String,
  
  // Payment credentials (from existing SQLite DB structure)
  upi_id: String,
  qr_code: String,
  bank_account: String,
  ifsc_code: String,
  
  // Gamification metrics
  xp: { type: Number, default: 0 },
  learningStreak: { type: Number, default: 0 },
  lastActiveDate: { type: Date, default: Date.now },
  badges: [{
    badgeName: String,
    awardedAt: { type: Date, default: Date.now },
    icon: String
  }],
  
  // Active Sessions and MFA
  sessions: [sessionSchema],
  mfa: mfaSchema,
  
  created_at: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
