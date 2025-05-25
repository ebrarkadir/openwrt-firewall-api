const { Client } = require("ssh2");

function fetchDnsRules() {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let output = "";

    conn
      .on("ready", () => {
        conn.exec("cat /etc/dnsmasq.d/blacklist.conf", (err, stream) => {
          if (err) return reject(new Error("SSH exec hatası"));

          stream
            .on("close", () => {
              const lines = output
                .split("\n")
                .map((l) => l.trim())
                .filter((l) => l.startsWith("address=/"));

              const domains = lines.map((line) => {
                const match = line.match(/^address=\/([^/]+)\//);
                return match ? match[1] : null;
              }).filter(Boolean);

              const uniqueDomains = [...new Set(domains)];
              resolve(uniqueDomains);
              conn.end();
            })
            .on("data", (data) => {
              output += data.toString();
            })
            .stderr.on("data", (data) => {
              console.error("❌ stderr:", data.toString());
            });
        });
      })
      .on("error", (err) => {
        reject(new Error("SSH bağlantı hatası: " + err.message));
      })
      .connect({
        host: process.env.OPENWRT_HOST,
        port: process.env.OPENWRT_PORT || 22,
        username: process.env.OPENWRT_USER,
        password: process.env.OPENWRT_PASS,
      });
  });
}

module.exports = fetchDnsRules;