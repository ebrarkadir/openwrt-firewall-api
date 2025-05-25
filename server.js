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
const firewallRoutes = require('./routes/firewall'); // Firewall Routes doğru geldi
const timeBasedRulesRoutes = require('./routes/timeBasedRules');
const dnsBlockingRoutes = require('./routes/dnsBlocking'); // DNS Blocking Routes doğru geldi
const qosRulesRoutes = require('./routes/qosRules');
const vpnNatRoutes = require('./routes/vpn-nat'); // VPN/NAT Routes doğru geldi


app.use('/api/portblocking/rules', portBlockingRoutes);
app.use('/api/portforwarding/rules', portForwardingRoutes);
app.use('/api/macrouting/rules', macRulesRoutes);
app.use('/api/firewall/rules', firewallRoutes);
app.use('/api/timebased/rules', timeBasedRulesRoutes); // 🔥 BURAYA EKLEDİK
app.use('/api/dnsblocking/rules', dnsBlockingRoutes); // DNS Blocking Routes doğru geldi
app.use('/api/qos/rules', qosRulesRoutes);
app.use('/api/vpn-nat/rules', vpnNatRoutes); // VPN/NAT Routes doğru geldi



app.get('/status', (req, res) => {
  res.json({ message: 'API çalışıyor!', timestamp: new Date() });
});

// Server başlat
app.listen(PORT, () => {
  console.log(`API aktif: http://localhost:${PORT}`);
});
