const mongoose = require('mongoose');
const bcrypt    = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:     { type: String, required: true, minlength: 6 },
  role: {
    type: String,
    enum: ['admin', 'architect', 'structural_engineer', 'client', 'cost_consultant'],
    default: 'client',
  },
  organization: { type: String, default: '' },
  avatar:       { type: String, default: '' },
  createdAt:    { type: Date, default: Date.now },
  lastLogin:    { type: Date },
  isActive:     { type: Boolean, default: true },
});

/* Hash password before save */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

/* Compare password */
userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

/* Safe public profile */
userSchema.methods.toPublic = function () {
  return {
    id:           this._id,
    name:         this.name,
    email:        this.email,
    role:         this.role,
    organization: this.organization,
    avatar:       this.avatar,
    createdAt:    this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
