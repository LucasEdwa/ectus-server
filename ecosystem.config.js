module.exports = {
    apps: [
      {
        name: 'ectus-server',
        script: 'src/index.ts', // <-- use dist build, not src
        instances: max,
        exec_mode: 'fork',
        watch: false,
        env: {
          NODE_ENV: 'production',
        },
      },
    ],
  };