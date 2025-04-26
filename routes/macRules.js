const express = require('express');
const router = express.Router();
const { buildMACRulesCommands } = require('../utils/buildCommands');
const sendToOpenWRT = require('../utils/openwrtSSH'); // doğru ssh fonksiyonun buysa

// MAC Rules endpoint
router.post('/', async (req, res) => {
  try {
    const { rules } = req.body;

    if (!Array.isArray(rules)) {
      return res.status(400).json({ error: 'Kurallar bir dizi olmalıdır.' });
    }

    const allCommands = rules.flatMap((rule) => buildMACRulesCommands(rule));

    await sendToOpenWRT(allCommands);

    res.json({ success: true, message: 'MAC kuralları başarıyla gönderildi.' });
  } catch (error) {
    console.error('MAC kuralları gönderilirken hata:', error);
    res.status(500).json({ error: 'MAC kuralları gönderilemedi.' });
  }
});

module.exports = router;
