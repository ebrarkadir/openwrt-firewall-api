const fs = require("fs");
const path = require("path");
const fetchLogreadOutput = require("./logFetcher");

// 📁 Log dosya yolları
const portLogPath = path.join(__dirname, "../logs/port_blocking_requests_log.csv");
const firewallLogPath = path.join(__dirname, "../logs/firewall_requests_log.csv");
const dnsLogPath = path.join(__dirname, "../logs/dns_requests_log.csv");
const macLogPath = path.join(__dirname, "../logs/mac_requests_log.csv");

// 👮‍♂️ Engellenmiş domainler
const blockedDomains = ["facebook.com", "www.facebook.com", "instagram.com"];

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

// 🔁 Görülen logları hatırla
const seenLogs = new Set();

function startPortLogWatcher() {
  console.log("📡 portLogWatcher aktif");

  setInterval(async () => {
    try {
      const stdout = await fetchLogreadOutput();
      const lines = stdout.split("\n");
      const timestamp = new Date().toISOString();

      lines.forEach((line) => {
        if (seenLogs.has(line)) return;
        seenLogs.add(line);

        // 🔥 PORT engelleme
        if (line.includes("DPT=")) {
          const portMatch = line.match(/DPT=(\d+)/);
          const port = portMatch ? portMatch[1] : "unknown";
          const logLine = `${timestamp},[PORT:${port}] ${line}\n`;
          fs.appendFileSync(portLogPath, logLine, "utf8");
        }

        // 🔥 FIREWALL trafik
        if (line.includes("traffic_")) {
          const logLine = `${timestamp},[FIREWALL] ${line}\n`;
          fs.appendFileSync(firewallLogPath, logLine, "utf8");
        }

        // 🔒 MAC engelleme
        if (line.includes("mac_")) {
          const logLine = `${timestamp},[MAC] ${line}\n`;
          fs.appendFileSync(macLogPath, logLine, "utf8");
        }

        // 🌐 DNS query
        if (line.includes("dnsmasq") && line.includes("query[")) {
          const match = line.match(/query\[(.*?)\] ([^\s]+) from ([^\s]+)/);
          if (match) {
            const [, type, domain, sourceIP] = match;
            if (blockedDomains.includes(domain)) {
              const dnsLogLine = `${timestamp},${sourceIP},${domain},${type}\n`;
              fs.appendFileSync(dnsLogPath, dnsLogLine, "utf8");
            }
          }
        }

        // 🧱 DNS blok
        if (line.includes("dnsmasq") && line.includes("config ")) {
          const match = line.match(/config ([^\s]+) is (.+)/);
          if (match) {
            const [, domain, ip] = match;
            if (blockedDomains.includes(domain)) {
              const logLine = `${timestamp},BLOCKED_RESPONSE,${domain},${ip}\n`;
              fs.appendFileSync(dnsLogPath, logLine, "utf8");
            }
          }
        }
      });
    } catch (err) {
      console.error("❌ logread hatası:", err.message);
    }
  }, 5000); // her 5 saniyede bir kontrol
}

module.exports = startPortLogWatcher;