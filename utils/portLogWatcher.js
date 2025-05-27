const fs = require("fs");
const path = require("path");
const fetchLogreadOutput = require("./logFetcher");
 // burada fetch fonksiyonu kullanılıyor

 const requestLogPath = path.join(__dirname, "../logs/port_blocking_requests_log.csv");
 
function startPortLogWatcher() {
  console.log("📡 portLogWatcher aktif");

  setInterval(async () => {
    try {
      const stdout = await fetchLogreadOutput();
      const lines = stdout.split("\n").filter((line) => line.includes("DPT="));

      lines.forEach((line) => {
        const portMatch = line.match(/DPT=(\d+)/);
        const port = portMatch ? portMatch[1] : "unknown";
        const logLine = `${new Date().toISOString()},[PORT:${port}] ${line}\n`;
        fs.appendFileSync(requestLogPath, logLine, "utf8");
      });
    } catch (err) {
      console.error("❌ logread hatası:", err.message);
    }
  }, 5000); // 5 saniyede bir tarama
}

module.exports = startPortLogWatcher;
