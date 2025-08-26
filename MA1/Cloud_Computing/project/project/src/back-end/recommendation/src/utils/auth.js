// middleware/auth.js
const axios = require('axios');
const authServiceUrl = process.env.AUTH_SERVICE_URL; // URL of the authentication microservice

async function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Invalid token format' });
  }

  try {
    const response = await axios.get(`${authServiceUrl}/verify/${token}`);
    if (response.status === 200) {
      req.user = response.data;
      next();
    } else {
      res.status(403).json({ message: 'Failed to authenticate token' });
    }
  } catch (err) {
    res.status(403).json({ message: 'Failed to authenticate token', error: err.message });
  }
}

module.exports = verifyToken;