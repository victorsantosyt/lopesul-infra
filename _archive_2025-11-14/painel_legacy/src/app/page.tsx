export default function Home() {
  return (
    <main
      style={{
        minHeight: '100vh',
        margin: 0,
        padding: '24px',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
        background: '#020617',
        color: '#e5e7eb',
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <h1 style={{ fontSize: '24px', fontWeight: 600 }}>Lopesul Dashboard</h1>
        <span
          style={{
            fontSize: '14px',
            padding: '4px 10px',
            borderRadius: '999px',
            background: 'rgba(34,197,94,0.15)',
            border: '1px solid rgba(34,197,94,0.6)',
            color: '#bbf7d0',
          }}
        >
          Painel online
        </span>
      </header>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        <div
          style={{
            padding: '16px',
            borderRadius: '12px',
            background: 'rgba(15,23,42,0.9)',
            border: '1px solid rgba(51,65,85,0.8)',
          }}
        >
          <h2 style={{ fontSize: '16px', marginBottom: '8px' }}>Status do sistema</h2>
          <p style={{ fontSize: '14px', opacity: 0.85 }}>
            Backend, Relay e Mikrotik conectados. Ajuste aqui os cards reais de métricas.
          </p>
        </div>

        <div
          style={{
            padding: '16px',
            borderRadius: '12px',
            background: 'rgba(15,23,42,0.9)',
            border: '1px solid rgba(51,65,85,0.8)',
          }}
        >
          <h2 style={{ fontSize: '16px', marginBottom: '8px' }}>Próximos passos</h2>
          <ul style={{ fontSize: '14px', paddingLeft: '18px', margin: 0 }}>
            <li>Conectar este painel ao banco real do Lopesul Dashboard</li>
            <li>Trazer lista de acessos / vendas</li>
            <li>Adicionar cards por ônibus / Mikrotik</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
