var db_current_cart = require('nano')(process.env.DB_CURRENT_CART_URL);
var db_history_cart = require('nano')(process.env.DB_HISTORY_CART_URL);
var db_removed_items = require('nano')(process.env.DB_REMOVED_ITEMS_URL);

//function to save cart data
function saveCart(usrName, newCart) {
  return new Promise((resolve, reject) => {
    const time = new Date().toISOString(); // Use current time as ID

    // Check if the user already exists in the db_current_cart database
    db_current_cart.get(usrName, (error, existingCart) => {
      if (error && error.statusCode === 404) {
        // User does not exist, create a new entry
        const cartItem = {_id: usrName, timestamp: time, cart: newCart };
        db_current_cart.insert(cartItem, (error, success) => {
          if (success) {
            resolve();
          } else {
            reject(new Error(`Failed to save cart for user (${usrName}). Reason: ${error.reason}.`));
          }
        });
      } else if (existingCart) {
        // User exists, save the existing cart to the history database
        addToHistory(existingCart)
          .then(() => {
            // Update the existing cart with new items
            existingCart.cart = [...newCart];
            existingCart.timestamp = time; // Update the timestamp

            db_current_cart.insert(existingCart, (error, success) => {
              if (success) {
                resolve();
              } else {
                reject(new Error(`Failed to update cart for user (${usrName}). Reason: ${error.reason}.`));
              }
            });
          })
          .catch((err) => {
            reject(new Error(`Failed to save cart history for user (${usrName}). Reason: ${err.message}`));
          });
      } else {
        reject(new Error(`Failed to fetch cart for user (${usrName}). Reason: ${error.reason}.`));
      }
    });
  });
}

// Function to add cart to history
function addToHistory(cart) {
  return new Promise((resolve, reject) => {
    const oldCart = {username: cart._id, timestamp: cart.timestamp, cart: cart.cart };
    db_history_cart.insert(oldCart, (error, success) => {
      if (error) {
        reject(new Error(`Failed to save cart history for user (${cart._id}). Reason: ${error.reason}.`));
      } else {
        resolve();
      }
    });
  });
}

//function to retrieve cart data
function getCart(usrName) {
  return new Promise((resolve, reject) => {
    db_current_cart.get(usrName, (error, result) => {
      if (error) {
        if (error.statusCode === 404) {
          // No cart found, return an empty cart
          return resolve([]);
        } else {
          return reject(new Error(`Failed to fetch information of user (${usrName}). Reason: ${error.reason}.`));
        }
      }
      // Return the user's cart items
      resolve(result.cart);
    });
  });
}

// Function to save removed item
function saveRemovedItem(usrName, removedItem) {
  return new Promise((resolve, reject) => {
    const time = new Date().toISOString();
    const item = { username: usrName, timestamp: time, item: removedItem };

    db_removed_items.insert(item, (error, success) => {
      if (error) {
        reject(new Error(`Failed to save removed item for user (${usrName}). Reason: ${error.reason}.`));
      } else {
        resolve();
      }
    });
  });
}

module.exports = {
  saveCart,
  addToHistory,
  getCart,
  saveRemovedItem
};