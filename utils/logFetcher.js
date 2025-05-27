const { Client } = require("ssh2");

function fetchLogreadOutput() {
  return new Promise((resolve, reject) => {
    const conn = new Client();

    conn
      .on("ready", () => {
        conn.exec("logread", (err, stream) => {
          if (err) {
            conn.end();
            return reject(err);
          }

          let output = "";
          stream
            .on("data", (data) => {
              output += data.toString();
            })
            .on("close", () => {
              conn.end();
              resolve(output);
            });
        });
      })
      .on("error", (err) => {
        reject(err);
      })
      .connect({
        host: process.env.OPENWRT_HOST,
        port: process.env.OPENWRT_PORT || 22,
        username: process.env.OPENWRT_USER,
        password: process.env.OPENWRT_PASS,
      });
  });
}

module.exports = fetchLogreadOutput; // ❗ default export
