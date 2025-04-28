const express = require('express');
const router = express.Router();
const { buildTimeBasedRulesCommands } = require('../buildCommands');
const { executeCommands } = require('../utils/sshHelper'); // SSH bağlantı fonksiyonun buysa
// Eğer sshHelper yoksa, doğrudan terminale komut basıyorsan onu söyle, düzenleriz.

router.post('/', async (req, res) => {
  const { rules } = req.body;

  try {
    const allCommands = [];

    for (const rule of rules) {
      const commands = buildTimeBasedRulesCommands(rule);
      allCommands.push(...commands);
    }

    // SSH üzerinden OpenWRT'ye komutları gönder
    await executeCommands(allCommands);

    res.json({ message: 'Zaman bazlı port kuralları başarıyla uygulandı.' });
  } catch (error) {
    console.error('Time-based rules uygulama hatası:', error);
    res.status(500).json({ error: 'Zaman bazlı port kuralları uygulanırken hata oluştu.' });
  }
});

module.exports = router;
