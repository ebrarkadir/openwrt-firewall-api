// buildCommands.js
const dns = require("dns").promises;

// 🔥 PORT ENGELLEME KOMUTLARI
function buildPortBlockingCommands({ portRange, protocol }) {
  const zones = ["wan", "lan"];
  const commands = [];

  zones.forEach((zone) => {
    const ruleName = `block_${protocol}_${portRange.replace(":", "-")}_${zone}_${Date.now()}`;
    commands.push(
      `uci add firewall rule`,
      `uci set firewall.@rule[-1].name='${ruleName}'`,
      `uci set firewall.@rule[-1].src='${zone}'`,
      `uci set firewall.@rule[-1].proto='${protocol.toLowerCase()}'`,
      `uci set firewall.@rule[-1].dest_port='${portRange}'`,
      `uci set firewall.@rule[-1].target='REJECT'`,
      `uci set firewall.@rule[-1].log='1'`,
      `uci set firewall.@rule[-1].log_prefix='BLOCKED_${protocol.toUpperCase()}_${portRange}'`
    );
  });

  commands.push(`uci commit firewall`);
  commands.push(`/etc/init.d/firewall restart`);

  return commands;
}


function buildPortBlockingDeleteCommand(uciKey) {
  return [
    `uci delete firewall.${uciKey}`,
    `uci commit firewall`,
    `/etc/init.d/firewall restart`,
  ];
}

// 🔥 PORT YÖNLENDİRME KOMUTLARI
function buildPortForwardingCommands({
  sourceIP,
  destinationIP,
  sourcePort,
  destinationPort,
  protocol,
}) {
  const timestamp = Date.now();
  const interfaces = ["wan", "lan"];
  const commands = [];

  for (const iface of interfaces) {
    const ruleName = `forward_${iface}_${protocol}_${sourcePort || "any"}_${destinationPort}_${timestamp}`;

    commands.push(
      `uci add firewall redirect`,
      `uci set firewall.@redirect[-1].name='${ruleName}'`,
      `uci set firewall.@redirect[-1].src='${iface}'`,
      `uci set firewall.@redirect[-1].dest='lan'`,
      `uci set firewall.@redirect[-1].proto='${protocol.toLowerCase()}'`,
      `uci set firewall.@redirect[-1].dest_ip='${destinationIP}'`,
      `uci set firewall.@redirect[-1].dest_port='${destinationPort}'`,
      `uci set firewall.@redirect[-1].target='DNAT'`
    );

    if (sourceIP) {
      commands.push(`uci set firewall.@redirect[-1].src_ip='${sourceIP}'`);
    }

    if (sourcePort) {
      commands.push(`uci set firewall.@redirect[-1].src_dport='${sourcePort}'`);
    }
  }

  commands.push(`uci commit firewall`);
  commands.push(`/etc/init.d/firewall restart`);

  return commands;
}

function buildPortForwardingDeleteCommand(uciKey) {
  return [
    `uci delete firewall.${uciKey}`,
    `uci commit firewall`,
    `/etc/init.d/firewall restart`,
  ];
}

// 🔥 MAC ADRESİ KURALLARI KOMUTLARI
function buildMACRulesCommands({ macAddress, action, startTime, endTime }) {
  const timestamp = Date.now();
  const zones = ["lan", "wan"];
  const commands = [];

  zones.forEach((zone) => {
    const ruleName = `mac_${action}_${zone}_${macAddress.replace(/:/g, "")}_${timestamp}`;
    const logPrefix = `MAC_MATCHED_${macAddress.replace(/:/g, "")}`;

    commands.push(
      `uci add firewall rule`,
      `uci set firewall.@rule[-1].proto='all'`,
      `uci set firewall.@rule[-1].name='${ruleName}'`,
      `uci set firewall.@rule[-1].src='${zone}'`,
      `uci set firewall.@rule[-1].src_mac='${macAddress}'`,
      `uci set firewall.@rule[-1].target='${action === "allow" ? "ACCEPT" : "REJECT"}'`,
      `uci set firewall.@rule[-1].log='1'`,
      `uci set firewall.@rule[-1].log_prefix='${logPrefix}'`
    );

    if (startTime && endTime) {
      commands.push(
        `uci set firewall.@rule[-1].start_time='${startTime}'`,
        `uci set firewall.@rule[-1].stop_time='${endTime}'`
      );
    }
  });

  commands.push(`uci commit firewall`);
  commands.push(`/etc/init.d/firewall restart`);

  return commands;
}

function buildMACRulesDeleteCommand(uciKey) {
  return [
    `uci delete firewall.${uciKey}`,
    `uci commit firewall`,
    `/etc/init.d/firewall restart`,
  ];
}

