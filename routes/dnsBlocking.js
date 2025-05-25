const express = require("express");
const router = express.Router();
const { Client } = require("ssh2");
const sendToOpenWRT = require("../utils/openwrtSSH");
const { buildDNSBlockingCommands, buildDNSBlockingDeleteCommand } = require("../utils/buildCommands");
const fetchDnsRules = require("../utils/fetchDnsRules");

// 🔥 POST - DNS kurallarını gönder
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
    }

    await sendToOpenWRT(allCommands);
    res.status(200).json({ message: "DNS kuralları başarıyla gönderildi!" });
  } catch (err) {
    console.error("❌ POST DNS Hatası:", err);
    res.status(500).json({ error: "DNS kuralları gönderilemedi." });
  }
});

// 🔍 GET - DNS kurallarını getir (OpenWRT üzerinden)
router.get("/", async (req, res) => {
  try {
    const domains = await fetchDnsRules();
    res.status(200).json({ rules: domains });
  } catch (error) {
    console.error("❌ DNS GET Hatası:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ❌ DELETE - DNS kuralını sil (OpenWRT üzerinden)
router.delete("/rules/:domain", (req, res) => {
  const domain = req.params.domain;

  if (!domain) {
    return res.status(400).json({ error: "Silinecek domain belirtilmedi." });
  }

  const cmds = buildDNSBlockingDeleteCommand(domain);

  sendToOpenWRT(cmds)
    .then(() => {
      // 🔥 burada sadece JSON dön
      res.status(200).json({ message: `${domain} başarıyla silindi.` });
    })
    .catch((err) => {
      console.error("❌ Silme hatası:", err.message);
      res.status(500).json({ error: "Silme işlemi başarısız." });
    });
});
module.exports = router;