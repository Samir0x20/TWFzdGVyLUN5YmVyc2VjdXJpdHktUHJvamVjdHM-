var db_checkout = require('nano')(process.env.DB_CHECKOUT_URL);

// Function to save checkout data
function saveCheckout(usrName, newCheckout) {
  return new Promise((resolve, reject) => {
    const timestamp = new Date().toISOString();
    const checkoutDoc = {
      username: usrName,
      timestamp: timestamp,
      checkout: newCheckout
    };

    // Insert the new checkout document into the database
    db_checkout.insert(checkoutDoc, (error, success) => {
      if (success) {
        resolve();
      } else {
        reject(new Error(`Failed to save checkout for user (${usrName}). Reason: ${error.reason}.`));
      }
    });
  });
}


// Create an index for the database to get checkouts by username and timestamp
db_checkout.createIndex({
  index: {
    fields: ['username', 'timestamp']
  }
}, (error, response) => {
  if (error) {
    console.error('Error creating index:', error);
  } else {
    console.log('Index created:', response);
  }
});

// Function to retrieve checkout data
function getCheckout(usrName) {
  return new Promise((resolve, reject) => {
    const query = {
      selector: {
        username: usrName
      },
      sort: [{ timestamp: 'asc' }],
      use_index: 'username,timestamp'
    };

    db_checkout.find(query, (error, result) => {
      if (error) {
        return reject(new Error(`Failed to fetch checkout for user (${usrName}). Reason: ${error.reason}.`));
      }
      if (result.docs.length === 0) {
        // No checkout found, return an empty array
        return resolve([]);
      }
      // Combine all checkouts into a list
      const checkouts = result.docs.map(doc => doc.checkout);
      resolve(checkouts);
    });
  });
}

module.exports = {
  saveCheckout,
  getCheckout
};