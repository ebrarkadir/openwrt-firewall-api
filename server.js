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
const portForwardingRoutes = require('./routes/portForwarding');
const macRulesRoutes = require('./routes/macRules'); // MAC Routes doğru geldi

app.use('/api/portblocking/rules', portBlockingRoutes);
app.use('/api/portforwarding/rules', portForwardingRoutes);
app.use('/api/macrouting/rules', macRulesRoutes); // 🔥 düzeltildi

// Test endpoint
app.get('/status', (req, res) => {
  res.json({ message: 'API çalışıyor!', timestamp: new Date() });
});

// Server başlat
app.listen(PORT, () => {
  console.log(`API aktif: http://localhost:${PORT}`);
});
