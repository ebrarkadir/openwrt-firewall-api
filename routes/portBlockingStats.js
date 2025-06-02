const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();
const logPath = path.join(__dirname, "../logs/port_blocking_requests_log.csv");

router.get("/", (req, res) => {
  if (!fs.existsSync(logPath)) return res.status(200).json([]);

  const lines = fs.readFileSync(logPath, "utf8").trim().split("\n");
  const ipCount = {};

  lines.forEach((line) => {
    const logText = line.split(",").slice(1).join(",");
    const match = logText.match(/SRC=([\d.]+)/);
    if (match && match[1]) {
      const ip = match[1];
      ipCount[ip] = (ipCount[ip] || 0) + 1;
    }
  });

  const data = Object.entries(ipCount).map(([ip, count]) => ({
    ip,            // 👈 burada da "ip"
    value: count,
  }));

  res.json(data);
});

module.exports = router;