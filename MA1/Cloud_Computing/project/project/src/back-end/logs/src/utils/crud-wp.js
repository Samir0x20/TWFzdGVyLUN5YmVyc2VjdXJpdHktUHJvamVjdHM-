const axios = require('axios');
const EventEmitter = require('events');
const RecommendationServiceUrl = process.env.RECOMMENDATION_SERVICE_URL; // URL of the recommendation microservice
const logs_users = require('nano')(process.env.DB_LOGS_USERS_URL); 
const logs_checkout = require('nano')(process.env.DB_LOGS_CHECKOUT_URL); 
const logs_cart = require('nano')(process.env.DB_LOGS_CART_URL); 
const logs_product = require('nano')(process.env.DB_LOGS_PRODUCT_URL); 
const logs_user_action = require('nano')(process.env.DB_LOGS_USER_ACTION_URL);
const logs_recommendation = require('nano')(process.env.DB_LOGS_RECOMMENDATION_URL);


class UserActionEmitter extends EventEmitter {}
const userActionEmitter = new UserActionEmitter();

const dbs = {
  users: logs_users,
  cart: logs_cart,
  checkout: logs_checkout,
  product: logs_product,
  user_action: logs_user_action,
  recommendation: logs_recommendation
};

function saveLogPerformance(microservice, performanceData) {
  return new Promise((resolve, reject) => {
    const db = dbs[microservice];
    if (!db) {
      return reject(new Error('Invalid microservice name'));
    }
    db.insert(performanceData, (error, success) => {
      if (error) {
        return reject(new Error(`Error saving log for microservice (${microservice}). Reason: ${error.reason}.`));
      }
      resolve(success);
    });
  });
}

// Function to save user action
function saveUserAction(actionData) {
  return new Promise((resolve, reject) => {
    const db = dbs.user_action;
    db.insert(actionData, (error, success) => {
      if (error) {
        return reject(new Error(`Error saving log for microservice (${actionData.microservice}). Reason: ${error.reason}.`));
      }
      // Emit an event if the endpoint is /checkout/save
      if (actionData.endpoint === '/checkout/save') {
        userActionEmitter.emit('checkoutSave', actionData);
      }
      resolve(success);
    });
  });
}

// Event listener for checkoutSave event
userActionEmitter.on('checkoutSave', (actionData) => {
  axios.post(`${RecommendationServiceUrl}/saveLog`, actionData)
    .then(response => {
      console.log('Recommendation service response:', response.data);
    })
    .catch(error => {
      console.log('Error sending data to recommendation service:', error);
    });
});


module.exports = {
  saveLogPerformance,
  saveUserAction
};