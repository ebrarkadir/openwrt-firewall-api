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
  
  module.exports = {
    buildPortBlockingCommands,
  };
  