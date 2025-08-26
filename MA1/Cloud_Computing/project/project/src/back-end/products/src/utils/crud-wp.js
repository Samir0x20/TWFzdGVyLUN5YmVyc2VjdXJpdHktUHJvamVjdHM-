var products = require('nano')(process.env.DB_PRODUCTS_URL)
const { v4: uuidv4 } = require('uuid');

// Function to save a new product
function saveProduct(product) {
  return new Promise((resolve, reject) => {
    console.log('Saving product:', product);
    const id = uuidv4();
    products.insert(product, id,(error, success) => {
        if (success) {
          resolve({id: id}); 
        } else {
          reject(new Error(`Error saving product. Reason: ${error.reason}.`));
        }
      }
    );
  });
}

// Function to update an existing product
function updateProduct(productId, productUpdates) {
  return new Promise((resolve, reject) => {
    products.get(productId, (error, existingProduct) => {
      if (error) {
        return reject(new Error(`Error fetching product. Reason: ${error.reason}.`));
      }

      const updatedProduct = { ...existingProduct, ...productUpdates };

      products.insert(updatedProduct, (error, success) => {
        if (success) {
          resolve(success);
        } else {
          reject(new Error(`Error updating product. Reason: ${error.reason}.`));
        }
      });
    });
  });
}

// Function to delete a product
function deleteProduct(productId) {
  return new Promise((resolve, reject) => {
    products.get(productId, (error, existingProduct) => {
      if (error) {
        return reject(new Error(`Error fetching product. Reason: ${error.reason}.`));
      }

      products.destroy(productId, existingProduct._rev, (error, success) => {
        if (success) {
          resolve();
        } else {
          reject(new Error(`Error deleting product. Reason: ${error.reason}.`));
        }
      });
    });
  });
}

// Function to get all products
function getProducts() {
  return new Promise((resolve, reject) => {
    products.list({ include_docs: true }, (error, body) => {
      if (error) {
        return reject(new Error(`Error fetching products. Reason: ${error.reason}.`));
      }

      const allProducts = body.rows.map(row => {
        const { _id, name, price, url, category } = row.doc;
        return {
          id: _id,
          name: name,
          price: price,
          url: url,
          category: category
        };
      });

      // Group products by category
      const groupedProducts = allProducts.reduce((acc, product) => {
        const category = product.category;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(product);
        return acc;
      }, {});

      resolve(groupedProducts);
    });
  });
}

// Function to get a product by ID
function getProductById(productId) {
  return new Promise((resolve, reject) => {
    products.get(productId, (error, product) => {
      if (error) {
        return reject(new Error(`Error fetching product. Reason: ${error.reason}.`));
      }
      const { _id, name, price, image, category } = product;
      resolve({
        id: _id,
        name: name,
        price: price,
        image: image,
        category: category
      });
    });
  });
}

module.exports = {
  saveProduct,
  updateProduct,
  deleteProduct,
  getProducts,
  getProductById
};