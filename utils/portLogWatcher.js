const fs = require("fs");
const path = require("path");
const fetchLogreadOutput = require("./logFetcher");

const portLogPath = path.join(__dirname, "../logs/port_blocking_requests_log.csv");
const firewallLogPath = path.join(__dirname, "../logs/firewall_requests_log.csv");

const ensureDirExists = (filePath) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

ensureDirExists(portLogPath);
ensureDirExists(firewallLogPath);

const seenLogs = new Set();

function startPortLogWatcher() {
  console.log("📡 portLogWatcher aktif");

  setInterval(async () => {
    try {
      const stdout = await fetchLogreadOutput();
      const lines = stdout.split("\n");

      lines.forEach((line) => {
        if (seenLogs.has(line)) return;
        seenLogs.add(line);

        const timestamp = new Date().toISOString();

        // 🔎 Port engelleme loglarını yaz
        if (line.includes("DPT=")) {
          const portMatch = line.match(/DPT=(\d+)/);
          const port = portMatch ? portMatch[1] : "unknown";
          const logLine = `${timestamp},[PORT:${port}] ${line}\n`;
          fs.appendFileSync(portLogPath, logLine, "utf8");
        }

        // 🔎 Trafik yönetimi (firewall) loglarını yaz
        if (line.includes("traffic_")) {
          const logLine = `${timestamp},[FIREWALL] ${line}\n`;
          fs.appendFileSync(firewallLogPath, logLine, "utf8");
        }

        // 🔄 İleride buraya başka kurallar da ekleyebiliriz (dns_, mac_, qos_...)
      });
    } catch (err) {
      console.error("❌ logread hatası:", err.message);
    }
  }, 5000);
}

module.exports = startPortLogWatcher;