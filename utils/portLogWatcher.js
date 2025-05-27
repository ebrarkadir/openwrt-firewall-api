const fs = require("fs");
const path = require("path");
const fetchLogreadOutput = require("./logFetcher");

const requestLogPath = path.join(__dirname, "../logs/port_blocking_requests_log.csv");

// 🚨 Klasör kontrol
const logDir = path.dirname(requestLogPath);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const seenLogs = new Set(); // 👈 Daha önce görülen logları burada tutarız

function startPortLogWatcher() {
  console.log("📡 portLogWatcher aktif");

  setInterval(async () => {
    try {
      const stdout = await fetchLogreadOutput();
      const lines = stdout.split("\n").filter((line) => line.includes("DPT="));

      lines.forEach((line) => {
        if (seenLogs.has(line)) return; // 👈 Daha önce yazılmışsa geç

        seenLogs.add(line); // 👈 Yeni satırı ekle
        const portMatch = line.match(/DPT=(\d+)/);
        const port = portMatch ? portMatch[1] : "unknown";
        const logLine = `${new Date().toISOString()},[PORT:${port}] ${line}\n`;
        fs.appendFileSync(requestLogPath, logLine, "utf8");
      });
    } catch (err) {
      console.error("❌ logread hatası:", err.message);
    }
  }, 5000); // her 5 saniyede bir tekrar
}

module.exports = startPortLogWatcher;
