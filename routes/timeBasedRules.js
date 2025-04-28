// routes/timeBasedRules.js

const express = require('express');
const router = express.Router();
const { buildTimeBasedRulesCommands } = require('../buildCommands');
const sendToOpenWRT = require('../utils/sshHelper'); // SSH bağlantı fonksiyonun doğru yolsa

router.post('/', async (req, res) => {
  const { rules } = req.body;

  try {
    const allCommands = [];

    for (const rule of rules) {
      const commands = buildTimeBasedRulesCommands(rule);
      allCommands.push(...commands);
    }

    sendToOpenWRT(allCommands); // SSH ile komutları gönder

    res.json({ message: 'Zaman bazlı port kuralları başarıyla uygulandı.' });
  } catch (error) {
    console.error('Zaman bazlı kurallar gönderilirken hata:', error);
    res.status(500).json({ error: 'Kurallar gönderilemedi.' });
  }
});

module.exports = router;
