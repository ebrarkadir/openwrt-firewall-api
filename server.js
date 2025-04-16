require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Route'lar
app.use('/api/firewall/rules', require('./routes/firewall'));
app.use('/api/portforwarding/rules', require('./routes/portForwarding'));
app.use('/api/portblocking/rules', require('./routes/portBlocking'));
app.use('/api/macrouting/rules', require('./routes/macRouting'));
app.use('/api/dnsblocking/rules', require('./routes/dnsBlocking'));
app.use('/api/qos/rules', require('./routes/qos'));
app.use('/api/vpn-nat/rules', require('./routes/vpnNat'));
app.use('/api/timeport/rules', require('./routes/timePortRules')); // ✅ Eksik olan bu

// Basit durum testi endpoint’i
app.get('/status', (req, res) => {
  res.json({ message: 'API çalışıyor!', timestamp: new Date() });
});

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`🚀 API çalışıyor: http://localhost:${PORT}`);
});
