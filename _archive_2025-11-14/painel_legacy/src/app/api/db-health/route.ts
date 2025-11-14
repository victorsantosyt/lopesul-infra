import 'dotenv/config';

// Run this route in the Node.js runtime so Prisma and dotenv work correctly
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Provide a minimal ambient declaration for `process` so TypeScript won't
// error when this file is type-checked in environments without `@types/node`.
// If you prefer, install `@types/node` in the project instead:
//   npm i -D @types/node
declare const process: {
  env: { [key: string]: string | undefined };
};

export async function GET() {
  const started = Date.now();
  let db = 'skipped';
  try {
    // tenta usar Prisma se existir /prisma e variável definida
    if (process.env.DATABASE_URL) {
      // @ts-ignore: prisma may be optional at build time
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      await prisma.$queryRaw`SELECT 1`;
      db = 'connected';
      await prisma.$disconnect();
    }
    } catch {
      db = 'error';
    }
    return new Response(JSON.stringify({
      ok: true,
      db,
      latency_ms: Date.now() - started,
      now_utc: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
