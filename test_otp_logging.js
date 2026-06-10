import { execSync } from "child_process";

async function run() {
  const email = "test_otp_log_" + Math.floor(Math.random() * 100000) + "@tapasel.co";
  console.log("1. Registering user:", email);

  try {
    const res = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: "Test OTP Log",
        email: email,
        cargo: "ADMIN",
        rol: "ADMIN",
        avatarInitials: "TO",
        permisos: ['panel','finanzas','rrhh','documentos','analitica','produccion','configuracion'],
        password: "password123"
      })
    });
    
    console.log("API Status:", res.status);
    const body = await res.json();
    console.log("API Response:", JSON.stringify(body, null, 2));

    console.log("2. Waiting 3 seconds for email container logging...");
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log("3. Fetching recent backend logs...");
    const logs = execSync("npx @insforge/cli logs insforge.logs").toString();
    
    // Look for lines containing "otp" or "mail" or the generated email
    const lines = logs.split("\n");
    console.log("Matching Log Lines:");
    for (const line of lines) {
      if (line.toLowerCase().includes("otp") || line.toLowerCase().includes("mail") || line.includes(email)) {
        console.log(line);
      }
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
