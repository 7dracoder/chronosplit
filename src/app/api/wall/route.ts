import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getWallItems } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "12", 10), 50);
    const items = await getWallItems(limit);
    return NextResponse.json({ items });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load wall" },
      { status: 500 }
    );
  }
}
