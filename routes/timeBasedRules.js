const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const {
  buildTimeBasedRulesCommands,
  buildTimeBasedDeleteCommand,
} = require("../utils/buildCommands");
const sendToOpenWRT = require("../utils/openwrtSSH");
const fetchFirewallRules = require("../utils/fetchFirewallRules");

// 🔥 POST: Zaman Bazlı Kural Ekleme
router.post("/", async (req, res) => {
  const { rules } = req.body;
  try {
    const allCommands = [];
    for (const rule of rules) {
      const commands = buildTimeBasedRulesCommands(rule);
      allCommands.push(...commands);
    }
    await sendToOpenWRT(allCommands);

    // 📁 CSV Loglama
    const logDir = path.join(__dirname, "../logs");
    const logFile = path.join(logDir, "time_based_log.csv");

    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const timestamp = new Date().toISOString();
    const logEntries = rules.map(rule => {
      const jsonString = JSON.stringify(rule).replace(/"/g, '""');
      return `"${timestamp}","${jsonString}"`;
    }).join("\n") + "\n";

    fs.appendFileSync(logFile, logEntries, "utf8");
    console.log("✅ Log kaydı oluşturuldu:", logFile);

    setTimeout(() => {
      res.json({ message: "Zaman bazlı kurallar başarıyla uygulandı." });
    }, 1000);
  } catch (error) {
    console.error("Zaman bazlı kurallar gönderilirken hata:", error);
    res.status(500).json({ error: "Kurallar gönderilemedi." });
  }
});

// 🔍 GET: Zaman Bazlı Kuralları Listele
router.get("/", async (req, res) => {
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
            ruleMap[key] = { uciKey: key }; // ✔ uciKey dahil
          }
          ruleMap[key][field] = value;
        }
      }
    }

    const filtered = Object.values(ruleMap).filter((rule) =>
      rule.name?.startsWith("time_")
    );

    res.json(filtered);
  });
});

// ❌ DELETE: Zaman Bazlı Kural Sil
router.delete("/:uciKey(*)", async (req, res) => {
  const { uciKey } = req.params;

  if (!uciKey) {
    return res.status(400).json({ error: "Geçerli bir uciKey girilmedi." });
  }

  try {
    const commands = buildTimeBasedDeleteCommand(uciKey);
    await sendToOpenWRT(commands);
    res.json({ message: "Zaman bazlı kural silindi.", success: true });
  } catch (error) {
    console.error("Silme hatası:", error);
    res.status(500).json({ error: "Kural silinemedi." });
  }
});

module.exports = router;