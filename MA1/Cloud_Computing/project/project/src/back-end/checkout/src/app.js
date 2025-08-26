const express = require('express');
const log = require('debug')('checkout-d');
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

// Endpoint to save checkout data
app.post('/checkout/save', verifyToken,(req, res, next) => {
  measurePerformance(req, res, next, 'checkout', '/checkout/save', async (req, res) => {
    const username = req.user.username || 'anonymous';
    const checkout = req.body.checkout;
    log(`Saving checkout for user (${username})`);
    try {
      await db.saveCheckout(username, checkout);
      res.status(200).json({ status: 'success' });
      logs.logUserAction(username, 'save', '/checkout/save', { checkout });
    } catch (err) {
      res.status(500).json({ status: 'error', message: String(err) });
    }
  });
});

// Endpoint to retrieve checkout data
app.get('/checkout/load/:username', verifyToken,(req, res, next) => {
  measurePerformance(req, res, next, 'checkout', '/checkout/load/:username', async (req, res) => {
    const username = req.params.username;
    log(`Retrieving checkout for user (${username})`);
    try {
      const checkouts = await db.getCheckout(username);
      res.status(200).json({ status: 'success', checkouts });
      logs.logUserAction(username, 'load', '/checkout/load/:username', {});
    } catch (err) {
      res.status(500).json({ status: 'error', message: String(err) });
    }
  });
});

module.exports = app;