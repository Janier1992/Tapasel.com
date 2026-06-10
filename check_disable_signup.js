import pg from "pg";

const pool = new pg.Pool({
  host: "yk386jub.us-east.database.insforge.app",
  port: 5432,
  user: "postgres",
  password: "eb6162a42ae6ae87216b524568737c5d",
  database: "insforge",
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log("Updating auth.config...");
    await pool.query("UPDATE auth.config SET disable_signup = false");
    const res = await pool.query("SELECT disable_signup, require_email_verification FROM auth.config");
    console.log("Current DB Auth Config:", JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

run();

