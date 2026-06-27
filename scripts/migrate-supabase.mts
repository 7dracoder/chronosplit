import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function tryManagementSql() {
  const sql = readFileSync(
    join(process.cwd(), "supabase/migrations/001_initial.sql"),
    "utf-8"
  );

  const ref = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (!ref) throw new Error("Invalid Supabase URL");

  const endpoints = [
    `https://${ref}.supabase.co/pg/query`,
    `https://${ref}.supabase.co/rest/v1/rpc/exec_sql`,
  ];

  for (const endpoint of endpoints) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    });
    if (res.ok) return true;
  }
  return false;
}

async function main() {
  const sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await sb.from("users").select("id").limit(1);
  if (!error) {
    console.log("✓ Tables already exist");
    return;
  }

  console.log("Attempting remote SQL migration...");
  const ok = await tryManagementSql();
  if (ok) {
    console.log("✓ Migration via API succeeded");
    return;
  }

  console.log("API migration unavailable, applying via pg if password set...");
  const { default: pg } = await import("pg");
  const password = process.env.SUPABASE_DB_PASSWORD;
  const ref = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

  if (!password || !ref) {
    console.error("Need SUPABASE_DB_PASSWORD in .env.local for auto-migrate");
    console.error("Or run supabase/migrations/001_initial.sql in SQL Editor");
    process.exit(1);
  }

  const regions = [
    "aws-1-us-east-2",
    "aws-0-us-east-1",
    "aws-0-us-west-1",
    "aws-0-eu-west-1",
  ];

  const sql = readFileSync(
    join(process.cwd(), "supabase/migrations/001_initial.sql"),
    "utf-8"
  );

  let lastErr: Error | null = null;
  for (const region of regions) {
    const conn = `postgresql://postgres.${ref}:${encodeURIComponent(password)}@${region}.pooler.supabase.com:5432/postgres`;
    const client = new pg.Client({
      connectionString: conn,
      ssl: { rejectUnauthorized: false },
    });
    try {
      await client.connect();
      await client.query(sql);
      await client.end();
      console.log(`✓ Migration applied via ${region}`);
      return;
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
      try {
        await client.end();
      } catch {
        /* ignore */
      }
    }
  }

  const direct = `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;
  const client = new pg.Client({
    connectionString: direct,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  await client.query(sql);
  await client.end();
  console.log("✓ Migration applied via direct connection");
}

main().catch((e) => {
  console.error("Failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
