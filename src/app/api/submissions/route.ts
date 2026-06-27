import { NextResponse } from "next/server";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { getOrCreateDbUser } from "@/lib/auth";
import { createSubmission } from "@/lib/supabase";

const bodySchema = z.object({
  vibe: z.string().min(1).max(200),
  dream_city: z.string().min(1).max(200),
  secret_talent: z.string().min(1).max(300),
  wild_goal: z.string().max(300).optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const ctx = await getOrCreateDbUser();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid submission", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id } = await createSubmission({
      userId: ctx.user.id,
      vibe: parsed.data.vibe,
      dream_city: parsed.data.dream_city,
      secret_talent: parsed.data.secret_talent,
      wild_goal: parsed.data.wild_goal || null,
    });

    return NextResponse.json({ submission_id: id });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
