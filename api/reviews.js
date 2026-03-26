// ══════════════════════════════════════
//   api/reviews.js
//   Vercel Serverless Function
//   Handles: GET /api/reviews
//            POST /api/reviews
//            DELETE /api/reviews
// ══════════════════════════════════════

const mongoose = require('mongoose');

// ── Connection cache (reuse across invocations) ──
let cachedDb = null;

async function connectDb() {
  if (cachedDb && mongoose.connection.readyState === 1) return cachedDb;
  cachedDb = await mongoose.connect(process.env.MONGO_URI, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 5000,
  });
  return cachedDb;
}

// ── Schema ───────────────────────────
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

// Prevent model re-registration in serverless env
const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);

// ── CORS headers ─────────────────────
function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ── Handler ───────────────────────────
module.exports = async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await connectDb();

    // GET — list all reviews
    if (req.method === 'GET') {
      const reviews = await Review.find().sort({ createdAt: -1 }).limit(50);
      return res.json({ success: true, reviews });
    }

    // POST — save a review
    if (req.method === 'POST') {
      const data   = req.body;
      const review = new Review({
        ...data,
        code_snippet: (data.code_snippet || '').slice(0, 200),
      });
      const saved = await review.save();
      return res.status(201).json({ success: true, message: 'Saved!', id: saved._id });
    }

    // DELETE — delete all
    if (req.method === 'DELETE') {
      await Review.deleteMany({});
      return res.json({ success: true, message: 'All deleted' });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });

  } catch (err) {
    console.error('[/api/reviews]', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};
