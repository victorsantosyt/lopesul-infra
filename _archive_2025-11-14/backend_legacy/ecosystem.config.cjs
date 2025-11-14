module.exports = {
  apps: [{
    name: 'backend',
    cwd: '/opt/backend',
    script: './server.mjs',
    node_args: '--enable-source-maps',
    env: { NODE_ENV: 'production', PORT: '3001' }
  }]
};
