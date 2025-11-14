module.exports = {
  apps: [{
    name: 'relay',
    cwd: '/opt/relay',
    script: './server.mjs',
    env: { NODE_ENV: 'production', PORT: '3100' }
MIK_LIST: '[{"id":"MK01","name":"LOPESUL-HOTSPOT-01","host":"10.200.200.2","port":8728,"user":"relay","pass":"api2025","hotspotServer":"hotspot1","paidList":"paid_clients"}]'
      }
    }
  ]
};