// 🔥 TRAFİK YÖNETİMİ KOMUTLARI
function buildFirewallRulesCommands({
  sourceIP,
  destinationIP,
  protocol,
  portRange,
  action,
}) {
  const timestamp = Date.now();
  const destZones = ["wan", "lan"];
  const commands = [];

  destZones.forEach((zone) => {
    const ruleName = `traffic_${action}_${zone}_${sourceIP.replace(
      /\./g,
      "-"
    )}_${destinationIP.replace(/\./g, "-")}_${timestamp}`;
    const logPrefix = `FIREWALL_MATCHED_${sourceIP}_${destinationIP}`;

    commands.push(
      `uci add firewall rule`,
      `uci set firewall.@rule[-1].name='${ruleName}'`,
      `uci set firewall.@rule[-1].src='lan'`,
      `uci set firewall.@rule[-1].dest='${zone}'`,
      `uci set firewall.@rule[-1].proto='${protocol.toLowerCase()}'`,
      `uci set firewall.@rule[-1].src_ip='${sourceIP}'`,
      `uci set firewall.@rule[-1].dest_ip='${destinationIP}'`,
      `uci set firewall.@rule[-1].dest_port='${portRange}'`,
      `uci set firewall.@rule[-1].target='${
        action === "allow" ? "ACCEPT" : "REJECT"
      }'`,
      `uci set firewall.@rule[-1].log='1'`,
      `uci set firewall.@rule[-1].log_prefix='${logPrefix}'`
    );
  });

  commands.push(`uci commit firewall`);
  commands.push(`/etc/init.d/firewall restart`);

  return commands;
}

function buildFirewallDeleteCommand(uciKey) {
  return [
    `uci delete firewall.${uciKey}`,
    `uci commit firewall`,
    `/etc/init.d/firewall restart`,
  ];
}


// 🔥 ZAMAN BAZLI KURALLAR
function buildTimeBasedRulesCommands({
  startTime,
  endTime,
  protocol,
  portRange,
  action,
}) {
  const zones = ["lan", "wan"];
  const timestamp = Date.now();
  const commands = [];

  zones.forEach((zone) => {
    const ruleName = `time_${action}_${zone}_${portRange.replace(
      "-",
      "_"
    )}_${timestamp}`;
    commands.push(
      `uci add firewall rule`,
      `uci set firewall.@rule[-1].name='${ruleName}'`,
      `uci set firewall.@rule[-1].src='${zone}'`,
      `uci set firewall.@rule[-1].dest='wan'`,
      `uci set firewall.@rule[-1].proto='${protocol.toLowerCase()}'`,
      `uci set firewall.@rule[-1].dest_port='${portRange}'`,
      `uci set firewall.@rule[-1].target='${
        action === "allow" ? "ACCEPT" : "REJECT"
      }'`,
      `uci set firewall.@rule[-1].start_time='${startTime}'`,
      `uci set firewall.@rule[-1].stop_time='${endTime}'`
    );
  });

  commands.push(`uci commit firewall`);
  commands.push(`/etc/init.d/firewall restart`);

  return commands;
}

