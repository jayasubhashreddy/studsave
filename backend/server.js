const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// ── Middleware ─────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(passport.initialize());
require('./config/passport')(passport);

// ── Database ───────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => { console.error('❌ MongoDB error:', err.message); process.exit(1); });

// ── API Routes ─────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/academics', require('./routes/academics'));
app.use('/api/semesters', require('./routes/semesters'));
app.use('/api/subjects',  require('./routes/subjects'));
app.use('/api/units',     require('./routes/units'));
app.use('/api/search',    require('./routes/search'));
app.use('/api/folders',   require('./routes/folders'));
app.use('/api/files',     require('./routes/files'));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', app: 'StudSave' }));

// ── Serve Frontend ─────────────────────────────────────────────
// In production, frontend is built into backend/public
const clientBuild = path.join(__dirname, 'public');
app.use(express.static(clientBuild));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientBuild, 'index.html'));
});

// ── Error handler ──────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 StudSave running on port ${PORT}`));
