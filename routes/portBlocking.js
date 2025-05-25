const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const fetchFirewallRules = require("../utils/fetchFirewallRules");
const sendToOpenWRT = require("../utils/openwrtSSH");
const { buildPortBlockingCommands } = require("../utils/buildCommands");

// 📁 Log dosyası yolu
const logPath = path.join(__dirname, "../logs/port_blocking_log.csv");

// 🔍 Kuralları Listele
router.get("/", async (req, res) => {
  fetchFirewallRules((err, data) => {
    if (err)
      return res.status(500).json({ error: "Firewall verisi alınamadı" });

    const lines = data.split("\n");
    const ruleMap = {};

    for (const line of lines) {
      const match = line.match(/^firewall\.(@rule\[(\d+)\])\.(\w+)='(.*?)'$/);
      if (match) {
        const [_, rawKey, index, field, value] = match;

        if (!ruleMap[rawKey]) ruleMap[rawKey] = {};
        ruleMap[rawKey][field] = value;

        ruleMap[rawKey]["uciKey"] = rawKey;
      }
    }

    const filtered = Object.values(ruleMap).filter(
      (r) =>
        r.name?.toLowerCase().startsWith("block_tcp_") ||
        r.name?.toLowerCase().startsWith("block_udp_")
    );

    res.json(filtered);
  });
});

// 🔥 Yeni Kural Ekle
router.post("/", async (req, res) => {
  const { rules } = req.body;
  try {
    const allCommands = [];
    for (const rule of rules) {
      const commands = buildPortBlockingCommands(rule);
      allCommands.push(...commands);
    }
    allCommands.push(`uci commit firewall`, `/etc/init.d/firewall restart`);
    await sendToOpenWRT(allCommands);

    // 📝 Log ekle
    const timestamp = new Date().toISOString();
    const logLines = rules.map(rule => {
      const serialized = JSON.stringify(rule).replace(/"/g, '""');
      return `"${timestamp}","${serialized}"`;
    });

    fs.appendFileSync(logPath, logLines.join('\n') + '\n', 'utf8');

    res.json({ message: "Kurallar eklendi" });
  } catch (err) {
    console.error("Ekleme hatası:", err.message);
    res.status(500).json({ error: "Kural eklenemedi" });
  }
});

// ❌ Silme
router.delete("/:rawUciKey", async (req, res) => {
  const { rawUciKey } = req.params;

  console.log("🧨 UI'dan gelen silinecek anahtar:", rawUciKey);

  if (!rawUciKey.startsWith("@rule[")) {
    return res.status(400).json({ error: "Geçersiz UCI anahtarı" });
  }

  const deleteCommands = [
    `uci delete firewall.${rawUciKey}`,
    `uci commit firewall`,
    `/etc/init.d/firewall restart`,
  ];

  console.log("📦 Gönderilecek SSH komutları:", deleteCommands);

  try {
    await sendToOpenWRT(deleteCommands);
    res.json({ success: true, message: "Kural silindi." });
  } catch (error) {
    console.error("❌ SSH silme hatası:", error.message);
    res.status(500).json({ error: "Kural silinemedi." });
  }
});

module.exports = router;