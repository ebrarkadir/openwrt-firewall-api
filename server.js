require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Çalışıyor mu testi
app.get('/status', (req, res) => {
    res.json({ message: "API Çalışıyor!", timestamp: new Date() });
});

// **1. Trafik Yönetimi Endpoint**
app.post('/api/firewall/rules', (req, res) => {
    console.log("Trafik Yönetimi Kuralları Alındı:", req.body);
    // Burada OpenWRT'ye SSH veya HTTP API ile kural ekleme işlemi yapılmalı
    res.status(200).json({ message: "Trafik yönetimi kuralları eklendi!" });
});

// **2. Port Yönlendirme**
app.post('/api/portforwarding/rules', (req, res) => {
    console.log("Port Yönlendirme Kuralları:", req.body);
    res.status(200).json({ message: "Port yönlendirme kuralları başarıyla eklendi!" });
});

// **3. Port Engelleme**
app.post('/api/portblocking/rules', (req, res) => {
    console.log("Port Engelleme Kuralları:", req.body);
    res.status(200).json({ message: "Port engelleme kuralları başarıyla eklendi!" });
});

// **4. MAC Adresi Kuralları**
app.post('/api/macrouting/rules', (req, res) => {
    console.log("MAC Adresi Bazlı Kurallar:", req.body);
    res.status(200).json({ message: "MAC adresi bazlı kurallar başarıyla eklendi!" });
});

// **5. DNS Engelleme**
app.post('/api/dnsblocking/rules', (req, res) => {
    console.log("DNS Engelleme Kuralları:", req.body);
    res.status(200).json({ message: "DNS engelleme kuralları başarıyla eklendi!" });
});

// **6. Trafik Önceliklendirme (QoS)**
app.post('/api/qos/rules', (req, res) => {
    console.log("QoS Kuralları:", req.body);
    res.status(200).json({ message: "QoS kuralları başarıyla eklendi!" });
});

// **7. VPN ve NAT Kuralları**
app.post('/api/vpn-nat/rules', (req, res) => {
    console.log("VPN/NAT Kuralları:", req.body);
    res.status(200).json({ message: "VPN ve NAT kuralları başarıyla eklendi!" });
});

// **Sunucuyu başlat**
app.listen(PORT, () => {
    console.log(`API çalışıyor: http://localhost:${PORT}`);
});
