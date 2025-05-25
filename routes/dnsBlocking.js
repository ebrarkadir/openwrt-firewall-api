const express = require("express");
const fs = require("fs");
const router = express.Router();
const sendToOpenWRT = require("../utils/openwrtSSH");
const { buildDNSBlockingCommands } = require("../utils/buildCommands");

const BLACKLIST_PATH = "/etc/dnsmasq.d/blacklist.conf";

// 🔥 POST - /api/dnsblocking/rules
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

// 🔍 GET - /api/dnsblocking/rules
router.get("/", async (req, res) => {
  try {
    if (!fs.existsSync(BLACKLIST_PATH)) {
      return res.status(200).json({ rules: [] });
    }

    const content = fs.readFileSync(BLACKLIST_PATH, "utf8");

    // Satırları temizle
    const lines = content.split("\n").map(line => line.trim()).filter(line =>
      line.startsWith("address=/")
    );

    // Domainleri çek
    const domains = lines.map(line => {
      // Örn: address=/youtube.com/0.0.0.0
      const parts = line.split("/");
      return parts.length >= 3 ? parts[1] : null;
    }).filter(Boolean);

    const uniqueDomains = [...new Set(domains)];

    console.log("✅ Aktif DNS Kuralları:", uniqueDomains);

    res.status(200).json({ rules: uniqueDomains });
  } catch (err) {
    console.error("❌ GET DNS Hatası:", err);
    res.status(500).json({ error: "blacklist.conf okunamadı." });
  }
});


module.exports = router;
