const express = require("express");
const router = express.Router();

const { buildPortForwardingCommands } = require("../utils/buildCommands");
const sendToOpenWRT = require("../utils/openwrtSSH");

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

    res
      .status(200)
      .json({
        message: "Tüm port yönlendirme kuralları başarıyla gönderildi.",
      });
  } catch (error) {
    console.error("❌ Port yönlendirme kuralı hatası:", error.message);
    res.status(500).json({ error: "Kural eklenirken bir hata oluştu." });
  }
});

const fetchFirewallRules = require("../utils/fetchFirewallRules");

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
        const [_, uciKey, field, value] = match;
        if (uciKey.startsWith("@redirect[")) {
          if (!ruleMap[uciKey]) ruleMap[uciKey] = { uciKey };
          ruleMap[uciKey][field] = value;
        }
      }
    }

    const forwardingRules = Object.values(ruleMap).filter((rule) =>
      rule.name?.startsWith("forward_")
    );

    res.json(forwardingRules);
  });
});

const { buildPortForwardingDeleteCommand } = require("../utils/buildCommands");

router.delete("/:uciKey", async (req, res) => {
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
