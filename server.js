const express = require('express');
const cors = require('cors');
const fs = require('fs');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = 3001;
const NEWS_FILE = path.join(__dirname, 'news.json');
const uploadDir = path.join(__dirname, 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(cors());
app.use(express.json());

// Serve uploaded images statically
app.use('/uploads', express.static(uploadDir));

// Multer configuration for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Save with original name + timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage: storage });

// Image upload endpoint
app.post('/api/news/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }
  // Return the accessible image URL
  const imageUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
  res.json({ url: imageUrl });
});

// Utility: Read news from file
function readNews() {
  if (!fs.existsSync(NEWS_FILE)) return [];
  try {
    const data = fs.readFileSync(NEWS_FILE, 'utf8');
    return JSON.parse(data) || [];
  } catch (e) {
    return [];
  }
}

// Utility: Write news to file
function writeNews(news) {
  fs.writeFileSync(NEWS_FILE, JSON.stringify(news, null, 2), 'utf8');
}

// Get all news
app.get('/api/news', (req, res) => {
  res.json(readNews());
});

// Add news
app.post('/api/news', (req, res) => {
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

// Delete specific news item by timestamp
app.delete('/api/news/:timestamp', (req, res) => {
  const ts = Number(req.params.timestamp);
  let news = readNews();
  news = news.filter(item => item.timestamp !== ts);
  writeNews(news);
  res.json({ success: true });
});

// Clear all news
app.delete('/api/news', (req, res) => {
  writeNews([]);
  res.json({ success: true });
});

// Start server
app.listen(PORT, () => {
  console.log(`News backend running on http://localhost:${PORT}`);
});