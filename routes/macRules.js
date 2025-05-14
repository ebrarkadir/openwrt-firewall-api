const express = require('express');
const router = express.Router();
const {
  buildMACRulesCommands,
  buildMACRulesDeleteCommand
} = require('../utils/buildCommands');
const sendToOpenWRT = require('../utils/openwrtSSH');
const fetchFirewallRules = require('../utils/fetchFirewallRules');

// 🔥 POST: MAC Kuralı Ekle
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

// 🔍 GET: MAC Kurallarını Listele
router.get('/', async (req, res) => {
  fetchFirewallRules((err, data) => {
    if (err) {
      console.error("Firewall kuralları alınamadı:", err.message);
      return res.status(500).json({ error: "Firewall kuralları alınamadı." });
    }

    const allLines = data.split("\n");
    const ruleMap = {};

    for (const line of allLines) {
      const match = line.match(/^firewall\.(.*?)\.(.*?)='(.*?)'$/);
      if (match) {
        const [_, key, field, value] = match;
        if (key.startsWith("@rule[")) {
          if (!ruleMap[key]) {
            ruleMap[key] = { uciKey: key };
          }
          ruleMap[key][field] = value;
        }
      }
    }

    const filtered = Object.values(ruleMap).filter(
      (rule) => rule.name?.startsWith("mac_")
    );

    res.json(filtered);
  });
});

// ❌ DELETE: MAC Kuralı Sil
router.delete('/:uciKey(*)', async (req, res) => {
  const { uciKey } = req.params;

  if (!uciKey) {
    return res.status(400).json({ error: "Geçerli bir uciKey girilmedi." });
  }

  try {
    const commands = buildMACRulesDeleteCommand(uciKey);
    await sendToOpenWRT(commands);
    res.json({ success: true, message: "MAC kuralı silindi." });
  } catch (error) {
    console.error("Silme hatası:", error);
    res.status(500).json({ error: "Kural silinemedi." });
  }
});

module.exports = router;
