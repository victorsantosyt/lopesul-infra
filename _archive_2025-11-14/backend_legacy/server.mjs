import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3100);

// CORS estrito (alinha com teu front)
const ALLOWED = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(express.json());
app.use(cors({
  origin(origin, cb) {
    if (!origin || ALLOWED.length === 0 || ALLOWED.includes(origin)) return cb(null, true);
    return cb(new Error('CORS blocked'), false);
  }
}));

// Health simples
app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'backend', now: new Date().toISOString() });
});

// Exemplo de endpoint que chamaria o Relay com Bearer (placeholder)
app.get('/v1/ping-relay', async (req, res) => {
  try {
    const base = (process.env.RELAY_BASE || '').replace(/\/+$/, '');
    const token = (process.env.RELAY_TOKEN || '').trim();
    if (!base || !token) return res.status(500).json({ ok:false, error:'relay-not-configured' });

    const r = await fetch(`${base}/health`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const json = await r.json().catch(() => ({}));
    res.json({ ok: true, relay: json });
  } catch (e) {
    res.status(502).json({ ok:false, error:String(e.message||e) });
  }
});

app.use((req, res) => res.status(404).json({ ok:false, error:'not-found' }));

app.listen(PORT, () => {
  console.log(`[backend] listening :${PORT}`);
});
