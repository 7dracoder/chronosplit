import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function tablesExist() {
  const { error } = await supabase.from("users").select("id").limit(1);
  return !error;
}

async function main() {
  if (await tablesExist()) {
    console.log("✓ Supabase tables already exist");
    return;
  }

  console.log("Tables missing — need SQL migration in Supabase dashboard.");
  console.log("File: supabase/migrations/001_initial.sql");
  console.log("\nChecking connection...");

  const { error } = await supabase.from("users").select("id").limit(1);
  if (error) {
    console.error("DB error:", error.message);
    console.error("\n→ Open Supabase SQL Editor and run supabase/migrations/001_initial.sql");
    process.exit(1);
  }
}

main();
