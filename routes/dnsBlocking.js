const express = require('express');
const router = express.Router();
const sendToOpenWRT = require('../utils/openwrtSSH');
const { buildDNSBlockingCommands } = require('../utils/buildCommands');

router.post('/', async (req, res) => {
  const { rules } = req.body;

  if (!Array.isArray(rules)) {
    return res.status(400).json({ error: "Kurallar geçerli formatta değil." });
  }

  try {
    const allCommands = [];

    for (const rule of rules) {
      const commands = await buildDNSBlockingCommands(rule);
      allCommands.push(...commands);
    }

    sendToOpenWRT(allCommands);
    res.json({ message: "Kurallar başarıyla gönderildi." });
  } catch (error) {
    console.error("❌ DNS Blocking Route Hatası:", error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

module.exports = router;