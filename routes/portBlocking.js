const express = require("express");
const router = express.Router();
const {
  buildPortBlockingCommands,
  buildPortBlockingDeleteCommand,
} = require("../utils/buildCommands");
const sendToOpenWRT = require("../utils/openwrtSSH");
const fetchFirewallRules = require("../utils/fetchFirewallRules");

// 🔥 POST: Port Engelleme Kuralları Gönder
router.post("/", async (req, res) => {
  const { rules } = req.body;
  try {
    const allCommands = [];

    for (const rule of rules) {
      const commands = buildPortBlockingCommands(rule);
      allCommands.push(...commands);
    }

    await sendToOpenWRT(allCommands);
    res.json({ message: "Port engelleme kuralları uygulandı." });
  } catch (error) {
    console.error("Port engelleme hatası:", error);
    res.status(500).json({ error: "Kurallar gönderilemedi." });
  }
});

// 🔍 GET: Mevcut Port Engelleme Kurallarını Listele
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
        if (!ruleMap[uciKey]) ruleMap[uciKey] = {};
        ruleMap[uciKey][field] = value;
      }
    }

    const portRules = Object.entries(ruleMap)
      .filter(([_, rule]) =>
        rule.name?.startsWith("block_tcp_") || rule.name?.startsWith("block_udp_")
      )
      .map(([rawUciKey, rule]) => ({
        ...rule,
        uciKey: rawUciKey.replace("@rule[", "rule").replace("]", ""),
      }));

    res.json(portRules);
  });
});

// ❌ DELETE: Belirli Port Engelleme Kuralını Sil
router.delete("/:uciKey", async (req, res) => {
  const { uciKey } = req.params;
  if (!uciKey) {
    return res.status(400).json({ error: "UCI anahtarı gerekli." });
  }

  try {
    const deleteCommands = buildPortBlockingDeleteCommand(uciKey);
    await sendToOpenWRT(deleteCommands);
    res.json({ success: true, message: "Kural silindi." });
  } catch (error) {
    console.error("Silme hatası:", error);
    res.status(500).json({ error: "Kural silinemedi." });
  }
});

module.exports = router;