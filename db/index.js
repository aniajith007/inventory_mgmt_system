const sql = require('mssql');
const { db } = require('../config/env');

let poolPromise;

function getPool() {
  if (!poolPromise) {
    poolPromise = sql
      .connect(db)
      .then((pool) => {
        // eslint-disable-next-line no-console
        console.log('[db] Connected to MSSQL');
        return pool;
      })
      .catch((error) => {
        poolPromise = null;
        throw error;
      });
  }

  return poolPromise;
}

async function runQuery(queryText, bind = {}) {
  const pool = await getPool();
  const request = pool.request();

  Object.entries(bind).forEach(([key, value]) => {
    request.input(key, value);
  });

  const result = await request.query(queryText);
  return result;
}

module.exports = {
  sql,
  getPool,
  runQuery
};
