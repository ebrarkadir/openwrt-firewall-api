const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const logPath = path.join(__dirname, "../logs/firewall_requests_log.csv");

router.get("/", (req, res) => {
  if (!fs.existsSync(logPath)) {
    return res.status(200).json([]);
  }

  const lines = fs.readFileSync(logPath, "utf8").trim().split("\n");

  const ipCount = {};

  lines.forEach((line) => {
    // Örnek satır: "2025-05-30T05:00:00.000Z,[FIREWALL] ... SRC=192.168.1.113 ..."
    const match = line.match(/SRC=([\d.]+)/);
    if (match) {
      const ip = match[1];
      ipCount[ip] = (ipCount[ip] || 0) + 1;
    }
  });

  const data = Object.entries(ipCount)
    .map(([ip, count]) => ({
      name: ip,
      value: count,
    }))
    .sort((a, b) => b.value - a.value); // En çok görünenden başlayarak sırala

  res.json(data);
});

module.exports = router;
