function buildLogCommandsForPortBlocking({ portRange, protocol }) {
    if (!portRange || !protocol) return [];
  
    const logCommands = [];
    const ports = portRange.includes(":")
      ? portRange.split(":")
      : [portRange];
  
    ports.forEach((port) => {
      logCommands.push(
        `iptables -A INPUT -p ${protocol.toLowerCase()} --dport ${port} -j LOG --log-prefix "BLOCKED_PORT_${port} "`
      );
    });
  
    return logCommands;
  }
  
  module.exports = { buildLogCommandsForPortBlocking };
  