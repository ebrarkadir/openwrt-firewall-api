const express = require('express');
const router = express.Router();

const { buildPortForwardingCommands } = require('../utils/buildCommands');
const sendToOpenWRT = require('../utils/openwrtSSH');

router.post('/', async (req, res) => {
  try {
    const { rules } = req.body;

    if (!Array.isArray(rules) || rules.length === 0) {
      return res.status(400).json({ error: 'En az bir kural içeren "rules" dizisi gereklidir.' });
    }

    for (const rule of rules) {
      console.log("🚀 Port Yönlendirme Kuralı:", rule);
      const commands = buildPortForwardingCommands(rule);
      await sendToOpenWRT(commands);
    }

    res.status(200).json({ message: 'Tüm port yönlendirme kuralları başarıyla gönderildi.' });
  } catch (error) {
    console.error("❌ Port yönlendirme kuralı hatası:", error.message);
    res.status(500).json({ error: 'Kural eklenirken bir hata oluştu.' });
  }
});

module.exports = router;
