const express = require('express');
const router = express.Router();
const { buildFirewallRulesCommands } = require('../utils/buildCommands');
const sendToOpenWRT = require('../utils/openwrtSSH'); // SSH gönderim fonksiyonun

router.post('/', async (req, res) => {
  try {
    const { rules } = req.body;

    if (!Array.isArray(rules)) {
      return res.status(400).json({ error: 'Kurallar bir dizi olmalıdır.' });
    }

    const allCommands = rules.flatMap((rule) => buildFirewallRulesCommands(rule));

    await sendToOpenWRT(allCommands);

    res.json({ success: true, message: 'Trafik yönetimi kuralları başarıyla gönderildi.' });
  } catch (error) {
    console.error('Trafik kuralları gönderilirken hata:', error);
    res.status(500).json({ error: 'Trafik kuralları gönderilemedi.' });
  }
});

module.exports = router;