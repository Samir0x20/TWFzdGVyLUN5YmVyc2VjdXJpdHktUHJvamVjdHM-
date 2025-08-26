const express = require('express');
const log = require('debug')('cart-d');
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

// Endpoint to save cart data
app.post('/cart/save', verifyToken,(req, res, next) => {
  measurePerformance(req, res, next, 'cart', '/cart/save', async (req, res) => {
    const username = req.user.username || 'anonymous';
    const cart = req.body.cart;
    log(`Saving cart for user (${username})`);
    try {
      await db.saveCart(username, cart);
      res.status(200).json({ status: 'success' });
      const lastItem = cart[cart.length - 1]; // Get the last item of the cart
      logs.logUserAction(username, 'add', '/cart/save', { lastItem });
    } catch (err) {
      res.status(500).json({ status: 'error', message: String(err) });
    }
  });
});

// Endpoint to retrieve cart data
app.get('/cart/:username', verifyToken, (req, res, next) => {
  measurePerformance(req, res, next, 'cart', '/cart/:username', async (req, res) => {
    const username = req.user.username || 'anonymous';
    log(`Retrieving cart for user (${username})`);
    try {
      const cart = await db.getCart(username);
      res.status(200).json({ status: 'success', cart });
    } catch (err) {
      res.status(500).json({ status: 'error', message: String(err) });
    }
  });
});

// Endpoint to save removed items
app.post('/cart/remove', verifyToken, (req, res, next) => {
  measurePerformance(req, res, next, 'cart', '/cart/remove', async (req, res) => {
    const username = req.user.username || 'anonymous';
    const item = req.body.item;
    log(`Saving removed item for user (${username})`);
    try {
      await db.saveRemovedItem(username, item);
      res.status(200).json({ status: 'success' });
      logs.logUserAction(username, 'remove', '/cart/remove', { item });
    } catch (err) {
      res.status(500).json({ status: 'error', message: String(err) });
    }
  });
});

module.exports = app;