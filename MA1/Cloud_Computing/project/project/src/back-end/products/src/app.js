const express = require('express');
const log = require('debug')('products-d');
const app = express.Router();
const db = require('./utils/crud-wp');
const logs = require('./utils/logs');
const verifyToken = require('./utils/auth');
const multer = require('multer');
const { uploadImageToBlobStorage, deleteImageFromBlobStorage } = require('./utils/azureBlobStorage');

const upload = multer(); // Middleware to process `multipart/form-data`

// Endpoint to save a new product
app.post('/product/save', verifyToken, upload.single('image'), (req, res, next) => {
  logs.measurePerformance(req, res, next, 'product', '/product/save', async (req, res) => {
    const username = req.user.username || 'anonymous';

    try {
      // Extract product details
      const product = {
        name: req.body.name,
        price: req.body.price,
        category: req.body.category,
        url: req.body.url
      };

      // Save the product to the database
      const savedProduct = await db.saveProduct(product);

      // Respond to the client immediately
      res.status(200).json({ status: 'success', product: savedProduct });

      // Log user action
      logs.logUserAction(username, 'save', '/product/save', { product });

      // If an image file is provided, upload it to Azure Blob Storage asynchronously
      if (req.file) {
        uploadImageToBlobStorage(req.file, product.name, product.category)
          .then(imageUrl => {
            // Update the product with the image URL
            product.url = imageUrl;
            db.updateProduct(savedProduct.id, product);
          })
          .catch(error => {
            log(`Error uploading image: ${error.message}`);
          });
      }
    } catch (err) {
      log(`Error saving product: ${err.message}`);
      res.status(409).json({ status: 'error', message: String(err) });
    }
  });
});

// Endpoint to update an existing product
app.put('/product/update/:id', verifyToken, upload.single('image'), (req, res, next) => {
  logs.measurePerformance(req, res, next, 'product', '/product/update/:id', async (req, res) => {
    const productId = req.params.id;
    const username = req.user.username || 'anonymous';
    log(`Updating product (${productId})`);

    try {
      const productUpdates = {
        name: req.body.name,
        price: req.body.price,
        category: req.body.category,
        url: req.body.url
      };

      const updatedProduct = await db.updateProduct(productId, productUpdates);
      res.status(200).json({ status: 'success', product: updatedProduct });
      logs.logUserAction(username, 'update', '/product/update/:id', { productId, productUpdates });

      if (req.file) {
        // If an image file is provided, upload it to Azure Blob Storage asynchronously
        uploadImageToBlobStorage(req.file, productUpdates.name, productUpdates.category)
          .then(imageUrl => {
            // Update the product with the image URL
            productUpdates.url = imageUrl;
            db.updateProduct(productId, productUpdates);
          })
          .catch(error => {
            log(`Error uploading image: ${error.message}`);
          });
      }

    } catch (err) {
      log(`Error updating product: ${err.message}`);
      res.status(409).json({ status: 'error', message: String(err) });
    }
  });
});

// Endpoint to delete a product
app.delete('/product/delete/:id', verifyToken, async (req, res, next) => {
  logs.measurePerformance(req, res, next, 'product', '/product/delete/:id', async (req, res) => {
    const productId = req.params.id;
    const username = req.user.username || 'anonymous';
    log(`Deleting product (${productId})`);

    try {
      // Retrieve the product details to get the image URL
      const product = await db.getProductById(productId);
      
      // Delete the product from the database
      await db.deleteProduct(productId);

      // Respond to the user immediately after database deletion
      res.status(200).json({ status: 'success', message: 'Product deleted' });

      // Log the user action
      logs.logUserAction(username, 'delete', '/product/delete/:id', { productId });

      if (product && product.url) {
        // Delete the image from Azure Blob Storage asynchronously without waiting
        deleteImageFromBlobStorage(product.url).catch(error => {
          log(`Error deleting image: ${error.message}`);
        });
      }
    } catch (err) {
      log(`Error deleting product: ${err.message}`);
      res.status(409).json({ status: 'error', message: String(err) });
    }
  });
});


// Endpoint to get all products
app.get('/product', (req, res, next) => {
  logs.measurePerformance(req, res, next, 'product', '/product', async (req, res) => {
    log('Fetching all products');

    try {
      const products = await db.getProducts();
      res.status(200).json({ status: 'success', products: products });
    } catch (err) {
      log(`Error fetching products: ${err.message}`);
      res.status(500).json({ status: 'error', message: String(err) });
    }
  });
});

module.exports = app;