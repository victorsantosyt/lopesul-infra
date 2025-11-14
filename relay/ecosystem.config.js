// /opt/relay/ecosystem.config.js
module.exports = {
  apps: [{
    name: 'relay',
    cwd: '/opt/relay',
    script: 'server.mjs',
    exec_mode: 'fork',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    restart_delay: 2000,
    kill_timeout: 5000,
    listen_timeout: 8000,
    env: {
      NODE_ENV: 'production',
      PORT: '4000'
      // Nada de credencial aqui. RELAY_TOKEN, MIK_LIST etc. ficam no /opt/relay/.env
    },
    env_production: { NODE_ENV: 'production' },
    output: '/var/log/pm2/relay.out.log',
    error:  '/var/log/pm2/relay.err.log',
    merge_logs: true,
    time: true
  }]
};
