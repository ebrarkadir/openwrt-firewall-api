function buildPortBlockingCommands({ portRange, protocol }) {
  const ruleName = `block_${protocol}_${portRange.replace(':', '-')}_${Date.now()}`;
  return [
    `uci add firewall rule`,
    `uci set firewall.@rule[-1].name='${ruleName}'`,
    `uci set firewall.@rule[-1].src='wan'`,
    `uci set firewall.@rule[-1].proto='${protocol.toLowerCase()}'`,
    `uci set firewall.@rule[-1].dest_port='${portRange}'`,
    `uci set firewall.@rule[-1].target='REJECT'`,
    `uci commit firewall`,
    `/etc/init.d/firewall restart`,
  ];
}

function buildPortForwardingCommands({ sourceIP, destIP, sourcePort, destPort, protocol }) {
  const ruleName = `forward_${protocol}_${sourcePort || 'any'}_${destPort}_${Date.now()}`;

  const commands = [
    `uci add firewall redirect`,
    `uci set firewall.@redirect[-1].name='${ruleName}'`,
    `uci set firewall.@redirect[-1].src='wan'`,
    `uci set firewall.@redirect[-1].dest='lan'`,
    `uci set firewall.@redirect[-1].proto='${protocol.toLowerCase()}'`,
    `uci set firewall.@redirect[-1].dest_ip='${destIP}'`,
    `uci set firewall.@redirect[-1].dest_port='${destPort}'`,
    `uci set firewall.@redirect[-1].target='DNAT'`,
  ];

  if (sourceIP) {
    commands.push(`uci set firewall.@redirect[-1].src_ip='${sourceIP}'`);
  }

  if (sourcePort) {
    commands.push(`uci set firewall.@redirect[-1].src_dport='${sourcePort}'`);
  }

  commands.push(`uci commit firewall`);
  commands.push(`/etc/init.d/firewall restart`);

  return commands;
}

module.exports = {
  buildPortBlockingCommands,
  buildPortForwardingCommands,
};
