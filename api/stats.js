// api/stats.js — GET /api/stats

const mongoose = require('mongoose');

let cachedDb = null;
async function connectDb() {
  if (cachedDb && mongoose.connection.readyState === 1) return cachedDb;
  return (cachedDb = await mongoose.connect(process.env.MONGO_URI, { bufferCommands: false }));
}

const Review = mongoose.models.Review || mongoose.model('Review', new mongoose.Schema({
  score: Number, has_error: Boolean, createdAt: { type: Date, default: Date.now }
}));

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await connectDb();
    const total   = await Review.countDocuments();
    const avgArr  = await Review.aggregate([{ $group: { _id: null, avg: { $avg: '$score' } } }]);
    const avgScore = avgArr[0]?.avg ? Math.round(avgArr[0].avg) : 0;
    const errors  = await Review.countDocuments({ has_error: true });

    res.json({ success: true, total, avgScore, errors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
