import { Resend } from "resend";
import { render } from "@react-email/render";
import { ParallelYouEmail } from "@/emails/parallel-you";

export function hasResendKey() {
  return Boolean(process.env.RESEND_API_KEY);
}

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Missing RESEND_API_KEY");
  return new Resend(key);
}

export async function sendParallelYouEmail(params: {
  to: string;
  name: string;
  vibe: string;
  dreamCity: string;
  secretTalent: string;
  wildGoal?: string | null;
  thisTimeline: string;
  alternateTimeline: string;
}) {
  if (!hasResendKey()) {
    return;
  }

  const resend = getResend();
  const from =
    process.env.RESEND_FROM_EMAIL ?? "ChronoSplit <onboarding@resend.dev>";

  const html = await render(
    ParallelYouEmail({
      name: params.name,
      vibe: params.vibe,
      dreamCity: params.dreamCity,
      secretTalent: params.secretTalent,
      wildGoal: params.wildGoal,
      thisTimeline: params.thisTimeline,
      alternateTimeline: params.alternateTimeline,
    })
  );

  const { error } = await resend.emails.send({
    from,
    to: params.to,
    subject: "Your Parallel You Timeline",
    html,
  });

  if (error) throw new Error(error.message);
}
