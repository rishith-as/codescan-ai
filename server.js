// ══════════════════════════════════════
//   CodeScan AI — server.js
//   Express + MongoDB backend
// ══════════════════════════════════════

require('dotenv').config();

const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const path     = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── MIDDLEWARE ────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── MONGODB CONNECTION ────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err.message));

// ── REVIEW SCHEMA ─────────────────────
const reviewSchema = new mongoose.Schema({
  language:         { type: String,  default: 'Unknown' },
  score:            { type: Number,  default: 0 },
  lines:            { type: Number,  default: 0 },
  complexity:       { type: String,  default: 'Low' },
  has_error:        { type: Boolean, default: false },
  error_message:    { type: String,  default: '' },
  corrected_code:   { type: String,  default: '' },
  time_complexity:  { type: String,  default: '' },
  space_complexity: { type: String,  default: '' },
  optimized_code:   { type: String,  default: '' },
  issues:           { type: Array,   default: [] },
  summary:          { type: String,  default: '' },
  code_snippet:     { type: String,  default: '' },
  createdAt:        { type: Date,    default: Date.now }
});

// Indexes for performance
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ language: 1 });
reviewSchema.index({ has_error: 1 });

const Review = mongoose.model('Review', reviewSchema);

// ══════════════════════════════════════
//   API ROUTES
// ══════════════════════════════════════

// ── HEALTH CHECK ── GET /health ───────
// Used by Docker HEALTHCHECK + monitoring
app.get('/health', (req, res) => {
  const dbState = { 0:'disconnected', 1:'connected', 2:'connecting', 3:'disconnecting' };
  res.json({
    status:      'ok',
    service:     'codescan-ai',
    version:     process.env.npm_package_version || '1.0.0',
    timestamp:   new Date().toISOString(),
    uptime:      Math.floor(process.uptime()),
    database:    dbState[mongoose.connection.readyState] || 'unknown',
    memory: {
      used:  Math.round(process.memoryUsage().heapUsed  / 1024 / 1024) + 'MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
    },
    environment: process.env.NODE_ENV || 'development',
  });
});

// ── SAVE REVIEW ── POST /api/reviews ──
app.post('/api/reviews', async (req, res) => {
  try {
    const data = req.body;
    const review = new Review({
      language:         data.language       || 'Unknown',
      score:            data.score          || 0,
      lines:            data.lines          || 0,
      complexity:       data.complexity     || 'Low',
      has_error:        data.has_error      || false,
      error_message:    data.error_message  || '',
      corrected_code:   data.corrected_code || '',
      time_complexity:  data.time_complexity  || '',
      space_complexity: data.space_complexity || '',
      optimized_code:   data.optimized_code || '',
      issues:           data.issues         || [],
      summary:          data.summary        || '',
      code_snippet:     (data.code_snippet  || '').slice(0, 200),
    });
    const saved = await review.save();
    res.status(201).json({ success: true, message: 'Review saved to MongoDB!', id: saved._id });
  } catch (err) {
    console.error('Save error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET ALL REVIEWS ── GET /api/reviews ──
app.get('/api/reviews', async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET ONE REVIEW ── GET /api/reviews/:id ──
app.get('/api/reviews/:id', async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE REVIEW ── DELETE /api/reviews/:id ──
app.delete('/api/reviews/:id', async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE ALL ── DELETE /api/reviews ──
app.delete('/api/reviews', async (req, res) => {
  try {
    await Review.deleteMany({});
    res.json({ success: true, message: 'All reviews deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── STATS ── GET /api/stats ──
app.get('/api/stats', async (req, res) => {
  try {
    const total    = await Review.countDocuments();
    const avgArr   = await Review.aggregate([{ $group: { _id: null, avg: { $avg: '$score' } } }]);
    const avgScore = avgArr[0]?.avg ? Math.round(avgArr[0].avg) : 0;
    const errors   = await Review.countDocuments({ has_error: true });
    res.json({ success: true, total, avgScore, errors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── SERVE FRONTEND ────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── GRACEFUL SHUTDOWN ─────────────────
process.on('SIGTERM', async () => {
  console.log('🔄 SIGTERM received — shutting down gracefully');
  await mongoose.disconnect();
  process.exit(0);
});

// ── START SERVER ──────────────────────
app.listen(PORT, () => {
  console.log(`🚀 CodeScan AI running at http://localhost:${PORT}`);
  console.log(`📦 API endpoints:`);
  console.log(`   GET    /health        — health check (Docker + monitoring)`);
  console.log(`   POST   /api/reviews   — save review`);
  console.log(`   GET    /api/reviews   — get all reviews`);
  console.log(`   DELETE /api/reviews   — delete all`);
  console.log(`   GET    /api/stats     — get stats`);
});
