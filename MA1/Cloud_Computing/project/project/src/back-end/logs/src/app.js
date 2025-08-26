const express = require('express')
const log = require('debug')('logs-d')

const app = express.Router()
const db = require('./utils/crud-wp')

// endpoint to save performance logs for a microservice
app.post('/logs/microservice/:microservice', (req, res) => {
  const microservice = req.params.microservice;
  const performanceData = req.body.logs;
  log(`Saving logs for microservice (${microservice})`);
  return db.saveLogPerformance(microservice, performanceData)
    .then(() => {
      res.status(200).json({ status: 'success' });
    })
    .catch((err) => {
      res.status(500).json({ status: 'error', message: String(err) });
    });
});

// endpoint to save user action logs
app.post('/logs/user-action', (req, res) => {
  const actionData = req.body.logs;
  log(`Saving logs for microservice user-action`);
  return db.saveUserAction(actionData)
    .then(() => {
      res.status(200).json({ status: 'success' });
    })
    .catch((err) => {
      res.status(500).json({ status: 'error', message: String(err) });
    });
});

module.exports = app