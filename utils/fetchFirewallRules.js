const { Client } = require("ssh2");

function fetchFirewallRules(callback) {
  const conn = new Client();
  let output = "";

  conn
    .on("ready", () => {
      console.log("✅ SSH bağlantısı başarılı (fetch)");
      conn.exec("uci show firewall", (err, stream) => {
        if (err) throw err;

        stream
          .on("close", () => {
            console.log("toplanan veri:", output);
            conn.end();
            callback(null, output); // işlemi dışarıya aktar
          })
          .on("data", (data) => {
            output += data.toString();
          })
          .stderr.on("data", (data) => {
            console.error("❌ Hata (stderr):", data.toString());
          });
      });

    })
    .on("error", (err) => {
      console.error("❌ SSH bağlantı hatası (fetch):", err.message);
      callback(err, null);
    })
    .connect({
      host: process.env.OPENWRT_HOST,
      port: process.env.OPENWRT_PORT || 22,
      username: process.env.OPENWRT_USER,
      password: process.env.OPENWRT_PASS,
    });
}

module.exports = fetchFirewallRules;
