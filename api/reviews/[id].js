// api/reviews/[id].js — GET/DELETE single review

const mongoose = require('mongoose');

let cachedDb = null;
async function connectDb() {
  if (cachedDb && mongoose.connection.readyState === 1) return cachedDb;
  return (cachedDb = await mongoose.connect(process.env.MONGO_URI, { bufferCommands: false }));
}

const Review = mongoose.models.Review || mongoose.model('Review', new mongoose.Schema({
  language: String, score: Number, lines: Number, complexity: String,
  has_error: Boolean, error_message: String, corrected_code: String,
  time_complexity: String, space_complexity: String, optimized_code: String,
  issues: Array, summary: String, code_snippet: String,
  createdAt: { type: Date, default: Date.now }
}));

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;

  try {
    await connectDb();

    if (req.method === 'GET') {
      const review = await Review.findById(id);
      if (!review) return res.status(404).json({ success: false, message: 'Not found' });
      return res.json({ success: true, review });
    }

    if (req.method === 'DELETE') {
      await Review.findByIdAndDelete(id);
      return res.json({ success: true, message: 'Deleted' });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
