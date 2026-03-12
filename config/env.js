const dotenv = require('dotenv');

dotenv.config();

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

module.exports = {
  app: {
    port: toNumber(process.env.PORT, 4000),
    jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
    corsOrigin: process.env.CORS_ORIGIN || '*'
  },
  db: {
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'InventoryAudit',
    port: toNumber(process.env.DB_PORT, 1433),
    options: {
      encrypt: String(process.env.DB_ENCRYPT || 'false').toLowerCase() === 'true',
      trustServerCertificate: String(process.env.DB_TRUST_SERVER_CERT || 'true').toLowerCase() === 'true'
    },
    pool: {
      max: toNumber(process.env.DB_POOL_MAX, 10),
      min: toNumber(process.env.DB_POOL_MIN, 0),
      idleTimeoutMillis: toNumber(process.env.DB_POOL_IDLE_MS, 30000)
    }
  }
};