function buildTimeBasedDeleteCommand(uciKey) {
  // Eğer zaten @rule[3] formatındaysa dokunma
  const formattedKey = uciKey.startsWith("@rule[")
    ? uciKey
    : `@rule[${uciKey}]`;

  return [
    `uci delete firewall.${formattedKey}`,
    `uci commit firewall`,
    `/etc/init.d/firewall restart`,
  ];
}
// 🔥 DNS BLOCK
async function buildDNSBlockingCommands({ domainOrURL }) {
  const sanitizedDomain = domainOrURL
    .trim()
    .replace(/^https?:\/\//, "")
    .split("/")[0];

  const commands = [
    // Kara liste dosyası oluştur
    `mkdir -p /etc/dnsmasq.d`,
    `echo "address=/${sanitizedDomain}/0.0.0.0" >> /etc/dnsmasq.d/blacklist.conf`,
    `echo "address=/${sanitizedDomain}/::" >> /etc/dnsmasq.d/blacklist.conf`,

    // 🔍 DNS sorgularını loglamayı aktif et
    `uci set dhcp.@dnsmasq[0].logqueries='1'`,
    `uci commit dhcp`,

    // dnsmasq servisini yeniden başlat
    `/etc/init.d/dnsmasq restart`,
  ];

  return commands;
}

function buildDNSBlockingDeleteCommand(domain) {
  const sanitizedDomain = domain
    .trim()
    .replace(/^https?:\/\//, "")
    .split("/")[0];

  const commands = [
    `sed -i '/address=\\/${sanitizedDomain}\\//d' /etc/dnsmasq.d/blacklist.conf`,
    `/etc/init.d/dnsmasq restart`,
  ];

  return commands;
}

// buildCommands.js

function buildQoSCommands(rules) {
  const commands = [];

  // ✅ qdisc tanımı eklenmeli, varsa hata vermesin diye || true
  commands.push(`tc qdisc add dev br-lan root handle 1: htb default 30 || true`);

  const priorityMap = {
    high: { classId: "1:10", rate: "40960kbit" },
    medium: { classId: "1:20", rate: "30720kbit" },
    low: { classId: "1:30", rate: "10240kbit" },
  };

  const addedClasses = new Set();

  rules.forEach((rule, index) => {
    const mac = rule.macAddress.toLowerCase();
    const priority = rule.priority || "low";
    const macHex = parseInt(mac.replace(/:/g, ""), 16);
    const mark = (macHex + index) % 65535;

    const { classId, rate } = priorityMap[priority];

    // Sınıfı sadece 1 kez ekle
    if (!addedClasses.has(classId)) {
      commands.push(
        `tc class add dev br-lan parent 1: classid ${classId} htb rate ${rate} ceil ${rate} || true`
      );
      addedClasses.add(classId);
    }

    // iptables kuralı
    commands.push(
      `iptables -t mangle -A PREROUTING -m mac --mac-source ${mac} -j MARK --set-mark ${mark}`
    );

    // tc filter ile sınıfa bağla
    commands.push(
      `tc filter add dev br-lan protocol ip parent 1:0 prio 1 handle ${mark} fw flowid ${classId}`
    );
  });

  return commands;
}

function buildQoSDeleteCommand(mac, mark) {
  const hexMark = Number(mark).toString(16);
  const macLower = mac.toLowerCase();

  return [
    `tc filter delete dev br-lan parent 1:0 handle 0x${hexMark} fw`,
    `iptables -t mangle -D PREROUTING -m mac --mac-source ${macLower} -j MARK --set-xmark 0x${hexMark}/0xffffffff`,
  ];
}





// 🔥 VPN / NAT
function buildVPNRulesCommands(rules) {
  const commands = [];
  const timestamp = Date.now();

  rules.forEach((rule, index) => {
    const ruleName = `${
      rule.ruleType
    }_${rule.protocol.toLowerCase()}_${rule.sourceIP.replace(
      /\./g,
      "_"
    )}_${rule.destinationIP.replace(/\./g, "_")}_${timestamp}_${index}`;

    if (rule.ruleType === "vpn") {
      commands.push(
        `uci add firewall rule`,
        `uci set firewall.@rule[-1].name='${ruleName}'`,
        `uci set firewall.@rule[-1].src='lan'`,
        `uci set firewall.@rule[-1].dest='wan'`,
        `uci set firewall.@rule[-1].proto='${rule.protocol.toLowerCase()}'`,
        `uci set firewall.@rule[-1].src_ip='${rule.sourceIP}'`,
        `uci set firewall.@rule[-1].dest_ip='${rule.destinationIP}'`
      );

      if (rule.portRange) {
        commands.push(
          `uci set firewall.@rule[-1].dest_port='${rule.portRange}'`
        );
      }

      commands.push(`uci set firewall.@rule[-1].target='REJECT'`);
    }

    if (rule.ruleType === "nat") {
      commands.push(
        `uci add firewall redirect`,
        `uci set firewall.@redirect[-1].name='${ruleName}'`,
        `uci set firewall.@redirect[-1].src='wan'`,
        `uci set firewall.@redirect[-1].dest='lan'`,
        `uci set firewall.@redirect[-1].proto='${rule.protocol.toLowerCase()}'`,
        `uci set firewall.@redirect[-1].src_ip='${rule.sourceIP}'`,
        `uci set firewall.@redirect[-1].dest_ip='${rule.destinationIP}'`
      );

      if (rule.portRange) {
        const [fromPort, toPort] = rule.portRange.split("-");
        commands.push(`uci set firewall.@redirect[-1].src_dport='${fromPort}'`);
        commands.push(
          `uci set firewall.@redirect[-1].dest_port='${toPort || fromPort}'`
        );
      }

      commands.push(`uci set firewall.@redirect[-1].target='DNAT'`);
    }
  });

  commands.push("uci commit firewall");
  commands.push("/etc/init.d/firewall restart");

  return commands;
}

module.exports = {
  buildPortBlockingCommands,
  buildPortBlockingDeleteCommand,
  buildPortForwardingCommands,
  buildPortForwardingDeleteCommand,
  buildMACRulesCommands,
  buildFirewallRulesCommands,
  buildFirewallDeleteCommand,
  buildTimeBasedRulesCommands,
  buildTimeBasedDeleteCommand,
  buildDNSBlockingCommands,
  buildQoSCommands,
  buildVPNRulesCommands,
  buildMACRulesDeleteCommand,
  buildQoSDeleteCommand,
  buildDNSBlockingDeleteCommand
};
