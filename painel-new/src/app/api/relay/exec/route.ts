// app/api/relay/exec/route.ts
import { relayFetch } from '@/lib/relay';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// CORS (preflight)
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const command = String(body?.command || '').trim();

  if (!command) {
    return corsJson({ ok: false, error: 'missing command' }, 400);
  }

  try {
    // Tenta usar painel de produção (VPS) que já tem as configs do Mikrotik
    const vpsBase = process.env.VPS_API_BASE;
    if (vpsBase) {
      console.log('[relay/exec] Usando VPS API:', vpsBase);
      const r = await fetch(`${vpsBase}/api/relay/exec`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });
      const j = await r.json().catch(() => ({}));
      return corsJson(j, r.status);
    }

    // Fallback: relay local (precisa de credenciais Mikrotik)
    const host = process.env.MIKROTIK_HOST || '';
    const user = process.env.MIKROTIK_USER || '';
    const pass = process.env.MIKROTIK_PASS || '';

    if (!host || !user || !pass) {
      return corsJson({ ok: false, error: 'mikrotik env missing' }, 500);
    }

    // Converte comando string em array de sentences para RouterOS API
    const parts = command.trim().split(/\s+/);
    const cmdPath = parts[0];
    const params = parts.slice(1).map(p => p.startsWith('=') ? p : `=${p}`);
    const sentences = [cmdPath, ...params];

    const r = await relayFetch('/relay/exec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host, user, pass, command: sentences }),
    });

    const j = await r.json().catch(() => ({}));
    return corsJson(j, r.status);
  } catch (err) {
    console.error('[relay/exec] Error:', err);
    return corsJson({ ok: false, error: 'relay_unreachable' }, 502);
  }
}

/** Helper p/ JSON + CORS */
function corsJson(payload: any, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
