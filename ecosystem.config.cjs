module.exports = {
  apps: [
    {
      name: "homesync-backend",
      cwd: "/home/ec2-user/HomeSync",
      script: "backend/dist/index.js",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};