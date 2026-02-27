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

/* ── Explicit root route ── */
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'), (err) => {
    if (err) res.status(500).json({ success: false, message: 'index.html not found', dir: __dirname });
  });
});

/* ── API Routes ── */
app.use('/api/auth', require('./routes/auth'));

/* ── Health check ── */
app.get('/api/health', (_req, res) => res.json({ status: 'OK', server: 'Gaia v1.0' }));

/* ── Catch-all: serve index.html for any unknown non-API route ── */
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'index.html'), (err) => {
      if (err) res.status(200).send(`<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=/"></head><body>Loading...</body></html>`);
    });
  } else {
    res.status(404).json({ success: false, message: 'Not found' });
  }
});

/* ── Global error handler ── */
app.use((err, _req, res, _next) => {
  console.error('❌ Server error:', err.message);
  res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
});

/* ── MongoDB connect ── */
if (mongoose.connection.readyState === 0 && process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(async () => {
      console.log('✅  MongoDB Connected');
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
      } catch (e) { /* skip seed errors */ }
    })
    .catch(err => console.error('❌  MongoDB error:', err.message));
}

/* ── Start server (local dev) ── */
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  app.listen(PORT, () => console.log(`🚀  Gaia running at http://localhost:${PORT}`));
}

/* ── Export for Vercel serverless ── */
module.exports = app;
