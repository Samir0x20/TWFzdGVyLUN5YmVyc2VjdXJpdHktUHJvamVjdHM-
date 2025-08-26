var db = require('nano')(process.env.DB_RECOMMENDATION_URL)
const { v4: uuidv4 } = require('uuid');

function saveLog(logData) {
  return new Promise((resolve, reject) => {
    db.insert(logData, (error, success) => {
      if (error) {
        return reject(new Error(`Error saving log. Reason: ${error.reason}.`));
      }
      resolve(success);
    });
  });
}

function getRecommendations() {
  let options = {group: true};
  return new Promise((resolve, reject) => {
    db.view('queries', 'most_co_purchased', options,(error, success) => {
      if (error) {
        return reject(new Error(`Error getting recommendations. Reason: ${error.reason}.`));
      }
      resolve(success.rows);
    });
  });
}

module.exports = {
  saveLog,
  getRecommendations
};