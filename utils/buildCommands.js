const dns = require('dns').promises;

// 🔥 PORT ENGELLEME KOMUTLARI
function buildPortBlockingCommands({ portRange, protocol }) {
  const zones = ['wan', 'lan'];
  const commands = [];

  zones.forEach((zone) => {
    const ruleName = `block_${protocol}_${portRange.replace(':', '-')}_${zone}_${Date.now()}`;
    commands.push(
      `uci add firewall rule`,
      `uci set firewall.@rule[-1].name='${ruleName}'`,
      `uci set firewall.@rule[-1].src='${zone}'`,
      `uci set firewall.@rule[-1].proto='${protocol.toLowerCase()}'`,
      `uci set firewall.@rule[-1].dest_port='${portRange}'`,
      `uci set firewall.@rule[-1].target='REJECT'`
    );
  });

  commands.push(`uci commit firewall`);
  commands.push(`/etc/init.d/firewall restart`);

  return commands;
}

// 🔥 PORT YÖNLENDİRME KOMUTLARI
function buildPortForwardingCommands({ sourceIP, destinationIP, sourcePort, destinationPort, protocol }) {
  const timestamp = Date.now();
  const interfaces = ['wan', 'lan'];
  const commands = [];

  for (const iface of interfaces) {
    const ruleName = `forward_${iface}_${protocol}_${sourcePort || 'any'}_${destinationPort}_${timestamp}`;

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

// 🔥 MAC ADRESİ KURALLARI KOMUTLARI
function buildMACRulesCommands({ macAddress, action, startTime, endTime }) {
  const timestamp = Date.now();
  const zones = ['lan', 'wan'];
  const commands = [];

  zones.forEach((zone) => {
    const ruleName = `mac_${action}_${zone}_${macAddress.replace(/:/g, '')}_${timestamp}`;
    commands.push(
      `uci add firewall rule`,
      `uci set firewall.@rule[-1].name='${ruleName}'`,
      `uci set firewall.@rule[-1].src='${zone}'`,
      `uci set firewall.@rule[-1].src_mac='${macAddress}'`,
      `uci set firewall.@rule[-1].target='${action === 'allow' ? 'ACCEPT' : 'REJECT'}'`
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

// 🔥 TRAFİK YÖNETİMİ KOMUTLARI
function buildFirewallRulesCommands({ sourceIP, destinationIP, protocol, portRange, action }) {
  const timestamp = Date.now();
  const commands = [];
  const destZones = ['wan', 'lan'];

  destZones.forEach((zone) => {
    const ruleName = `traffic_${action}_${zone}_${sourceIP.replace(/\./g, '-')}_${destinationIP.replace(/\./g, '-')}_${timestamp}`;
    commands.push(
      `uci add firewall rule`,
      `uci set firewall.@rule[-1].name='${ruleName}'`,
      `uci set firewall.@rule[-1].src='lan'`,
      `uci set firewall.@rule[-1].dest='${zone}'`,
      `uci set firewall.@rule[-1].proto='${protocol.toLowerCase()}'`,
      `uci set firewall.@rule[-1].src_ip='${sourceIP}'`,
      `uci set firewall.@rule[-1].dest_ip='${destinationIP}'`,
      `uci set firewall.@rule[-1].dest_port='${portRange}'`,
      `uci set firewall.@rule[-1].target='${action === 'allow' ? 'ACCEPT' : 'REJECT'}'`
    );
  });

  commands.push(`uci commit firewall`);
  commands.push(`/etc/init.d/firewall restart`);

  return commands;
}

// 🔥 ZAMAN BAZLI PORT KURALLARI KOMUTLARI
function buildTimeBasedRulesCommands({ startTime, endTime, protocol, portRange, action }) {
  const zones = ['lan', 'wan'];
  const commands = [];
  const timestamp = Date.now();

  zones.forEach((zone) => {
    const ruleName = `time_${action}_${zone}_${portRange.replace('-', '_')}_${timestamp}`;

    commands.push(
      `uci add firewall rule`,
      `uci set firewall.@rule[-1].name='${ruleName}'`,
      `uci set firewall.@rule[-1].src='${zone}'`,
      `uci set firewall.@rule[-1].dest='wan'`,
      `uci set firewall.@rule[-1].proto='${protocol.toLowerCase()}'`,
      `uci set firewall.@rule[-1].dest_port='${portRange}'`,
      `uci set firewall.@rule[-1].target='${action === 'allow' ? 'ACCEPT' : 'REJECT'}'`,
      `uci set firewall.@rule[-1].start_time='${startTime}'`,
      `uci set firewall.@rule[-1].stop_time='${endTime}'`
    );
  });

  commands.push(`uci commit firewall`);
  commands.push(`/etc/init.d/firewall restart`);

  return commands;
}

// 🔥 DNS/URL ENGELLEME KOMUTLARI
async function buildDNSBlockingCommands({ domainOrURL }) {
  const timestamp = Date.now();
  const commands = [];

  let domain = domainOrURL.trim();
  domain = domain.replace(/^https?:\/\//, '').split('/')[0];

  try {
    const resolvedIPs = await dns.resolve(domain);

    resolvedIPs.forEach((ip, i) => {
      ['icmp', 'tcp'].forEach((protocol) => {
        const ruleName = `dnsblock_${domain.replace(/\./g, '_')}_${protocol}_${i}_${timestamp}`;
        const destPort = protocol === 'tcp' ? "443" : undefined;

        commands.push(`uci add firewall rule`);
        commands.push(`uci set firewall.@rule[-1].name='${ruleName}'`);
        commands.push(`uci set firewall.@rule[-1].src='lan'`);
        commands.push(`uci set firewall.@rule[-1].dest_ip='${ip}'`);
        commands.push(`uci set firewall.@rule[-1].proto='${protocol}'`);
        if (destPort) {
          commands.push(`uci set firewall.@rule[-1].dest_port='${destPort}'`);
        }
        commands.push(`uci set firewall.@rule[-1].target='REJECT'`);
      });
    });

    if (commands.length > 0) {
      commands.push(`uci commit firewall`);
      commands.push(`/etc/init.d/firewall restart`);
    }
  } catch (error) {
    console.error(`❌ DNS çözümleme hatası (${domain}):`, error.message);
  }

  return commands;
}

function buildQoSCommands(rules) {
  const commands = [];

  // Mevcut qdisc silinsin (hata almamak için || true)
  commands.push("tc qdisc del dev br-lan root || true");

  // Root qdisc ekle
  commands.push("tc qdisc add dev br-lan root handle 1: htb default 30");
  commands.push("tc class add dev br-lan parent 1: classid 1:1 htb rate 85000kbit");

  // Her kural için sınıf ve iptables mark ekle
  rules.forEach((rule, index) => {
    const classId = `1:${index + 10}`;
    const mac = rule.macAddress.toLowerCase();
    const bw = rule.bandwidthLimit || "4096"; // varsayılan 4Mbit
    const mark = index + 10;

    // class
    commands.push(`tc class add dev br-lan parent 1:1 classid ${classId} htb rate ${bw}kbit`);

    // iptables - mangle ile işaretleme
    commands.push(`iptables -t mangle -A PREROUTING -m mac --mac-source ${mac} -j MARK --set-mark ${mark}`);

    // class'ı mark ile eşle
    commands.push(`tc filter add dev br-lan protocol ip parent 1:0 prio 1 handle ${mark} fw flowid ${classId}`);
  });

  return commands;
}


// 🌟 EXPORT
module.exports = {
  buildPortBlockingCommands,
  buildPortForwardingCommands,
  buildMACRulesCommands,
  buildFirewallRulesCommands,
  buildTimeBasedRulesCommands,
  buildDNSBlockingCommands,
  buildQoSCommands
};