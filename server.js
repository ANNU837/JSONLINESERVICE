const express = require('express');
const cors = require('cors');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');
const adminAuth = require('./admin-auth');

const app = express();
const PORT = process.env.PORT || 3001;
const NEWS_FILE = path.join(__dirname, 'news.json');
const uploadDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use('/uploads', express.static(uploadDir));

// Friendly root route
app.get('/', (req, res) => {
  res.send('Welcome to the News API. Use /api/news for news data.');
});

// --- ADMIN AUTH ---
app.post('/api/admin/login', adminAuth.login);

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage: storage });

// Image upload (protected)
app.post('/api/news/upload', adminAuth.authMiddleware, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }
  const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ url: imageUrl });
});

function readNews() {
  if (!fs.existsSync(NEWS_FILE)) return [];
  try {
    const data = fs.readFileSync(NEWS_FILE, 'utf8');
    return JSON.parse(data) || [];
  } catch (e) {
    return [];
  }
}

function writeNews(news) {
  fs.writeFileSync(NEWS_FILE, JSON.stringify(news, null, 2), 'utf8');
}

// --- Public: Get news ---
app.get('/api/news', (req, res) => {
  res.json(readNews());
});

// --- Protected: Add news ---
app.post('/api/news', adminAuth.authMiddleware, (req, res) => {
  const { title, content, imageUrl } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content required' });
  }
  const news = readNews();
  const now = new Date();
  const date = now.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  const item = {
    title,
    content,
    imageUrl: imageUrl || "",
    date,
    timestamp: now.getTime()
  };
  news.unshift(item);
  writeNews(news);
  res.json({ success: true });
});

// --- Protected: Delete news item ---
app.delete('/api/news/:timestamp', adminAuth.authMiddleware, (req, res) => {
  const ts = Number(req.params.timestamp);
  let news = readNews();
  news = news.filter(item => item.timestamp !== ts);
  writeNews(news);
  res.json({ success: true });
});

// --- Protected: Clear all news ---
app.delete('/api/news', adminAuth.authMiddleware, (req, res) => {
  writeNews([]);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`News backend running on http://localhost:${PORT}`);
});