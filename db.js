const { Sequelize } = require("sequelize");

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not defined in the environment.");
}

const isLocalConnection = /localhost|127\.0\.0\.1/i.test(databaseUrl);
const isSslConnection = process.env.DB_SSL === "true" || !isLocalConnection;

const sequelize = new Sequelize(databaseUrl, {
  dialect: "postgres",
  logging: false,
  dialectOptions: isSslConnection
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    : {}
});

async function connectDB() {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });
  console.log("PostgreSQL connected");
}

module.exports = { sequelize, connectDB };
