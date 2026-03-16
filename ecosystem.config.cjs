module.exports = {
  apps: [
    {
      name: "homesync-backend",
      cwd: "/home/ec2-user/HomeSync",
      script: "node",
      args: "backend/dist/index.js",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
        DATABASE_URL: process.env.DATABASE_URL,
        JWT_SECRET: process.env.JWT_SECRET,
        ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
      },
    },
  ],
};
