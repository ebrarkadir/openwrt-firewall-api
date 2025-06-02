const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();
const dnsLogPath = path.join(__dirname, "../logs/dns_requests_log.csv");

router.get("/", (req, res) => {
  if (!fs.existsSync(dnsLogPath)) {
    return res.status(200).json([]);
  }

  const lines = fs.readFileSync(dnsLogPath, "utf8").trim().split("\n");
  const domainCount = {};

  lines.forEach((line) => {
    const parts = line.split(",");
    // CSV satırı: [timestamp, sourceIP | BLOCKED_RESPONSE, domain, typeOrIP]

    if (parts.length >= 3) {
      const domain = parts[2].trim().toLowerCase();
      if (domain) {
        domainCount[domain] = (domainCount[domain] || 0) + 1;
      }
    }
  });

  const result = Object.entries(domainCount)
    .map(([domain, count]) => ({
      name: domain,
      value: count,
    }))
    .sort((a, b) => b.value - a.value); // en çok istek yukarıda

  res.json(result);
});

module.exports = router;