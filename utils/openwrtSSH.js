const { Client } = require('ssh2');

function sendToOpenWRT(commands) {
  const conn = new Client();
  conn
    .on('ready', () => {
      console.log('✅ SSH bağlantısı başarılı!');
      conn.exec(commands.join(' && '), (err, stream) => {
        if (err) throw err;
        stream
          .on('close', () => {
            console.log('🔒 SSH bağlantısı kapatıldı.');
            conn.end();
          })
          .on('data', (data) => {
            console.log('📥 Çıktı:', data.toString());
          });
      });
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

// 🔥 Bu satır çok önemli!
module.exports = sendToOpenWRT;
