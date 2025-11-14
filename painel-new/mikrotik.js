// src/lib/mikrotik.js

async function executeCommand(commandArray) {
  const relayUrl = process.env.RELAY_URL || process.env.RELAY_BASE || 'http://localhost:3001';
  const relayToken = process.env.RELAY_TOKEN;
  
  if (!relayToken) {
    throw new Error('RELAY_TOKEN não configurado');
  }
  
  // Usa /relay/exec2 que aceita sentences como array
  const response = await fetch(`${relayUrl}/relay/exec2`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${relayToken}`
    },
    body: JSON.stringify({ sentences: commandArray })
  });
  
  if (!response.ok) {
    throw new Error(`Relay HTTP ${response.status}`);
  }
  
  const result = await response.json();
  
  if (!result.ok) {
    throw new Error(result.error || 'Comando falhou');
  }
  
  return result.data;
}

/** ============================
 * PING TESTE
 * ============================ */
export async function getStarlinkStatus() {
  try {
    const pingTarget = process.env.STARLINK_PING_TARGET || "1.1.1.1";
    const data = await executeCommand(`/ping address=${pingTarget} count=3`);
    
    const dataStr = JSON.stringify(data);
    const match = dataStr.match(/time=(\d+(?:\.\d+)?)ms/);
    const rtt = match ? parseFloat(match[1]) : null;

    return { ok: true, connected: true, rtt_ms: rtt };
  } catch (err) {
    console.error("[MIKROTIK] ping error:", err.message);
    return { ok: false, error: err.message };
  }
}

/** ============================
 * LISTA SESSÕES PPP
 * ============================ */
export async function listPppActive() {
  try {
    const data = await executeCommand("/ppp/active/print");
    return { ok: true, data };
  } catch (err) {
    console.error("[MIKROTIK] list error:", err.message);
    return { ok: false, error: err.message };
  }
}

/** ============================
 * LIBERAR ACESSO
 * ============================ */
export async function liberarAcesso({ ip, mac, username, comment = "painel" } = {}) {
  console.log('[liberarAcesso] Iniciando:', { ip, mac, username, comment });
  
  try {
    const cmds = [];
    
    if (ip) {
      const cmd = ['/ip/firewall/address-list/add', `=list=paid_clients`, `=address=${ip}`, `=comment=${comment}`];
      cmds.push(cmd.join(' '));
      console.log('[liberarAcesso] Executando:', cmd);
      await executeCommand(cmd);
      console.log('[liberarAcesso] IP adicionado com sucesso!');
    }
    
    if (mac) {
      const cmd = ['/interface/wireless/access-list/add', `=mac-address=${mac}`, `=comment=${comment}`];
      cmds.push(cmd.join(' '));
      console.log('[liberarAcesso] Executando:', cmd);
      await executeCommand(cmd);
      console.log('[liberarAcesso] MAC adicionado com sucesso!');
    }
    
    if (username) {
      const cmd = `/ip/hotspot/user/add name=${username} password=${username}`;
      cmds.push(cmd);
      console.log('[liberarAcesso] Executando:', cmd);
      await executeCommand(cmd);
      console.log('[liberarAcesso] Usuário criado com sucesso!');
    }

    return { ok: true, cmds };
  } catch (err) {
    console.error("[liberarAcesso] Erro:", err.message);
    return { ok: false, error: err.message };
  }
}

/** ============================
 * REVOGAR ACESSO
 * ============================ */
export async function revogarAcesso({ ip, mac, username } = {}) {
  console.log('[revogarAcesso] Iniciando:', { ip, mac, username });
  
  try {
    const cmds = [];
    
    if (ip) {
      const cmd = `/ip/firewall/address-list/remove [find address=${ip}]`;
      cmds.push(cmd);
      await executeCommand(cmd);
    }
    
    if (mac) {
      const cmd = `/interface/wireless/access-list/remove [find mac-address=${mac}]`;
      cmds.push(cmd);
      await executeCommand(cmd);
    }
    
    if (username) {
      const cmd = `/ip/hotspot/user/remove [find name=${username}]`;
      cmds.push(cmd);
      await executeCommand(cmd);
    }

    return { ok: true, cmds };
  } catch (err) {
    console.error("[revogarAcesso] Erro:", err.message);
    return { ok: false, error: err.message };
  }
}

/** ============================
 * ALIÁS/COMPAT: nomes usados em outras partes do app
 * ============================ */
export const liberarCliente = liberarAcesso;
export const revogarCliente = revogarAcesso;

// Usado pelo webhook: aceita "minutos" e cria usuário hotspot
export async function liberarClienteNoMikrotik({ ip, mac, busId, minutos } = {}) {
  console.log('[liberarClienteNoMikrotik] Iniciando:', { ip, mac, minutos });
  
  if (!mac) {
    console.error('[liberarClienteNoMikrotik] MAC ausente!');
    return { ok: false, error: 'MAC ausente' };
  }
  
  const username = `user-${mac.replace(/:/g, '').toUpperCase()}`;
  const password = Math.random().toString(36).substring(2, 10);
  const profile = 'hotspot-lopesul';
  const limitUptime = minutos ? `${minutos}m` : '2h';
  
  console.log('[liberarClienteNoMikrotik] Criando usuário hotspot:', { username, profile, limitUptime });
  
  try {
    // Passo 1: Criar o usuário hotspot
    const createUserCmd = `/ip/hotspot/user/add name=${username} password=${password} profile=${profile} limit-uptime=${limitUptime} comment="${mac} - paid"`;
    console.log('[liberarClienteNoMikrotik] 1/2 Criando usuário:', createUserCmd);
    await executeCommand(createUserCmd);
    console.log('[liberarClienteNoMikrotik] Usuário criado com sucesso!');
    
    // Passo 2: Autenticar o cliente no hotspot (adicionar à sessão ativa)
    if (ip && mac) {
      const loginCmd = `/ip/hotspot/active/add server=hotspot1 user=${username} address=${ip} mac-address=${mac}`;
      console.log('[liberarClienteNoMikrotik] 2/2 Autenticando cliente:', loginCmd);
      try {
        await executeCommand(loginCmd);
        console.log('[liberarClienteNoMikrotik] Cliente autenticado no hotspot! Acesso liberado.');
      } catch (loginError) {
        // Se já existir sessão ativa, tenta remover e adicionar novamente
        console.warn('[liberarClienteNoMikrotik] Erro ao autenticar, tentando remover sessão antiga:', loginError.message);
        try {
          await executeCommand(`/ip/hotspot/active/remove [find mac-address=${mac}]`);
          await executeCommand(loginCmd);
          console.log('[liberarClienteNoMikrotik] Cliente re-autenticado com sucesso!');
        } catch (retryError) {
          console.error('[liberarClienteNoMikrotik] Falha ao re-autenticar:', retryError.message);
        }
      }
    } else {
      console.warn('[liberarClienteNoMikrotik] IP ou MAC ausente, não foi possível autenticar automaticamente.');
    }
    
    return { ok: true, username, password };
  } catch (apiError) {
    console.error('[liberarClienteNoMikrotik] Erro:', apiError.message);
    return { ok: false, error: apiError.message };
  }
}

export default {
  getStarlinkStatus,
  listPppActive,
  liberarAcesso,
  revogarAcesso,
  liberarCliente,
  revogarCliente,
  liberarClienteNoMikrotik,
};
