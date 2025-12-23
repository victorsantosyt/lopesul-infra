// src/config/mikrotiks.js

// Exemplo de formato esperado no .env:
// MIKROTIK_NODES='[{"id":"HOTSPOT-01","host":"10.200.1.10","user":"relay","pass":"<senha>","port":8728}]'

if (!process.env.MIKROTIK_NODES) {
  throw new Error('MIKROTIK_NODES env is required (JSON array with id/host/user/pass/port)');
}

let parsed = [];
try {
  parsed = JSON.parse(process.env.MIKROTIK_NODES);
} catch (e) {
  throw new Error('Invalid MIKROTIK_NODES JSON');
}

export const mikrotikNodes = parsed;

export function getMikById(mikId) {
  const node = mikrotikNodes.find((m) => m.id === mikId);
  if (!node) {
    throw new Error(`Mikrotik com mikId=${mikId} não encontrado em MIKROTIK_NODES`);
  }
  return node;
}
