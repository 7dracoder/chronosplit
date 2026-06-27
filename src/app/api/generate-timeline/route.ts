import { NextResponse } from "next/server";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { getOrCreateDbUser } from "@/lib/auth";
import { generateTimeline } from "@/lib/timeline-agent";
import { getSubmissionForUser, getTimelineBySubmission, saveTimeline } from "@/lib/supabase";

const requestSchema = z.object({
  submission_id: z.string().uuid(),
});

export async function POST(req: Request) {
  try {
    const ctx = await getOrCreateDbUser();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const parsed = requestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid submission_id" }, { status: 400 });
    }

    const submission = await getSubmissionForUser({
      submissionId: parsed.data.submission_id,
      userId: ctx.user.id,
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const existing = await getTimelineBySubmission({
      submissionId: submission.id,
      userId: ctx.user.id,
    });

    if (existing?.this_timeline && existing?.alternate_timeline) {
      return NextResponse.json({
        this_timeline: existing.this_timeline,
        alternate_timeline: existing.alternate_timeline,
        profile: {
          vibe: submission.vibe,
          dream_city: submission.dream_city,
          secret_talent: submission.secret_talent,
          wild_goal: submission.wild_goal,
        },
        cached: true,
      });
    }

    const input = {
      vibe: submission.vibe,
      dream_city: submission.dream_city,
      secret_talent: submission.secret_talent,
      wild_goal: submission.wild_goal,
    };

    const output = await generateTimeline(input);

    await saveTimeline({
      userId: ctx.user.id,
      profileSubmissionId: submission.id,
      this_timeline: output.this_timeline,
      alternate_timeline: output.alternate_timeline,
    });

    return NextResponse.json({
      ...output,
      profile: {
        vibe: submission.vibe,
        dream_city: submission.dream_city,
        secret_talent: submission.secret_talent,
        wild_goal: submission.wild_goal,
      },
    });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed" },
      { status: 500 }
    );
  }
}
