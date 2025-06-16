const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// For demo, hardcoded admin user and password hash (hash for 'ZahJaf@321')
// In production, use environment variables and a database!
const ADMIN_USER = 'admin';
const ADMIN_PASS_HASH = '$2a$10$D4RFy3M89GJ5p1FjodHKyutG0cA0A5B8bKz2VGA0Y7Iu3wQ2h7pK6'; // hash of ZahJaf@321
const JWT_SECRET = 'supersecret_jwt_secret_key'; // Change this!

exports.login = async (req, res) => {
  const { username, password } = req.body;
  if (username !== ADMIN_USER) return res.status(401).json({ message: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, ADMIN_PASS_HASH);
  if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ username: ADMIN_USER }, JWT_SECRET, { expiresIn: '2h' });
  res.json({ token });
};

exports.authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Unauthorized' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};