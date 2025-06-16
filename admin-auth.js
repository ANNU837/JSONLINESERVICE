const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// For production, use environment variables for secrets and hashes!
const ADMIN_USER = 'admin';
// This hash is for password 'ZahJaf@321'
const ADMIN_PASS_HASH = '$2a$10$D4RFy3M89GJ5p1FjodHKyutG0cA0A5B8bKz2VGA0Y7Iu3wQ2h7pK6';
const JWT_SECRET = 'supersecret_jwt_secret_key_change_this'; // Change this for production!

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (username !== ADMIN_USER) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, ADMIN_PASS_HASH);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ username: ADMIN_USER }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login.' });
  }
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
