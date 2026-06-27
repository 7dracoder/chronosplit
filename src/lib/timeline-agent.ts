import { readFileSync } from "fs";
import { join } from "path";
import { anthropic } from "@ai-sdk/anthropic";
import { generateObject, streamObject } from "ai";
import { z } from "zod";

const timelineSchema = z.object({
  this_timeline: z.string(),
  alternate_timeline: z.string(),
});

export type TimelineOutput = z.infer<typeof timelineSchema>;

function loadAgentPrompt(): string {
  return readFileSync(join(process.cwd(), "eve", "agent.md"), "utf-8");
}

function buildUserMessage(params: {
  vibe: string;
  dream_city: string;
  secret_talent: string;
  wild_goal?: string | null;
}) {
  return [
    `vibe: ${params.vibe}`,
    `dream_city: ${params.dream_city}`,
    `secret_talent: ${params.secret_talent}`,
    params.wild_goal ? `wild_goal: ${params.wild_goal}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export function hasAnthropicKey() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function templateTimeline(params: {
  vibe: string;
  dream_city: string;
  secret_talent: string;
  wild_goal?: string | null;
}): TimelineOutput {
  const goal = params.wild_goal
    ? ` You're quietly chasing "${params.wild_goal}" and honestly, the universe seems to be paying attention.`
    : "";

  return {
    this_timeline: `You carry a ${params.vibe} energy wherever you go, the kind of person who makes a room feel more alive without trying. ${params.dream_city} lives rent-free in your imagination, and your secret talent (${params.secret_talent}) says more about you than most résumés ever could.${goal} In this timeline, you're building something real, one curious choice at a time.`,
    alternate_timeline: `In Universe B, you wake up in ${params.dream_city} to the smell of something improbable and perfect. Your ${params.vibe} vibe has made you locally famous, not for clout, but because people swear you have main-character energy with supporting-cast humility. Your secret talent (${params.secret_talent}) somehow became your day job after one viral moment you still insist was "just a bit." Parallel-you hosts underground salons where strangers swap life stories over food you invented on the spot.${params.wild_goal ? ` And that wild goal, "${params.wild_goal}"? You achieved it, but the timeline split again when you immediately set an even wilder one.` : " Every week, you pick a new impossible goal just to see if the multiverse blinks first."} The booth attendant in this timeline says you're their favorite anomaly.`,
  };
}

export async function generateTimeline(params: {
  vibe: string;
  dream_city: string;
  secret_talent: string;
  wild_goal?: string | null;
}): Promise<TimelineOutput> {
  if (!hasAnthropicKey()) {
    return templateTimeline(params);
  }

  const { object } = await generateObject({
    model: anthropic("claude-sonnet-4-5-20250929"),
    schema: timelineSchema,
    system: loadAgentPrompt(),
    prompt: buildUserMessage(params),
  });

  return object;
}

export function streamTimeline(
  params: {
    vibe: string;
    dream_city: string;
    secret_talent: string;
    wild_goal?: string | null;
  },
  onFinish?: (object: TimelineOutput) => Promise<void>
) {
  return streamObject({
    model: anthropic("claude-sonnet-4-5-20250929"),
    schema: timelineSchema,
    system: loadAgentPrompt(),
    prompt: buildUserMessage(params),
    onFinish: async ({ object }) => {
      if (object && onFinish) {
        await onFinish(object);
      }
    },
  });
}
