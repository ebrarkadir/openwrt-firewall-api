const express = require("express");
const router = express.Router();
const sendToOpenWRT = require("../utils/openwrtSSH");
const { buildQoSCommands } = require("../utils/buildCommands");

router.post("/", async (req, res) => {
  try {
    const rules = req.body.rules || [];
    const commands = buildQoSCommands(rules); // Tüm mantık burada olacak
    sendToOpenWRT(commands);
    res.json({ message: "QoS kuralları gönderildi.", commands });
  } catch (err) {
    console.error("QoS kuralı hatası:", err);
    res.status(500).json({ error: "QoS kuralı gönderilemedi." });
  }
});

module.exports = router;
