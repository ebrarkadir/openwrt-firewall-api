require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Rotalar
const portBlockingRoutes = require('./routes/portBlocking');
app.use('/api/portblocking/rules', portBlockingRoutes);

// Test endpoint'i
app.get('/status', (req, res) => {
  res.json({ message: 'API çalışıyor!', timestamp: new Date() });
});

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`API aktif: http://localhost:${PORT}`);
});
