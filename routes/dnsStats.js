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

  lines.forEach(line => {
    const parts = line.split(",");
    if (parts.length < 3) return; // geçersiz satırı atla

    const domain = parts[2].trim().toLowerCase();
    if (domain && domain !== "") {
      domainCount[domain] = (domainCount[domain] || 0) + 1;
    }
  });

  const data = Object.entries(domainCount).map(([domain, count]) => ({
    name: domain,
    value: count
  }));

  res.json(data);
});

module.exports = router;