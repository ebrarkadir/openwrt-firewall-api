const express = require("express");
const router = express.Router();
const sendToOpenWRT = require("../utils/openwrtSSH");
const fetchQoSRules = require("../utils/fetchQoSRules"); // yeni doğru fetch
const {
  buildQoSCommands,
  buildQoSDeleteCommand,
} = require("../utils/buildCommands");

// 🔥 QoS - POST (kurallar gönderilir)
router.post("/", async (req, res) => {
  try {
    const rules = req.body.rules || [];
    const commands = buildQoSCommands(rules);
    await sendToOpenWRT(commands);
    res.json({ message: "QoS kuralları gönderildi.", success: true });
  } catch (err) {
    console.error("QoS kuralı hatası:", err);
    res.status(500).json({ error: "QoS kuralı gönderilemedi." });
  }
});

// 🔍 QoS - GET (ipt + tc)
router.get("/", async (req, res) => {
  try {
    fetchQoSRules((err, output) => {
      if (err) {
        console.error("QoS kuralları alınamadı:", err.message);
        return res.status(500).json({ error: "QoS verisi alınamadı." });
      }

      const parts = output.split("====");
      if (parts.length < 2) {
        console.error("⚠️ QoS verisi beklenen formatta değil:", output);
        return res.status(500).json({ error: "QoS verisi ayrıştırılamadı." });
      }

      const iptablesPart = parts[0];
      const tcPart = parts[1];

      const rules = [];

      const iptLines = iptablesPart.split("\n").filter(Boolean);
      iptLines.forEach((line) => {
        const macMatch = line.match(/--mac-source ([\w:]+)/);
        const markMatch = line.match(/--set-xmark 0x([a-fA-F0-9]+)/);
        if (macMatch && markMatch) {
          rules.push({
            mac: macMatch[1],
            mark: parseInt(markMatch[1], 16),
            priority: "",
            classId: "",
          });
        }
      });

      const tcLines = tcPart.split("\n").filter(Boolean);
      tcLines.forEach((line) => {
        const markMatch = line.match(/handle 0x([a-fA-F0-9]+)/);
        const classMatch = line.match(/classid ([\d:]+)/);

        if (markMatch && classMatch) {
          const mark = parseInt(markMatch[1], 16);
          const classId = classMatch[1];
          const rule = rules.find((r) => r.mark === mark);
          if (rule) {
            rule.classId = classId;
            rule.priority =
              classId === "1:10"
                ? "high"
                : classId === "1:20"
                ? "medium"
                : "low";
          }
        }
      });

      return res.json(rules);
    });
  } catch (err) {
    console.error("QoS kuralları alınamadı:", err);
    res.status(500).json({ error: "QoS kuralları alınamadı." });
  }
});

// ❌ QoS - DELETE (mark üzerinden silinir)
router.delete("/:mark", async (req, res) => {
  const { mark } = req.params;

  if (!mark) {
    return res.status(400).json({ error: "Mark değeri gerekli." });
  }

  try {
    const commands = buildQoSDeleteCommand(mark);
    await sendToOpenWRT(commands);
    res.json({ message: "QoS kuralı silindi.", success: true });
  } catch (error) {
    console.error("Silme hatası:", error);
    res.status(500).json({ error: "Kural silinemedi." });
  }
});

module.exports = router;
