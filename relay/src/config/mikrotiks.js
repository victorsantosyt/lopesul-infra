// src/config/mikrotiks.js

// Exemplo de formato vindo do .env:
// MIKROTIK_NODES='[{"id":"LOPESUL-HOTSPOT-06","host":"10.200.200.6","user":"relay","pass":"api2025","port":8728}]'

export const mikrotikNodes = JSON.parse(
  process.env.MIKROTIK_NODES ||
    `[
      {
        "id": "LOPESUL-HOTSPOT-06",
        "host": "10.200.200.6",
        "user": "relay",
        "pass": "api2025",
        "port": 8728,
        "timeoutMs": 8000
      }
    ]`
);

export function getMikById(mikId) {
  const node = mikrotikNodes.find((m) => m.id === mikId);
  if (!node) {
    throw new Error(`Mikrotik com mikId=${mikId} não encontrado em MIKROTIK_NODES`);
  }
  return node;
}
