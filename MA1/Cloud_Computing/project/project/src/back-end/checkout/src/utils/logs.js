const axios = require('axios');
const logging = process.env.LOGGING_SERVICE_URL;

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
  setImmediate(() => {
    axios.post(`${logging}/logs/user-action`, { logs: actionData })
      .then(response => {
        console.log(`User action log successfully sent for user: ${username}`);
      })
      .catch(error => {
        console.error(`Error logging user action for user: ${username}`, error);
      });
  });
}

module.exports = { 
    logPerformance, 
    logUserAction 
};