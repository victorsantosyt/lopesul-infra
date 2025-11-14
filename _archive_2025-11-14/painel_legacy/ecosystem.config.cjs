module.exports = {
  apps: [{
    name: 'painel',
    cwd: '/opt/painel',
    // roda o Next em produção na porta 3000
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 3000',
    env: { NODE_ENV: 'production' }
  }]
};
