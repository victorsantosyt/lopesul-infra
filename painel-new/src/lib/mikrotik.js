// src/lib/mikrotik.js

async function executeCommand(commandInput) {
  const relayBase = (process.env.RELAY_URL || process.env.RELAY_BASE || '').replace(/\/+$/, '');
  const relayToken = process.env.RELAY_TOKEN || '';
  const vpsApiBase = (process.env.VPS_API_BASE || '').replace(/\/+$/, ''); // ex: https://api.67-211-212-18.sslip.io
  
  console.log('[executeCommand] Config:', { relayBase, hasToken: !!relayToken, vpsApiBase, command: String(commandInput).substring(0, 80) });

  // Normaliza comando para string e para array de sentences
  const asString = Array.isArray(commandInput) ? commandInput.join(' ') : String(commandInput || '').trim();
  const asArray  = Array.isArray(commandInput) ? commandInput : [asString];

  // 1) Tenta relay/exec2 (suporta sentences) se RELAY_* estiver configurado
  if (relayBase) {
    try {
      const r1 = await fetch(`${relayBase}/relay/exec2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(relayToken ? { 'Authorization': `Bearer ${relayToken}` } : {}),
        },
        body: JSON.stringify({ sentences: asArray })
      });
      if (r1.ok) {
        const j1 = await r1.json().catch(() => ({}));
        if (j1 && j1.ok) return j1.data;
      }
    } catch {}

    // 2) Fallback: relay/exec com comando único
    try {
      const r2 = await fetch(`${relayBase}/relay/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(relayToken ? { 'Authorization': `Bearer ${relayToken}` } : {}),
        },
        body: JSON.stringify({ command: asString })
      });
      if (r2.ok) {
        const j2 = await r2.json().catch(() => ({}));
        if (j2 && j2.ok) return j2.data;
      }
    } catch {}
  }

  // 3) Último fallback: chamar a API do painel na VPS (/api/relay/exec),
  // passando credenciais completas do Mikrotik
  if (vpsApiBase) {
    try {
      // O painel da VPS já tem as configs do Mikrotik,
      // então só precisamos enviar o comando completo como string
      const payload = {
        command: asString  // Comando completo: "/ip/hotspot/user/add name=X password=Y..."
      };
      
      console.log('[executeCommand] Chamando VPS API:', { url: `${vpsApiBase}/api/relay/exec`, command: asString.substring(0, 80) });

      // Desabilita verificação SSL para sslip.io (certificado self-signed)
      const https = await import('https');
      const agent = new https.Agent({ rejectUnauthorized: false });
      
      const r3 = await fetch(`${vpsApiBase}/api/relay/exec`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        agent
      });
      
      console.log('[executeCommand] VPS API response:', { status: r3.status, ok: r3.ok });
      
      if (!r3.ok) {
        const t = await r3.text().catch(() => '');
        console.error('[executeCommand] VPS API error response:', t.substring(0, 200));
        throw new Error(`Relay HTTP ${r3.status}: ${t.substring(0, 100)}`);
      }
      const j3 = await r3.json().catch(() => ({}));
      console.log('[executeCommand] VPS API result:', { ok: j3?.ok, error: j3?.error, hasData: !!j3?.data });
      
      if (!j3 || !j3.ok) throw new Error(j3?.error || 'Comando falhou');
      return j3.data;
    } catch (vpsError) {
      console.error('[executeCommand] VPS API exception:', vpsError.message);
      throw vpsError;
    }
  }

  throw new Error('Relay indisponível: configure VPS_API_BASE ou RELAY_URL');
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
  const profile = 'default';  // Usando profile default (relay user tem permissão)
  const limitUptime = minutos ? `${minutos}m` : '2h';
  
  console.log('[liberarClienteNoMikrotik] Criando usuário hotspot:', { username, profile, limitUptime });
  
  try {
    // Criar o usuário hotspot
    // NOTA: limit-uptime e comment removidos (RouterOS API tem problema com parâmetros com espaços/aspas via relay)
    const createUserCmd = `/ip/hotspot/user/add name=${username} password=${password} profile=${profile}`;
    console.log('[liberarClienteNoMikrotik] Criando usuário:', createUserCmd);
    await executeCommand(createUserCmd);
    console.log('[liberarClienteNoMikrotik] Usuário criado com sucesso!');
    console.log('[liberarClienteNoMikrotik] O cliente deve fazer login manualmente com:', { username, password });
    console.log('[liberarClienteNoMikrotik] Ou você pode usar ip-binding para bypass automático.');
    
    // NOTA: /ip/hotspot/active é READ-ONLY. Sessões são criadas automaticamente no login.
    // Se precisar de acesso automático sem login, use /ip/hotspot/ip-binding com type=bypassed
    
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
