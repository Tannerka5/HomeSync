module.exports = {
  apps: [
    {
      name: "homesync-backend",
      script: "backend/dist/index.js",
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
