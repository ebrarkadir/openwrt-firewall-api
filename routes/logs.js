const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();

const logDir = path.join(__dirname, "../logs");

// ✅ Yeni CSV dosya adları
const logFiles = [
  "dns_rules_log.csv",
  "firewall_log.csv",
  "mac_rules_log.csv",
  "port_blocking_log.csv",
  "port_forwarding_log.csv",
  "qos_rules_log.csv",
  "time_based_log.csv"
];

// GET /logs -> Tüm logları JSON olarak döner
router.get("/", (req, res) => {
  const allLogs = [];

  logFiles.forEach((file) => {
    const filePath = path.join(logDir, file);
    if (fs.existsSync(filePath)) {
      const lines = fs.readFileSync(filePath, "utf8").trim().split("\n");

      lines.forEach((line) => {
        const [timestamp, rule] = line.split(/,(.+)/); // İlk virgütten itibaren böl
        if (timestamp && rule) {
          allLogs.push({
            file: file.replace(".csv", ""), // .csv olmadan dosya adı
            timestamp: timestamp.trim(),
            rule: rule.trim()
          });
        }
      });
    }
  });

  res.json(allLogs);
});

module.exports = router;