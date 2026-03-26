// api/health.js — GET /health (also used by Docker HEALTHCHECK)

const mongoose = require('mongoose');

module.exports = async function handler(req, res) {
  const dbState = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  res.json({
    status:    'ok',
    service:   'codescan-ai',
    version:   process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
    uptime:    Math.floor(process.uptime()),
    database:  dbState[mongoose.connection.readyState] || 'unknown',
    memory:    {
      used:  Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
    },
    environment: process.env.NODE_ENV || 'development',
  });
};
