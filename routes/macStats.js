const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();

const logPath = path.join(__dirname, "../logs/mac_requests_log.csv");

router.get("/", (req, res) => {
  if (!fs.existsSync(logPath)) {
    return res.status(200).json([]);
  }

  const lines = fs.readFileSync(logPath, "utf8").trim().split("\n");
  const macCounts = {};

  lines.forEach((line) => {
    // Doğru MAC adresini ayıkla — ilk MAC adresini alır
    const match = line.match(/MAC=([0-9a-fA-F:]{17})/);
    if (match && match[1]) {
      const mac = match[1];
      macCounts[mac] = (macCounts[mac] || 0) + 1;
    }
  });

  const result = Object.entries(macCounts).map(([mac, count]) => ({
    mac,
    value: count,
  }));

  res.json(result);
});

module.exports = router;