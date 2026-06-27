import { NextResponse } from "next/server";
import { createServiceClient, hasSupabase } from "@/lib/supabase";
import { hasAnthropicKey } from "@/lib/timeline-agent";
import { hasResendKey } from "@/lib/email";
import { isMemoryStoreEnabled } from "@/lib/memory-store";

async function resolveStorageMode() {
  if (isMemoryStoreEnabled()) return "memory";
  try {
    const sb = createServiceClient();
    const { error } = await sb.from("users").select("id").limit(1);
    if (error?.message.includes("Could not find the table")) {
      return "memory (supabase tables pending)";
    }
    if (error) return "supabase-error";
    return "supabase";
  } catch {
    return "memory";
  }
}

export async function GET() {
  const storage = await resolveStorageMode();
  return NextResponse.json({
    status: "ok",
    app: "ChronoSplit",
    mode: {
      storage,
      ai: hasAnthropicKey() ? "claude" : "template",
      email: hasResendKey() ? "resend" : "disabled",
      supabaseConfigured: hasSupabase() || !isMemoryStoreEnabled(),
    },
  });
}
