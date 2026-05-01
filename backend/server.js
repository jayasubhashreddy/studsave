const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => { console.error('❌ MongoDB error:', err.message); process.exit(1); });

// API Routes
app.use('/api/folders',   require('./routes/folders'));
app.use('/api/files',     require('./routes/files'));
app.use('/api/academics', require('./routes/academics'));
app.use('/api/semesters', require('./routes/semesters'));
app.use('/api/subjects',  require('./routes/subjects'));
app.use('/api/units',     require('./routes/units'));
app.use('/api/search',    require('./routes/search'));
app.use('/api/admin',     require('./routes/admin'));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', app: 'StudSave' }));

// Serve frontend
const clientBuild = path.join(__dirname, 'public');
app.use(express.static(clientBuild));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientBuild, 'index.html'));
});

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 StudSave running on port ${PORT}`);

  const RENDER_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  const PING_INTERVAL_MS = 5 * 60 * 1000;

  setInterval(async () => {
    try {
      const http = RENDER_URL.startsWith('https') ? require('https') : require('http');
      http.get(`${RENDER_URL}/api/health`, (res) => {
        console.log(`🏓 Keep-alive ping → ${res.statusCode}`);
      }).on('error', (err) => {
        console.warn(`⚠️  Ping failed: ${err.message}`);
      });
    } catch (err) {
      console.warn(`⚠️  Ping error: ${err.message}`);
    }
  }, PING_INTERVAL_MS);
});
