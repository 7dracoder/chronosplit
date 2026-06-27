import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getOrCreateDbUser } from "@/lib/auth";
import { sendParallelYouEmail } from "@/lib/email";
import { getTimelineBySubmission, markEmailSent } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const ctx = await getOrCreateDbUser();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { submission_id } = await req.json();
    if (!submission_id) {
      return NextResponse.json({ error: "submission_id required" }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ ok: true, skipped: true, reason: "no_resend_key" });
    }

    let timeline = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      timeline = await getTimelineBySubmission({
        submissionId: submission_id,
        userId: ctx.user.id,
      });
      if (timeline) break;
      await new Promise((r) => setTimeout(r, 800));
    }

    if (!timeline) {
      return NextResponse.json({ error: "Timeline not found" }, { status: 404 });
    }

    if (timeline.email_sent) {
      return NextResponse.json({ ok: true, already_sent: true });
    }

    const sub = timeline.profile_submissions as {
      vibe: string;
      dream_city: string;
      secret_talent: string;
      wild_goal: string | null;
    };

    await sendParallelYouEmail({
      to: ctx.user.email,
      name: ctx.session.user.name ?? ctx.session.user.nickname ?? "Explorer",
      vibe: sub.vibe,
      dreamCity: sub.dream_city,
      secretTalent: sub.secret_talent,
      wildGoal: sub.wild_goal,
      thisTimeline: timeline.this_timeline,
      alternateTimeline: timeline.alternate_timeline,
    });

    await markEmailSent(timeline.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Email failed" },
      { status: 500 }
    );
  }
}
