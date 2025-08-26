const express = require('express');
const log = require('debug')('users-d');
const app = express.Router();
const db = require('./utils/crud-wp');

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
      db.logPerformance(microservice, performanceData).catch(err => {
        log(`Error logging performance data: ${err.message}`);
      });
    });
  }
}

// Endpoint to register a new user
app.post('/register', (req, res, next) => {
  measurePerformance(req, res, next, 'users', '/register', async (req, res) => {
    const usr = req.body.username;
    const usrPassw = req.body.password;
    const usrAdmin = req.body.isAdmin;
    log(`Creating a new user (${usr})`);
    
    try {
      const token = await db.createUser(usr, usrPassw, usrAdmin);
      res.status(200).json({ status: 'success', token });
      db.logUserAction(usr, 'register', '/register', { isAdmin: usrAdmin });
    } catch (err) {
      log(`Error creating user: ${err.message}`);
      res.status(409).json({ status: 'error', message: String(err) });
    }
  });
});

// Endpoint to login a user
app.post('/login', (req, res, next) => {
  measurePerformance(req, res, next, 'users', '/login', async (req, res) => {
    const usr = req.body.username;
    const passw = req.body.password;
    log(`Getting user (${usr})`);
    
    try {
      const { token, isAdmin } = await db.getUser(usr, passw);
      res.status(200).json({ status: 'success', token, isAdmin });
      db.logUserAction(usr, 'login', '/login', { isAdmin });
    } catch (err) {
      res.status(404).json({ status: 'error', message: String(err) });
    }
  });
});

// Endpoint to verify the authentication token
app.get('/verify/:token', (req, res, next) => {
  measurePerformance(req, res, next, 'users', '/verify/:token', async (req, res) => {
    const token = req.params.token;
    log(`Verifying token: ${token}`);
    
    try {
      const userData = await db.verifyToken(token);
      res.status(200).json({ status: 'success', ...userData });
    } catch (err) {
      res.status(401).json({ status: 'error', message: String(err) });
    }
  });
});

// Endpoint to logout a user
app.post('/logout', (req, res, next) => {
  measurePerformance(req, res, next, 'users', '/logout', async (req, res) => {
    const username = req.body.username;
    const token = req.body.token;
    log(`Ending session for user (${username})`);
    
    try {
      await db.endSession(username, token);
      res.status(200).json({ status: 'success' });
      db.logUserAction(username, 'logout', '/logout', { token });
    } catch (err) {
      res.status(401).json({ status: 'error', message: String(err) });
    }
  });
});

// Endpoint to delete a user
app.delete('/delete/:username', (req, res, next) => {
  measurePerformance(req, res, next, 'users', '/delete/:username', async (req, res) => {
    const username = req.params.username;
    log(`Deleting user (${username})`);
    
    try {
      await db.deleteUser(username);
      res.status(200).json({ status: 'success' });
      db.logUserAction(username, 'delete', '/delete/:username', {});
    } catch (err) {
      res.status(401).json({ status: 'error', message: String(err) });
    }
  });
});

module.exports = app;