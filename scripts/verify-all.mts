import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { Resend } from "resend";

config({ path: ".env.local" });

async function main() {
  const results: Record<string, string> = {};

  // Auth0
  results.auth0 =
    process.env.AUTH0_CLIENT_ID &&
    process.env.AUTH0_CLIENT_SECRET &&
    process.env.AUTH0_DOMAIN
      ? "configured"
      : "missing";

  // Supabase
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    const sb = createClient(url, key);
    const { error } = await sb.from("users").select("id").limit(1);
    results.supabase = error
      ? error.message.includes("Could not find the table")
        ? "connected — tables missing (run migration SQL)"
        : `error: ${error.message}`
      : "connected + tables ok";
  } else {
    results.supabase = "missing keys";
  }

  // Anthropic
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const msg = await client.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 16,
        messages: [{ role: "user", content: "Say OK" }],
      });
      const text =
        msg.content[0]?.type === "text" ? msg.content[0].text : "";
      results.anthropic = text.toLowerCase().includes("ok")
        ? "working"
        : `responded: ${text.slice(0, 40)}`;
    } catch (e) {
      results.anthropic = `error: ${e instanceof Error ? e.message : e}`;
    }
  } else {
    results.anthropic = "missing key";
  }

  // Resend
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { data, error } = await resend.apiKeys.list();
      results.resend = error ? `error: ${error.message}` : "working";
      void data;
    } catch (e) {
      results.resend = `error: ${e instanceof Error ? e.message : e}`;
    }
  } else {
    results.resend = "missing key";
  }

  console.log(JSON.stringify(results, null, 2));
}

main();
