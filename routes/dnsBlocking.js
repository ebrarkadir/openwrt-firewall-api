const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();

const sendToOpenWRT = require("../utils/openwrtSSH");
const {
  buildDNSBlockingCommands,
  buildDNSBlockingDeleteCommand,
} = require("../utils/buildCommands");
const fetchDnsRules = require("../utils/fetchDnsRules");

// CSV loglama fonksiyonu
const logFilePath = path.join(__dirname, "../logs/dns_rules_log.csv");

function logToCSV(domain) {
  const logLine = `${new Date().toISOString()},${domain}\n`;
  fs.appendFileSync(logFilePath, logLine, "utf8");
}

// 🔥 POST - /api/dnsblocking/rules/
router.post("/", async (req, res) => {
  try {
    const { rules } = req.body;

    if (!Array.isArray(rules) || rules.length === 0) {
      return res.status(400).json({ error: "Kural listesi boş olamaz." });
    }

    const allCommands = [];

    for (const rule of rules) {
      const cmds = await buildDNSBlockingCommands(rule);
      allCommands.push(...cmds);

      // ✅ Logla
      if (rule.domainOrURL) {
        logToCSV(rule.domainOrURL);
      }
    }

    await sendToOpenWRT(allCommands);
    res.status(200).json({ message: "DNS kuralları başarıyla gönderildi!" });
  } catch (err) {
    console.error("❌ POST DNS Hatası:", err);
    res.status(500).json({ error: "DNS kuralları gönderilemedi." });
  }
});

// 🔍 GET - /api/dnsblocking/rules/
router.get("/", async (req, res) => {
  console.log("🔍 DNS GET İsteği Alındı");
  try {
    const domains = await fetchDnsRules();
    console.log("🔍 DNS Kuralları:", domains);

    res.status(200).json({ rules: domains });
  } catch (error) {
    console.error("❌ DNS GET Hatası:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ❌ DELETE - /api/dnsblocking/rules/:domain
router.delete("/:domain", (req, res) => {
  const domain = req.params.domain;

  if (!domain) {
    return res.status(400).json({ error: "Silinecek domain belirtilmedi." });
  }

  const cmds = buildDNSBlockingDeleteCommand(domain);

  sendToOpenWRT(cmds)
    .then(() => {
      res.status(200).json({ message: `${domain} başarıyla silindi.` });
    })
    .catch((err) => {
      console.error("❌ Silme hatası:", err.message);
      res.status(500).json({ error: "Silme işlemi başarısız." });
    });
});

module.exports = router;