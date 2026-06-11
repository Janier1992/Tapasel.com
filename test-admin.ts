import { createClient } from '@insforge/sdk';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const insforge = createClient({ 
  baseUrl: process.env.INSFORGE_PROJECT_URL,
  apiKey: process.env.INSFORGE_API_KEY 
});

async function check() {
  console.log("Checking tables...");
  const res = await insforge.database.from('clientes').select('*').limit(1);
  console.log("Select result:", res);

  if (res.error) {
    console.error("Error connecting to database or missing table:", res.error);
  }
}
check();
