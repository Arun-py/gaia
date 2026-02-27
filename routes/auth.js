const express = require('express');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const auth    = require('../middleware/authMiddleware');
const router  = express.Router();

/* Helper: sign JWT */
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

/* ── REGISTER ── */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, organization } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });

    if (await User.findOne({ email }))
      return res.status(409).json({ success: false, message: 'Email already registered' });

    const user  = await User.create({ name, email, password, role: role || 'client', organization });
    const token = signToken(user._id);
    user.lastLogin = new Date();
    await user.save();

    res.status(201).json({ success: true, token, user: user.toPublic() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── LOGIN ── */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required' });

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    if (!user.isActive)
      return res.status(403).json({ success: false, message: 'Account has been deactivated' });

    const token = signToken(user._id);
    user.lastLogin = new Date();
    await user.save();

    res.json({ success: true, token, user: user.toPublic() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── PROFILE (protected) ── */
router.get('/profile', auth, (req, res) => {
  res.json({ success: true, user: req.user.toPublic() });
});

/* ── UPDATE PROFILE (protected) ── */
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, organization } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, organization },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user: user.toPublic() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── ALL USERS (admin only) ── */
router.get('/users', auth, async (req, res) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ success: false, message: 'Admin access only' });
  const users = await User.find().select('-password').sort('-createdAt');
  res.json({ success: true, users });
});

/* ── SEED DEMO ACCOUNTS ── */
router.post('/seed', async (req, res) => {
  const demos = [
    { name: 'Admin User',           email: 'admin@gaia.com',    password: 'Admin@123',   role: 'admin' },
    { name: 'Arjun Architect',      email: 'architect@gaia.com',password: 'Arch@123',    role: 'architect' },
    { name: 'Santhosh Engineer',    email: 'engineer@gaia.com', password: 'Eng@123',     role: 'structural_engineer' },
    { name: 'Priya Client',         email: 'client@gaia.com',   password: 'Client@123',  role: 'client' },
    { name: 'Ravi Cost Consultant', email: 'cost@gaia.com',     password: 'Cost@123',    role: 'cost_consultant' },
  ];
  const results = [];
  for (const d of demos) {
    if (!(await User.findOne({ email: d.email }))) {
      await User.create(d);
      results.push(`Created: ${d.email}`);
    } else {
      results.push(`Exists:  ${d.email}`);
    }
  }
  res.json({ success: true, results });
});

module.exports = router;
