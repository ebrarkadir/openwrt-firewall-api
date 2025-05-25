const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { 
  buildFirewallRulesCommands,
  buildFirewallDeleteCommand 
} = require('../utils/buildCommands');

const sendToOpenWRT = require('../utils/openwrtSSH');
const fetchFirewallRules = require('../utils/fetchFirewallRules');

// 📁 Log dosyası yolu
const logPath = path.join(__dirname, '../logs/firewall_log.csv');

// 🔥 POST: Yeni trafik kuralı ekleme
router.post('/', async (req, res) => {
  try {
    const { rules } = req.body;
    if (!Array.isArray(rules)) {
      return res.status(400).json({ error: 'Kurallar bir dizi olmalıdır.' });
    }

    const allCommands = rules.flatMap((rule) => buildFirewallRulesCommands(rule));
    await sendToOpenWRT(allCommands);

    // 📦 CSV'ye kaydet
    const timestamp = new Date().toISOString();
    const logLines = rules.map(rule => {
      const serialized = JSON.stringify(rule).replace(/"/g, '""');
      return `"${timestamp}","${serialized}"`;
    });

    fs.appendFileSync(logPath, logLines.join('\n') + '\n', 'utf8');

    res.json({ success: true, message: 'Trafik yönetimi kuralları başarıyla gönderildi.' });
  } catch (error) {
    console.error('Trafik kuralları gönderilirken hata:', error);
    res.status(500).json({ error: 'Trafik kuralları gönderilemedi.' });
  }
});

// 🔍 GET: Trafik kurallarını listeleme
router.get('/', async (req, res) => {
  console.log("get isteği geldi!");
  
  fetchFirewallRules((err, data) => {
    if (err) {
      console.error("Firewall kuralları alınamadı:", err.message);
      return res.status(500).json({ error: "Firewall kuralları alınamadı." });
    }
    console.log("Firewall kuralları alındı:", data);

    const allLines = data.split('\n');
    const ruleMap = {};

    for (const line of allLines) {
      const match = line.match(/^firewall\.(.*?)\.(.*?)='(.*?)'$/);
      if (match) {
        const [_, uciKey, field, value] = match;
        if (uciKey.startsWith('@rule[')) {
          if (!ruleMap[uciKey]) ruleMap[uciKey] = { uciKey };
          ruleMap[uciKey][field] = value;
        }
      }
    }

    const trafficRules = Object.values(ruleMap).filter(rule => rule.name?.startsWith('traffic_'));

    console.log("Trafik kuralları:", trafficRules);
    
    res.json(trafficRules);
  });
});

// ❌ DELETE: Trafik kuralı silme
router.delete('/:uciKey', async (req, res) => {
  const { uciKey } = req.params;

  if (!uciKey) {
    return res.status(400).json({ error: 'Silinecek kuralın uciKey değeri gereklidir.' });
  }

  try {
    const deleteCommands = buildFirewallDeleteCommand(uciKey);
    await sendToOpenWRT(deleteCommands);
    res.json({ success: true, message: 'Kural başarıyla silindi.' });
  } catch (error) {
    console.error('Kural silinirken hata:', error);
    res.status(500).json({ error: 'Kural silinemedi.' });
  }
});

module.exports = router;