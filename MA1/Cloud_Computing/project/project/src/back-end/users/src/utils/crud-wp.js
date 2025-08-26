const bcrypt = require('bcryptjs')
const tku = require('./en-de-coders')
const axios = require('axios');

const logging = process.env.LOGGING_SERVICE_URL;

var users = require('nano')(process.env.DB_USERS_URL)
var session = require('nano')(process.env.DB_SESSIONS_URL)

function equalPassws (usrPass, usrDbPass) {
  return bcrypt.compareSync(usrPass, usrDbPass)
}

function logPerformance(microservice, performanceData) {
  return axios.post(`${logging}/logs/microservice/${microservice}`, {logs: performanceData})
  .then(response => {
    console.log(`Log successfully sent for microservice: ${microservice}`);
    return response.data;
  })
  .catch(error => {
    console.error(`Error logging performance data for microservice: ${microservice}`, error);
    throw error;
  });
}

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

// Function to register a new user
function createUser(usrName, passw, usrAdmin) {
  return new Promise((resolve, reject) => {
    users.insert(
      { 'passw': bcrypt.hashSync(passw, bcrypt.genSaltSync()), 
        'isAdmin': usrAdmin}, 
      usrName,
      (error, success) => {
        if (success) {
          resolve(); 
        } else {
          reject(new Error(`In the creation of user (${usrName}). Reason: ${error.reason}.`));
        }
      }
    );
  });
}

// Function to login a user
function getUser(usrName, passw) {
  return new Promise((resolve, reject) => {
    users.get(usrName, (error, success) => {
      if (success) {
        if (!equalPassws(passw, success.passw)) {
          return reject(new Error(`Passwords (for user: ${usrName}) do not match.`));
        }

        const isAdmin = success.isAdmin;

        // Check if the user session exists in the session database
        session.get(usrName, (error, sessionData) => {
          if (sessionData) {
            // Session exists, return the existing token
            resolve({ token: sessionData.token, isAdmin: isAdmin });
          } else {
            // Session does not exist, create a new token
            const token = tku.encodeToken(usrName);
            const sessionDoc = { _id: usrName, token: token };

            // Insert the new session into the session database
            session.insert(sessionDoc, (error, sessionSuccess) => {
              if (sessionSuccess) {
                resolve({ token: token, isAdmin: isAdmin });
              } else {
                reject(new Error(`To create session for user (${usrName}). Reason: ${error.reason}.`));
              }
            });
          }
        });
      } else {
        reject(new Error(`To fetch information of user (${usrName}). Reason: ${error.reason}.`));
      }
    });
  });
}

// Function to verify the authentication token
function verifyToken(token) {
  return new Promise((resolve, reject) => {
    try {
      const decoded = tku.decodeToken(token);
      const username = decoded.sub;

      // Retrieve the session from the session database
      session.get(username, (error, sessionData) => {
        if (error) {
          return reject(new Error(`To fetch session of user (${username}). Reason: ${error.reason}.`));
        }
        if (sessionData.token !== token) {
          return reject(new Error(`Invalid token for user (${username}).`));
        }

        // Retrieve the user from the users database
        users.get(username, (error, userData) => {
          if (error) {
            return reject(new Error(`To fetch information of user (${username}). Reason: ${error.reason}.`));
          }
          resolve({ username: username, isAdmin: userData.isAdmin });
        });
      });
    } catch (err) {
      reject(new Error(`Invalid token.`));
    }
  });
}

// Function to logout
function endSession(username, token) {
  return new Promise((resolve, reject) => {
    // Retrieve the session from the session database
    session.get(username, (error, sessionData) => {
      if (error) {
        return reject(new Error(`To fetch session of user (${username}). Reason: ${error.reason}.`));
      }
      if (sessionData.token !== token) {
        return reject(new Error(`Invalid token for user (${username}).`));
      }

      // Remove the user session from the session database
      session.destroy(sessionData._id, sessionData._rev, (error, success) => {
        if (error) {
          return reject(new Error(`To remove session of user (${username}). Reason: ${error.reason}.`));
        }
        resolve();
      });
    });
  });
}

// Function to delete a user
function deleteUser(username) {
  return new Promise((resolve, reject) => {
    // Retrieve the user from the users database
    users.get(username, (error, userData) => {
      if (error) {
        return reject(new Error(`To fetch information of user (${username}). Reason: ${error.reason}.`));
      }

      // Delete the user from the users database
      users.destroy(userData._id, userData._rev, (error, success) => {
        if (error) {
          return reject(new Error(`To delete user (${username}). Reason: ${error.reason}.`));
        }

        // Check if the user's session exists in the session database
        session.get(username, (error, sessionData) => {
          if (sessionData) {
            // Session exists, delete the session
            session.destroy(sessionData._id, sessionData._rev, (error, success) => {
              if (error) {
                return reject(new Error(`To remove session of user (${username}). Reason: ${error.reason}.`));
              }
              resolve();
            });
          } else {
            // Session does not exist, resolve the promise
            resolve();
          }
        });
      });
    });
  });
}

module.exports = {
  createUser,
  getUser,
  verifyToken,
  endSession,
  deleteUser,
  logPerformance,
  logUserAction
};