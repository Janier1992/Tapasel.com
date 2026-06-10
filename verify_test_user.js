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
  const email = process.argv[2];
  if (!email) {
    console.error("Por favor especifique el correo electrónico del usuario a verificar.");
    console.log("Ejemplo: npx tsx verify_test_user.js usuario@gmail.com");
    process.exit(1);
  }

  const emailLower = email.toLowerCase().trim();
  console.log(`Buscando usuario en auth.users: ${emailLower}`);

  try {
    // 1. Get user UUID from auth.users
    const resUser = await pool.query("SELECT id FROM auth.users WHERE email = $1", [emailLower]);
    if (resUser.rows.length === 0) {
      console.error(`Error: El correo ${emailLower} no está registrado en InsForge Authentication.`);
      process.exit(1);
    }
    const uuid = resUser.rows[0].id;
    console.log(`Usuario encontrado. UUID de InsForge: ${uuid}`);

    // 2. Set email_verified = true in auth.users
    await pool.query("UPDATE auth.users SET email_verified = true WHERE email = $1", [emailLower]);
    console.log(`✓ Email verificado con éxito en auth.users.`);

    // 3. Update public.usuarios table
    const resUpdatePublic = await pool.query("UPDATE public.usuarios SET id = $1 WHERE email = $2", [uuid, emailLower]);
    console.log(`✓ Perfil de base de datos sincronizado con el UUID. Filas afectadas: ${resUpdatePublic.rowCount}`);

    console.log("¡Activación manual completada con éxito! El usuario ya puede iniciar sesión en la aplicación.");
  } catch (err) {
    console.error("Error al ejecutar la activación:", err);
  } finally {
    await pool.end();
  }
}

run();
