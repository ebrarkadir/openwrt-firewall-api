const { Client } = require('ssh2');

async function sendToOpenWRT(commands) {
  const conn = new Client();

  conn
    .on('ready', async () => {
      console.log('✅ SSH bağlantısı başarılı!');

      for (const cmd of commands) {
        console.log('🚀 Komut gönderiliyor:', cmd); // 👈 yeni eklendi

        await new Promise((resolve, reject) => {
          conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);

            stream
              .on('close', () => resolve())
              .on('data', (data) => console.log('📥 stdout:', data.toString()))
              .stderr.on('data', (data) => console.error('❌ stderr:', data.toString()));
          });
        });
      }

      console.log('🔒 SSH bağlantısı kapatıldı.');
      conn.end();
    })
    .on('error', (err) => {
      console.error('❌ SSH bağlantı hatası:', err.message);
    })
    .connect({
      host: process.env.OPENWRT_HOST,
      port: process.env.OPENWRT_PORT || 22,
      username: process.env.OPENWRT_USER,
      password: process.env.OPENWRT_PASS,
    });
}

module.exports = sendToOpenWRT;
