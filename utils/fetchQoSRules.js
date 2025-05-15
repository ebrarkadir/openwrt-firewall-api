const { Client } = require("ssh2");

function fetchQoSRules(callback) {
  const conn = new Client();
  let output = "";

  conn
    .on("ready", () => {
      console.log("✅ SSH bağlantısı başarılı (fetchQoSRules)");

      conn.exec("iptables -t mangle -S && echo '====' && tc filter show dev br-lan", (err, stream) => {

        if (err) return callback(err);

        stream
          .on("close", () => {
            console.log("📥 Toplanan QoS verisi:", output);
            conn.end();
            callback(null, output);
          })
          .on("data", (data) => {
            output += data.toString();
          })
          .stderr.on("data", (data) => {
            console.error("❌ QoS stderr:", data.toString());
          });
      });
    })
    .on("error", (err) => {
      console.error("❌ SSH bağlantı hatası (QoS fetch):", err.message);
      callback(err, null);
    })
    .connect({
      host: process.env.OPENWRT_HOST,
      port: process.env.OPENWRT_PORT || 22,
      username: process.env.OPENWRT_USER,
      password: process.env.OPENWRT_PASS,
    });
}

module.exports = fetchQoSRules;
