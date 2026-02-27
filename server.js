require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const path     = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

/* ── Middleware ── */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ── Static files ── */
app.use(express.static(path.join(__dirname)));

/* ── API Routes ── */
app.use('/api/auth', require('./routes/auth'));

/* ── Health check ── */
app.get('/api/health', (_req, res) => res.json({ status: 'OK', server: 'Gaia v1.0' }));

/* ── MongoDB connect & start ── */
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅  MongoDB Connected');

    /* Auto-seed demo accounts once */
    try {
      const User = require('./models/User');
      const demos = [
        { name: 'Admin User',           email: 'admin@gaia.com',    password: 'Admin@123',  role: 'admin' },
        { name: 'Arjun Architect',      email: 'architect@gaia.com',password: 'Arch@123',   role: 'architect' },
        { name: 'Santhosh Engineer',    email: 'engineer@gaia.com', password: 'Eng@123',    role: 'structural_engineer' },
        { name: 'Priya Client',         email: 'client@gaia.com',   password: 'Client@123', role: 'client' },
        { name: 'Ravi Consultant',      email: 'cost@gaia.com',     password: 'Cost@123',   role: 'cost_consultant' },
      ];
      for (const d of demos) {
        if (!(await User.findOne({ email: d.email }))) await User.create(d);
      }
      console.log('✅  Demo accounts ready');
    } catch (e) { /* silently skip seed errors */ }

    app.listen(PORT, () =>
      console.log(`🚀  Gaia running at http://localhost:${PORT}`)
    );
  })
  .catch(err => {
    console.error('❌  MongoDB connection error:', err.message);
    process.exit(1);
  });
