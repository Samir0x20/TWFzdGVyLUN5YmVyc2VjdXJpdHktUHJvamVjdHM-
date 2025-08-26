const axios = require('axios');
const log = require('debug')('products-d');
const logging = process.env.LOGGING_SERVICE_URL;

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
      logPerformance(microservice, performanceData).catch(err => {
        log(`Error logging performance data: ${err.message}`);
      });
    });
  }
}

// Function to log performance data
function logPerformance(microservice, performanceData) {
  return axios.post(`${logging}/logs/microservice/${microservice}`, { logs: performanceData })
    .then(response => {
      console.log(`Log successfully sent for microservice: ${microservice}`);
      return response.data;
    })
    .catch(error => {
      console.error(`Error logging performance data for microservice: ${microservice}`, error);
      throw error;
    }
  );
}

// Function to log user actions
function logUserAction(username, action, endpoint, details) {
  const actionData = {
    timestamp: new Date().toISOString(),
    username,
    action,
    endpoint,
    details
  };

  return new Promise((resolve, reject) => {
    axios.post(`${logging}/logs/user-action`, { logs: actionData })
      .then(response => {
        console.log(`User action log successfully sent for user: ${username}`);
        resolve(response.data);
      })
      .catch(error => {
        console.error(`Error logging user action for user: ${username}`, error);
        reject(error);
      });
  });
}

module.exports = {
  logPerformance,
  logUserAction,
  measurePerformance
};