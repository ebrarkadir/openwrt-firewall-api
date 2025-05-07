const express = require("express");
const router = express.Router();
const sendToOpenWRT = require("../utils/openwrtSSH");
const { buildVPNRulesCommands } = require("../utils/buildCommands");

router.post("/", async (req, res) => {
  try {
    const rules = req.body.rules;
    const commands = buildVPNRulesCommands(rules);
    sendToOpenWRT(commands);
    res.status(200).json({ message: "VPN/NAT kuralları gönderildi!" });
  } catch (error) {
    console.error("❌ VPN/NAT kural hatası:", error);
    res.status(500).json({ error: "VPN/NAT kuralları gönderilemedi." });
  }
});

module.exports = router;