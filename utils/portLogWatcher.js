const fs = require("fs");
const path = require("path");
const axios = require("axios");
const fetchLogreadOutput = require("./logFetcher");

// 📁 Log dosya yolları
const portLogPath = path.join(__dirname, "../logs/port_blocking_requests_log.csv");
const firewallLogPath = path.join(__dirname, "../logs/firewall_requests_log.csv");
const dnsLogPath = path.join(__dirname, "../logs/dns_requests_log.csv");
const macLogPath = path.join(__dirname, "../logs/mac_requests_log.csv");

// 📁 Klasörleri oluştur
[
  portLogPath,
  firewallLogPath,
  dnsLogPath,
  macLogPath,
].forEach((filePath) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 🔁 Görülen logları tekrar yazmamak için set
const seenLogs = new Set();

// 🧠 Dinamik olarak engellenmiş domainleri API'den al
async function fetchBlockedDomains() {
  try {
    const response = await axios.get("http://localhost:5000/api/dnsblocking/rules");
    const raw = response.data.rules || [];

    return raw
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean);
  } catch (err) {
    console.error("❌ Engellenmiş domainler alınamadı:", err.message);
    return [];
  }
}

function startPortLogWatcher() {
  console.log("📡 portLogWatcher aktif");

  setInterval(async () => {
    try {
      const blockedDomains = await fetchBlockedDomains();
      const stdout = await fetchLogreadOutput();
      const lines = stdout.split("\n");
      const timestamp = new Date().toISOString();

      lines.forEach((line) => {
        if (seenLogs.has(line)) return;
        seenLogs.add(line);

        // 🔥 PORT log
        if (line.includes("DPT=")) {
          const portMatch = line.match(/DPT=(\d+)/);
          const port = portMatch ? portMatch[1] : "unknown";
          const logLine = `${timestamp},[PORT:${port}] ${line}\n`;
          fs.appendFileSync(portLogPath, logLine, "utf8");
        }

        // 🧱 FIREWALL log
        if (line.includes("traffic_")) {
          const logLine = `${timestamp},[FIREWALL] ${line}\n`;
          fs.appendFileSync(firewallLogPath, logLine, "utf8");
        }

        // 🔒 MAC log
        if (line.includes("mac_")) {
          const logLine = `${timestamp},[MAC] ${line}\n`;
          fs.appendFileSync(macLogPath, logLine, "utf8");
        }

        // 🌐 DNS sorgu logu
        if (line.includes("dnsmasq") && line.includes("query[")) {
          const match = line.match(/query\[(.*?)\]\s+([^\s]+)\s+from\s+([^\s]+)/);
          if (match) {
            const [, type, domain, sourceIP] = match;
            const normalizedDomain = domain.trim().toLowerCase();
            const isBlocked = blockedDomains.some((blocked) =>
              normalizedDomain === blocked || normalizedDomain.endsWith("." + blocked)
            );
            if (isBlocked) {
              const dnsLogLine = `${timestamp},${sourceIP},${normalizedDomain},${type}\n`;
              fs.appendFileSync(dnsLogPath, dnsLogLine, "utf8");
            }
          }
        }

        // 🚫 DNS blocked yanıt logu
        if (line.includes("dnsmasq") && line.includes("config ")) {
          const match = line.match(/config\s+([^\s]+)\s+is\s+(.+)/);
          if (match) {
            const [, domain, ip] = match;
            const normalizedDomain = domain.trim().toLowerCase();
            const isBlocked = blockedDomains.some((blocked) =>
              normalizedDomain === blocked || normalizedDomain.endsWith("." + blocked)
            );
            if (isBlocked) {
              const logLine = `${timestamp},BLOCKED_RESPONSE,${normalizedDomain},${ip}\n`;
              fs.appendFileSync(dnsLogPath, logLine, "utf8");
            }
          }
        }
      });
    } catch (err) {
      console.error("❌ logread hatası:", err.message);
    }
  }, 5000); // 5 saniyede bir
}

module.exports = startPortLogWatcher;