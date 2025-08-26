const express = require('express');
const log = require('debug')('recommendation-d');
const app = express.Router();
const db = require('./utils/crud-wp');
const logs = require('./utils/logs');
const verifyToken = require('./utils/auth');


// Helper function to measure and log performance
async function measurePerformance(req, res, next, microservice, endpoint, handler) {
  const startTime = Date.now();
  try {
    await handler(req, res);
  } finally {
    const endTime = Date.now();
    const duration = endTime - startTime;
    const performanceData = {
      timestamp: new Date().toISOString(),
      endpoint,
      duration,
      statusCode: res.statusCode,
      requestSize: req.headers['content-length'] || 0,
      responseSize: res.get('Content-Length') || 0,
      serviceName: microservice,
      metadata: {
        queryParams: req.query,
        headers: req.headers
      }
    };
    setImmediate(() => {
      logs.logPerformance(microservice, performanceData).catch(err => {
        log(`Error logging performance data: ${err.message}`);
      });
    });
  }
}

app.post('/saveLog', (req, res) => {
  const logData = req.body;
  log(`Saving logs from endpoint: (${logData.endpoint})`);
  return db.saveLog(logData)
    .then((data) => {
      res.status(200).json(data);
    })
    .catch((err) => {
      res.status(500).json({ status: 'error', message: String(err) });
    });
});

app.get('/recommendation', verifyToken, (req, res, next) => {
  measurePerformance(req, res, next, 'recommendation', '/recommendation', async (req, res) => {
    const username = req.user.username;
    log(`Getting recommendations for user: ${username}`);
    return db.getRecommendations()
      .then((recommendation) => {
        res.status(200).json({ status: 'success', recommendation});
      })
      .catch((err) => {
        res.status(500).json({ status: 'error', message: String(err) });
      });
  });
});

module.exports = app;