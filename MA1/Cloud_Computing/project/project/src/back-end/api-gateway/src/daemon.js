const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const log = require('debug')('api-gateway-d');
const { createProxyMiddleware } = require('http-proxy-middleware');
const querystring = require('querystring');

const server = express();

server.use(logger('dev'));
server.use(bodyParser.json({ limit: '10mb' }));
server.use(bodyParser.urlencoded({ extended: false }));

// CORS middleware
server.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true'); 
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Function to handle transforming the parsed JS object back to JSON string
const onProxyReq = (proxyReq, req, res) => {
  if (!req.body || !Object.keys(req.body).length) {
    return;
  }
  const contentType = proxyReq.getHeader('Content-Type');
  const writeBody = (bodyData) => {
    proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
    proxyReq.write(bodyData);
  };
  if (contentType.includes('multipart/form-data')) {
    return;
  }
  if (contentType.includes('application/json')) {
    writeBody(JSON.stringify(req.body));
  }
  if (contentType === 'application/x-www-form-urlencoded') {
    writeBody(querystring.stringify(req.body));
  }
};

////////////////////
// RECOMMENDATION //
////////////////////

// Route for the recommendation service
server.use('/api/v1/recommendation', createProxyMiddleware({
  target: process.env.RECOMMENDATION_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/recommendation': '/recommendation' },
  onProxyReq,
  onProxyRes: (proxyRes, req, res) => {
      log(`Received response from ${process.env.RECOMMENDATION_SERVICE_URL} with status ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    log(`Error proxying request to ${process.env.RECOMMENDATION_SERVICE_URL}: ${err.message}`);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
}
}));


///////////////
// PRODUCTS  //
///////////////

// Route for the product service
server.use('/api/v1/product/save', createProxyMiddleware({
  target: process.env.PRODUCTS_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/product/save': '/product/save' },
  onProxyReq,
  onProxyRes: (proxyRes, req, res) => {
      log(`Received response from ${process.env.PRODUCTS_SERVICE_URL} with status ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    log(`Error proxying request to ${process.env.PRODUCTS_SERVICE_URL}: ${err.message}`);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
}
}));

// Route for the product service
server.use('/api/v1/product', createProxyMiddleware({
  target: process.env.PRODUCTS_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/product': '/product' },
  onProxyReq,
  onProxyRes: (proxyRes, req, res) => {
      log(`Received response from ${process.env.PRODUCTS_SERVICE_URL} with status ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    log(`Error proxying request to ${process.env.PRODUCTS_SERVICE_URL}: ${err.message}`);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
}
}));

// Route for the product service
server.use('/api/v1/product/update', createProxyMiddleware({
  target: process.env.PRODUCTS_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/product/update': '/product/update' },
  onProxyReq,
  onProxyRes: (proxyRes, req, res) => {
      log(`Received response from ${process.env.PRODUCTS_SERVICE_URL} with status ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    log(`Error proxying request to ${process.env.PRODUCTS_SERVICE_URL}: ${err.message}`);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
}
}));

// Route for the product service
server.use('/api/v1/product/delete', createProxyMiddleware({
  target: process.env.PRODUCTS_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/product/delete': '/product/delete' },
  onProxyReq,
  onProxyRes: (proxyRes, req, res) => {
      log(`Received response from ${process.env.PRODUCTS_SERVICE_URL} with status ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    log(`Error proxying request to ${process.env.PRODUCTS_SERVICE_URL}: ${err.message}`);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
}
}));

///////////////
//  CHECKOUT //
///////////////

// Route for the checkout service
server.use('/api/v1/checkout/save', createProxyMiddleware({
  target: process.env.CHECKOUT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/checkout/save': '/checkout/save' },
  onProxyReq,
  onProxyRes: (proxyRes, req, res) => {
      log(`Received response from ${process.env.CHECKOUT_SERVICE_URL} with status ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    log(`Error proxying request to ${process.env.CHECKOUT_SERVICE_URL}: ${err.message}`);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
}
}));

// Route for the checkout service
server.use('/api/v1/checkout/load', createProxyMiddleware({
  target: process.env.CHECKOUT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/checkout/load': '/checkout/load' },
  onProxyReq,
  onProxyRes: (proxyRes, req, res) => {
      log(`Received response from ${process.env.CHECKOUT_SERVICE_URL} with status ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    log(`Error proxying request to ${process.env.CHECKOUT_SERVICE_URL}: ${err.message}`);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
}
}));


///////////////
//   CART    //
///////////////

// Route for the cart service
server.use('/api/v1/cart/save', createProxyMiddleware({
  target: process.env.CART_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/cart/save': '/cart/save' },
  onProxyReq,
  onProxyRes: (proxyRes, req, res) => {
      log(`Received response from ${process.env.CART_SERVICE_URL} with status ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    log(`Error proxying request to ${process.env.CART_SERVICE_URL}: ${err.message}`);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
}
}));

// Route for the cart service
server.use('/api/v1/cart/:username', createProxyMiddleware({
  target: process.env.CART_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/cart': '/cart' },
  onProxyReq,
  onProxyRes: (proxyRes, req, res) => {
      log(`Received response from ${process.env.CART_SERVICE_URL} with status ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    log(`Error proxying request to ${process.env.CART_SERVICE_URL}: ${err.message}`);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
}
}));

// Route for the cart service
server.use('/api/v1/cart/remove', createProxyMiddleware({
  target: process.env.CART_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/cart/remove': '/cart/remove' },
  onProxyReq,
  onProxyRes: (proxyRes, req, res) => {
      log(`Received response from ${process.env.CART_SERVICE_URL} with status ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    log(`Error proxying request to ${process.env.CART_SERVICE_URL}: ${err.message}`);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
}
}));

///////////////
//   USERS   //
///////////////

// Route for the user service
server.use('/api/v1/register', createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/register': '/register' },
  onProxyReq,
  onProxyRes: (proxyRes, req, res) => {
      log(`Received response from ${process.env.AUTH_SERVICE_URL} with status ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
      log(`Error proxying request to ${process.env.AUTH_SERVICE_URL}: ${err.message}`);
      res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
}));

// Route for the user service
server.use('/api/v1/login', createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/login': '/login' },
  onProxyReq,
  onProxyRes: (proxyRes, req, res) => {
      log(`Received response from ${process.env.AUTH_SERVICE_URL} with status ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    log(`Error proxying request to ${process.env.AUTH_SERVICE_URL}: ${err.message}`);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
}
}));

// Route for the user service
server.use('/api/v1/verify/:token', createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/verify': '/verify' },
  onProxyReq,
  onProxyRes: (proxyRes, req, res) => {
      log(`Received response from ${process.env.AUTH_SERVICE_URL} with status ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    log(`Error proxying request to ${process.env.AUTH_SERVICE_URL}: ${err.message}`);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
}
}));

// Route for the user service
server.use('/api/v1/logout', createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/logout': '/logout' },
  onProxyReq,
  onProxyRes: (proxyRes, req, res) => {
      log(`Received response from ${process.env.AUTH_SERVICE_URL} with status ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    log(`Error proxying request to ${process.env.AUTH_SERVICE_URL}: ${err.message}`);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
}
}));

// Route for the user service
server.use('/api/v1/delete/:username', createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/delete': '/delete' },
  onProxyReq,
  onProxyRes: (proxyRes, req, res) => {
      log(`Received response from ${process.env.AUTH_SERVICE_URL} with status ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    log(`Error proxying request to ${process.env.AUTH_SERVICE_URL}: ${err.message}`);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
}
}));

// Error handling middleware for 404 errors
server.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// Error handling middleware for other errors
server.use((err, req, res, next) => {
    const message = req.app.get('env') === 'development' ? err.message : {};
    const status = err.status || 500;
    log(`${message}`);
    res.status(status).json({
      message: err.message,
      error: message,
    });
});

// Start the server
const port = process.env.API_GATEWAY_D_PORT;
server.listen(port, function () {
  log(`Listening at port ${port}`);
});

module.exports = server;