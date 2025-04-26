// 🔥 PORT ENGELLEME KOMUTLARI
function buildPortBlockingCommands({ portRange, protocol }) {
  const zones = ['wan', 'lan']; // Hem WAN hem LAN için kurallar oluşturulacak
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
  const ruleName = `mac_${action}_${macAddress.replace(/:/g, '')}_${Date.now()}`;
  const commands = [];

  commands.push(
    `uci add firewall rule`,
    `uci set firewall.@rule[-1].name='${ruleName}'`,
    `uci set firewall.@rule[-1].src='lan'`,
    `uci set firewall.@rule[-1].src_mac='${macAddress}'`,
    `uci set firewall.@rule[-1].target='${action === 'allow' ? 'ACCEPT' : 'REJECT'}'`
  );

  // Eğer başlangıç ve bitiş saati girilmişse zaman kısıtlaması ekle
  if (startTime && endTime) {
    commands.push(
      `uci set firewall.@rule[-1].start_time='${startTime}'`,
      `uci set firewall.@rule[-1].stop_time='${endTime}'`
    );
  }

  commands.push(`uci commit firewall`);
  commands.push(`/etc/init.d/firewall restart`);

  return commands;
}

// 🌟 EXPORTLAR
module.exports = {
  buildPortBlockingCommands,
  buildPortForwardingCommands,
  buildMACRulesCommands,
};
