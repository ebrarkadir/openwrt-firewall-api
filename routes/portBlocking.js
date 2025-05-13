const express = require("express");
const router = express.Router();
const {
  buildPortBlockingCommands,
  buildPortBlockingDeleteCommand,
} = require("../utils/buildCommands");
const sendToOpenWRT = require("../utils/openwrtSSH");
const fetchFirewallRules = require("../utils/fetchFirewallRules");

// 🔥 POST: Port Engelleme Kurallarını Gönder
router.post("/", async (req, res) => {
  const { rules } = req.body;
  try {
    const allCommands = [];

    for (const rule of rules) {
      const commands = buildPortBlockingCommands(rule);
      allCommands.push(...commands);
    }

    await sendToOpenWRT(allCommands);
    res.json({ message: "Port engelleme kuralları başarıyla gönderildi." });
  } catch (error) {
    console.error("Port engelleme hatası:", error);
    res.status(500).json({ error: "Kurallar gönderilemedi." });
  }
});

// 🔍 GET: Port Engelleme Kurallarını Listele
router.get("/", async (req, res) => {
  fetchFirewallRules((err, data) => {
    if (err) {
      console.error("Firewall kuralları alınamadı:", err.message);
      return res.status(500).json({ error: "Firewall kuralları alınamadı." });
    }

    const lines = data.split("\n");
    const ruleMap = {};

    for (const line of lines) {
      const match = line.match(/^firewall\.(@rule\[\d+\])\.(\w+)='(.*?)'$/);
      if (match) {
        const [_, uciKey, field, value] = match;
        if (!ruleMap[uciKey]) ruleMap[uciKey] = { uciKey };
        ruleMap[uciKey][field] = value;
      }
    }

    const portRules = Object.values(ruleMap).filter(
      (rule) =>
        (rule.name?.toLowerCase().startsWith("block_tcp_") ||
          rule.name?.toLowerCase().startsWith("block_udp_")) &&
        rule.dest_port &&
        rule.proto &&
        rule.src
    );

    res.json(portRules);
  });
});

// ❌ DELETE: Port Engelleme Kuralı Sil
router.delete("/:uciKey(*)", async (req, res) => {
  const { uciKey } = req.params;
  if (!uciKey) {
    return res.status(400).json({ error: "UCI anahtarı eksik." });
  }

  try {
    const deleteCommand = [`uci delete firewall.${uciKey}`, `uci commit firewall`, `/etc/init.d/firewall restart`];
    await sendToOpenWRT(deleteCommand);
    res.json({ success: true, message: "Kural silindi." });
  } catch (error) {
    console.error("Port yönlendirme silme hatası:", error.message);
    res.status(500).json({ error: "Silme başarısız." });
  }
});

module.exports = router;
