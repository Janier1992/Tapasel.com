import pg from "pg";

const { Pool } = pg;
const pool = new Pool({
  host: "yk386jub.us-east.database.insforge.app",
  port: 5432,
  user: "postgres",
  password: "eb6162a42ae6ae87216b524568737c5d",
  database: "insforge",
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const res = await pool.query(
      "SELECT * FROM auth.email_otps ORDER BY created_at DESC LIMIT 5"
    );
    console.log("Recent email OTPs:");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

run();


