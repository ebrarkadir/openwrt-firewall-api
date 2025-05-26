[🖥️ ShieldWrt UI (React Arayüzü)](https://github.com/ebrarkadir/react-firewall-ui)
# 🔧 OpenWRT Firewall API

🇹🇷 **OpenWRT Firewall API**, OpenWRT kurulu bir cihaz (örneğin Raspberry Pi) üzerinde çalışan bir firewall'ı uzaktan yönetmek için geliştirilmiş bir Node.js + Express API servisidir.  
Bu API sayesinde DNS engelleme, MAC filtreleme, port yönlendirme, trafik önceliklendirme ve zaman bazlı erişim gibi işlemler tek tıklamayla uygulanabilir.

🇬🇧 **OpenWRT Firewall API** is a Node.js + Express-based backend service developed to remotely manage a firewall running on an OpenWRT device (e.g., Raspberry Pi).  
With this API, users can block DNS, filter by MAC, forward ports, prioritize traffic, and define time-based access rules with ease.

---

## 🚀 Özellikler / Features

- 🔐 SSH ile OpenWRT cihazına bağlanarak kural uygulama  
  SSH-based communication with OpenWRT to apply rules
- 🌐 React UI arayüzüyle entegre çalışır  
  Integrates with a separate React-based frontend
- 📊 CSV loglama ile tüm gönderilen kuralları kaydeder  
  Logs all rule submissions to CSV files
- 🧱 7 farklı kural tipi desteği  
  Supports 7 different rule types
- 🔄 JSON veri alışverişi  
  JSON-based RESTful communication

---

## ⚙️ Kullanılan Teknolojiler / Technologies Used

- 🟢 Node.js  
- ⚡ Express.js  
- 🔐 ssh2 (OpenWRT bağlantısı için / SSH communication)  
- 📁 dotenv  
- 📄 fs (loglama için / for logging)  
- 🔀 cors, body-parser

---

## 📁 API Endpoint Listesi / Endpoint Overview

| Method | Endpoint                                  | Açıklama (TR)                             | Description (EN)                             |
|--------|-------------------------------------------|-------------------------------------------|----------------------------------------------|
| POST   | /api/dnsblocking/rules                    | DNS kuralı ekle                           | Add DNS block rule                           |
| GET    | /api/dnsblocking/rules                    | DNS kurallarını getir                     | Get active DNS block rules                   |
| DELETE | /api/dnsblocking/rules/:domain            | DNS kuralını sil                          | Delete a DNS rule                            |
| POST   | /api/qos/rules                            | QoS kuralı gönder                         | Submit QoS rule                              |
| GET    | /api/qos/rules                            | QoS kurallarını getir                     | Get QoS rules                                 |
| DELETE | /api/qos/rules                            | QoS kuralı sil                            | Delete a QoS rule                             |
| POST   | /api/firewall/rules                       | Genel firewall kuralı gönder              | Submit general firewall rule                 |
| GET    | /api/firewall/rules                       | Genel firewall kurallarını getir          | Get general firewall rules                   |
| DELETE | /api/firewall/rules/:uciKey               | Genel firewall kuralını sil               | Delete general firewall rule                 |
| POST   | /api/portblocking/rules                   | Port engelleme kuralı gönder              | Submit port blocking rule                    |
| GET    | /api/portblocking/rules                   | Port engelleme kurallarını getir          | Get port block rules                         |
| DELETE | /api/portblocking/rules/:uciKey           | Port engelleme kuralını sil               | Delete port block rule                       |
| POST   | /api/portforwarding/rules                 | Port yönlendirme ekle                     | Add port forwarding rule                     |
| GET    | /api/portforwarding/rules                 | Port yönlendirme kurallarını getir        | Get port forwarding rules                    |
| DELETE | /api/portforwarding/rules/:uciKey         | Port yönlendirme sil                      | Delete port forwarding rule                  |
| POST   | /api/macrouting/rules                     | MAC bazlı kural ekle                      | Add MAC-based rule                           |
| GET    | /api/macrouting/rules                     | MAC kurallarını getir                     | Get MAC rules                                |
| DELETE | /api/macrouting/rules/:uciKey             | MAC kuralı sil                            | Delete MAC rule                              |
| POST   | /api/timebased/rules                      | Zaman bazlı kural ekle                    | Add time-based rule                          |
| GET    | /api/timebased/rules                      | Zaman bazlı kuralları getir               | Get time-based rules                         |
| DELETE | /api/timebased/rules/:uciKey              | Zaman bazlı kuralı sil                    | Delete time-based rule                       |

---

## 🗂️ Loglama / Logging

Her başarılı `POST` işleminde ilgili kural aşağıdaki CSV dosyalarına kaydedilir:  
Each successful `POST` is logged into one of the following CSV files:

- `logs/dns_rules_log.csv`
- `logs/qos_rules_log.csv`
- `logs/firewall_log.csv`
- `logs/mac_rules_log.csv`
- `logs/port_blocking_log.csv`
- `logs/port_forwarding_log.csv`
- `logs/time_based_log.csv`

---

## 📦 Kurulum / Installation

```bash
git clone https://github.com/ebrarkadir/openwrt-firewall-api.git
cd openwrt-firewall-api
npm install
node server.js
