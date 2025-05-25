const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const {
  buildPortForwardingCommands,
  buildPortForwardingDeleteCommand,
} = require("../utils/buildCommands");

const sendToOpenWRT = require("../utils/openwrtSSH");
const fetchFirewallRules = require("../utils/fetchFirewallRules");

// 📁 Log dosyası yolu
const logPath = path.join(__dirname, "../logs/port_forwarding_log.csv");

// 🔥 KURAL EKLE (POST)
router.post("/", async (req, res) => {
  try {
    const { rules } = req.body;

    if (!Array.isArray(rules) || rules.length === 0) {
      return res
        .status(400)
        .json({ error: 'En az bir kural içeren "rules" dizisi gereklidir.' });
    }

    for (const rule of rules) {
      console.log("🚀 Port Yönlendirme Kuralı:", rule);
      const commands = buildPortForwardingCommands(rule);
      await sendToOpenWRT(commands);
    }

    // 📝 Logla
    const timestamp = new Date().toISOString();
    const logLines = rules.map(rule => {
      const serialized = JSON.stringify(rule).replace(/"/g, '""');
      return `"${timestamp}","${serialized}"`;
    });
    fs.appendFileSync(logPath, logLines.join("\n") + "\n", "utf8");

    res.status(200).json({
      message: "Tüm port yönlendirme kuralları başarıyla gönderildi.",
    });
  } catch (error) {
    console.error("❌ Port yönlendirme kuralı hatası:", error.message);
    res.status(500).json({ error: "Kural eklenirken bir hata oluştu." });
  }
});

// 🔍 KURALLARI GETİR (GET)
router.get("/", async (req, res) => {
  fetchFirewallRules((err, data) => {
    if (err) {
      console.error("Port yönlendirme kuralları alınamadı:", err.message);
      return res
        .status(500)
        .json({ error: "Port yönlendirme kuralları alınamadı." });
    }

    const allLines = data.split("\n");
    const ruleMap = {};

    for (const line of allLines) {
      const match = line.match(/^firewall\.(.*?)\.(.*?)='(.*?)'$/);
      if (match) {
        const [_, rawKey, field, value] = match;
        if (rawKey.startsWith("@redirect[")) {
          if (!ruleMap[rawKey]) ruleMap[rawKey] = {};
          ruleMap[rawKey][field] = value;
          ruleMap[rawKey]["uciKey"] = rawKey;
        }
      }
    }

    const forwardingRules = Object.values(ruleMap).filter((rule) =>
      rule.name?.startsWith("forward_")
    );

    res.json(forwardingRules);
  });
});

// ❌ KURAL SİL (DELETE)
router.delete("/:uciKey(*)", async (req, res) => {
  const { uciKey } = req.params;

  if (!uciKey) {
    return res
      .status(400)
      .json({ error: "Silinecek kuralın uciKey değeri gereklidir." });
  }

  try {
    const commands = buildPortForwardingDeleteCommand(uciKey);
    await sendToOpenWRT(commands);
    res.json({ success: true, message: "Kural silindi." });
  } catch (error) {
    console.error("Silme hatası:", error.message);
    res.status(500).json({ error: "Kural silinemedi." });
  }
});

module.exports = router;