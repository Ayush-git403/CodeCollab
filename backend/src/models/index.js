const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.connect((err) => {
  if (err) console.error("DB connection error", err);
  else console.log("✅ PostgreSQL connected");
});

module.exports = pool;