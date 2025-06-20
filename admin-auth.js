const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const ADMIN_USER = 'admin';
const ADMIN_PASS_HASH = '$2b$10$jXOb8K4F25dvnOQr5Go1d.rLW.5f0dzdP.qg6mSf90MX6Q6okXnbS'; // hash of ZahJaf@321
const JWT_SECRET = 'supersecret_jwt_secret_key';

exports.login = async (req, res) => {
  const { username, password } = req.body;
  console.log('Login Attempt:', { username, password }); // For debugging

  if (username !== ADMIN_USER) {
    console.log('Username did not match');
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, ADMIN_PASS_HASH);
  console.log('Password valid:', valid);

  if (!valid) {
    console.log('Password did not match');
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ username: ADMIN_USER }, JWT_SECRET, { expiresIn: '2h' });
  res.json({ token });
};

exports.authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};