const express = require('express');
const router = express.Router();
const sendToOpenWRT = require('../utils/openwrtSSH');
const { buildDNSBlockingCommands } = require('../utils/buildCommands');

router.post('/', async (req, res) => {
  const { rules } = req.body;

  if (!Array.isArray(rules) || rules.length === 0) {
    return res.status(400).json({ error: 'Geçerli bir kural listesi gönderilmedi.' });
  }

  try {
    const allCommands = [];

    for (const rule of rules) {
      const commands = await buildDNSBlockingCommands(rule);
      allCommands.push(...commands);
    }

    if (allCommands.length === 0) {
      return res.status(400).json({ error: 'Hiçbir IP çözümlenemedi, komut oluşturulamadı.' });
    }

    sendToOpenWRT(allCommands);
    res.json({ message: 'DNS/URL engelleme kuralları başarıyla gönderildi.' });
  } catch (error) {
    console.error('❌ DNS Blocking Error:', error);
    res.status(500).json({ error: 'Kural gönderimi sırasında hata oluştu.' });
  }
});

module.exports = router;