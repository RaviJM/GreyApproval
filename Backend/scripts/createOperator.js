require("dotenv").config();

const bcrypt = require("bcrypt");
const pool = require("../db/db");

async function createOperator() {
  const username = process.env.OPERATOR_USERNAME;
  const password = process.env.OPERATOR_PASSWORD;

  if (!username || !password) {
    throw new Error(
      "Set OPERATOR_USERNAME and OPERATOR_PASSWORD before running this script.",
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await pool.query(
    `INSERT INTO operator_users (username, password_hash)
     VALUES ($1, $2)
     ON CONFLICT (username)
     DO UPDATE SET password_hash = EXCLUDED.password_hash`,
    [username, passwordHash],
  );

  console.log(`Operator account '${username}' created/updated.`);
}

createOperator()
  .catch((error) => {
    console.error("Failed to create operator:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
