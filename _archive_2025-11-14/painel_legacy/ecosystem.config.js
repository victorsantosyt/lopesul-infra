// /opt/painel/ecosystem.config.js
module.exports = {
  apps: [{
    name: 'painel',
    cwd: '/opt/painel',
    script: 'npm',
    args: 'start',                 // precisa existir no package.json: "start": "next start -p 3000"
    exec_mode: 'fork',
    instances: 1,                  // se quiser escalar: 'max' (mas Next SSR consome RAM)
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    restart_delay: 2000,
    kill_timeout: 5000,
    listen_timeout: 8000,
    env: {
      NODE_ENV: 'production',
      PORT: '3000',
      NEXT_PUBLIC_APP_URL: 'https://painel.lopesuldashboardwifi.com',
      RELAY_BASE: 'https://api.lopesuldashboardwifi.com/v1',
      NEXT_TELEMETRY_DISABLED: '1' // opcional, silencia telemetria do Next
    },
    env_production: { NODE_ENV: 'production' },
    output: '/var/log/pm2/painel.out.log',
    error:  '/var/log/pm2/painel.err.log',
    merge_logs: true,
    time: true
  }]
};
