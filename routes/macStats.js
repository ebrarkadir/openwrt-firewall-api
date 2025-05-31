// routes/macStats.js
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
  const macCount = {};

  lines.forEach((line) => {
    // Satır örneği: "2025-05-30T06:42:01.879Z,[MAC ROUTING] MAC=40:A4:CC:12:BA:10, action: redirect to 192.168.1.1"
    const match = line.match(/MAC=([0-9A-Fa-f:]+)/);
    if (match && match[1]) {
      const mac = match[1];
      macCount[mac] = (macCount[mac] || 0) + 1;
    }
  });

  const data = Object.entries(macCount).map(([mac, count]) => ({
    name: mac,
    value: count
  }));

  res.json(data);
});

module.exports = router;