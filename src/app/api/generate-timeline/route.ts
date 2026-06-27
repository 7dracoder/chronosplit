import { NextResponse } from "next/server";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { getOrCreateDbUser } from "@/lib/auth";
import {
  generateTimeline,
  hasAnthropicKey,
  streamTimeline,
} from "@/lib/timeline-agent";
import { getSubmissionForUser, saveTimeline } from "@/lib/supabase";

const requestSchema = z.object({
  submission_id: z.string().uuid(),
});

export async function POST(req: Request) {
  try {
    const ctx = await getOrCreateDbUser();
    if (!ctx) {
      return new Response("Unauthorized", { status: 401 });
    }

    const json = await req.json();
    const parsed = requestSchema.safeParse(json);
    if (!parsed.success) {
      return new Response("Invalid submission_id", { status: 400 });
    }

    const submission = await getSubmissionForUser({
      submissionId: parsed.data.submission_id,
      userId: ctx.user.id,
    });

    if (!submission) {
      return new Response("Submission not found", { status: 404 });
    }

    const input = {
      vibe: submission.vibe,
      dream_city: submission.dream_city,
      secret_talent: submission.secret_talent,
      wild_goal: submission.wild_goal,
    };

    if (!hasAnthropicKey()) {
      const output = await generateTimeline(input);
      await saveTimeline({
        userId: ctx.user.id,
        profileSubmissionId: submission.id,
        this_timeline: output.this_timeline,
        alternate_timeline: output.alternate_timeline,
      });
      return NextResponse.json(output);
    }

    const result = streamTimeline(input, async (object) => {
      await saveTimeline({
        userId: ctx.user.id,
        profileSubmissionId: submission.id,
        this_timeline: object.this_timeline,
        alternate_timeline: object.alternate_timeline,
      });
    });

    return result.toTextStreamResponse();
  } catch (err) {
    Sentry.captureException(err);
    return new Response(
      err instanceof Error ? err.message : "Generation failed",
      { status: 500 }
    );
  }
}
