"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import confetti from "canvas-confetti";
import { z } from "zod";
import { BoothHeader } from "@/components/booth-ui";

const timelineSchema = z.object({
  this_timeline: z.string(),
  alternate_timeline: z.string(),
});

type TimelineData = z.infer<typeof timelineSchema>;

function typewriterReveal(
  full: string,
  onUpdate: (value: string) => void,
  ms = 10
) {
  return new Promise<void>((resolve) => {
    let i = 0;
    const tick = () => {
      i += 1;
      onUpdate(full.slice(0, i));
      if (i >= full.length) resolve();
      else setTimeout(tick, ms);
    };
    tick();
  });
}

function burstConfetti() {
  confetti({
    particleCount: 100,
    spread: 80,
    origin: { y: 0.65 },
    colors: ["#ff6bcb", "#ffb020", "#b8ff5c", "#3dd9ff", "#ffe98a"],
  });
}

function TimelineContent() {
  const searchParams = useSearchParams();
  const submissionId = searchParams.get("submission");
  const confettiFired = useRef(false);
  const [emailStatus, setEmailStatus] = useState<
    "idle" | "sending" | "sent" | "skipped" | "error"
  >("idle");
  const [templateData, setTemplateData] = useState<TimelineData | null>(null);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [displayThis, setDisplayThis] = useState("");
  const [displayAlt, setDisplayAlt] = useState("");
  const [useStream, setUseStream] = useState(false);

  const { object, submit, isLoading, error } = useObject({
    api: "/api/generate-timeline",
    schema: timelineSchema,
  });

  useEffect(() => {
    if (!submissionId) return;

    let cancelled = false;

    async function run() {
      setTemplateLoading(true);
      const res = await fetch("/api/generate-timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission_id: submissionId }),
      });

      if (cancelled) return;

      const contentType = res.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const data = (await res.json()) as TimelineData;
        setTemplateData(data);
        await typewriterReveal(data.this_timeline, setDisplayThis);
        if (cancelled) return;
        await typewriterReveal(data.alternate_timeline, setDisplayAlt);
        if (!cancelled) setTemplateLoading(false);
        return;
      }

      setUseStream(true);
      setTemplateLoading(false);
      submit({ submission_id: submissionId });
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [submissionId, submit]);

  const finalObject = templateData ?? object;
  const loading =
    templateLoading || (useStream && isLoading && !finalObject?.this_timeline);

  useEffect(() => {
    if (
      !loading &&
      finalObject?.this_timeline &&
      finalObject?.alternate_timeline &&
      !confettiFired.current
    ) {
      confettiFired.current = true;
      burstConfetti();
    }
  }, [loading, finalObject]);

  useEffect(() => {
    if (
      !submissionId ||
      !finalObject?.this_timeline ||
      !finalObject?.alternate_timeline ||
      emailStatus !== "idle"
    ) {
      return;
    }

    setEmailStatus("sending");
    fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submission_id: submissionId }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.skipped) setEmailStatus("skipped");
        else if (res.ok) setEmailStatus("sent");
        else setEmailStatus("error");
      })
      .catch(() => setEmailStatus("error"));
  }, [submissionId, finalObject, emailStatus]);

  if (!submissionId) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-lg font-bold text-foreground/60">
          Oops! No submission found. 🤔
        </p>
        <Link href="/questions" className="btn-primary mt-6 inline-block">
          Start over! →
        </Link>
      </div>
    );
  }

  const thisText = templateData ? displayThis : finalObject?.this_timeline;
  const altText = templateData ? displayAlt : finalObject?.alternate_timeline;

  return (
    <main className="relative mx-auto min-h-screen max-w-5xl px-6 py-16">
      <BoothHeader
        step="Step 2 of 2 · Timeline split!"
        title="Your timelines are splitting! 🌀"
        subtitle={
          loading
            ? "Hold tight! The multiverse is thinking really hard..."
            : "Two yous! One scan! Infinite silly possibilities!"
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        <TimelinePanel
          title="This Timeline You"
          emoji="🌍"
          subtitle="Grounded. Present. Real you!"
          content={thisText}
          loading={loading && !thisText}
          variant="lime"
        />
        <TimelinePanel
          title="Alternate Timeline You"
          emoji="🪐"
          subtitle="Parallel. Wild. What if?!"
          content={altText}
          loading={loading && !altText}
          variant="pink"
        />
      </div>

      {error && <p className="error-bubble mt-6">😅 {error.message}</p>}

      {!loading && finalObject?.this_timeline && finalObject?.alternate_timeline && (
        <div className="mt-10 animate-fade-in text-center">
          <div className="sticker sticker-yellow mx-auto mb-4 w-fit">
            🌌 Multiverse Explorer badge unlocked!
          </div>
          {emailStatus === "sending" && (
            <p className="font-semibold text-foreground/60">
              ✉️ Sending your keepsake email...
            </p>
          )}
          {emailStatus === "sent" && (
            <p className="font-display text-xl font-bold text-accent">
              ✉️ Check your inbox! Your Parallel You is on the way!
            </p>
          )}
          {emailStatus === "skipped" && (
            <p className="font-semibold text-foreground/60">
              Story saved! (Email skipped in dev)
            </p>
          )}
          {emailStatus === "error" && (
            <p className="font-semibold text-foreground/60">
              Story saved! Email had a tiny hiccup.
            </p>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/wall" className="btn-secondary text-sm">
              👀 See the wall
            </Link>
            <Link href="/questions" className="btn-secondary text-sm">
              🔄 Split again!
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}

function TimelinePanel({
  title,
  emoji,
  subtitle,
  content,
  loading,
  variant,
}: {
  title: string;
  emoji: string;
  subtitle: string;
  content?: string;
  loading: boolean;
  variant: "lime" | "pink";
}) {
  const cardClass = variant === "lime" ? "card-lime" : "card-pink";

  return (
    <section
      className={`card-playful ${cardClass} p-6 ${loading ? "animate-shimmer" : ""}`}
    >
      <div className="mb-1 flex items-center gap-2">
        <span className="text-3xl">{emoji}</span>
        <h2 className="font-display text-xl font-extrabold">{title}</h2>
      </div>
      <p className="mb-4 text-sm font-extrabold uppercase tracking-wide text-foreground/50">
        {subtitle}
      </p>
      {content ? (
        <p className="animate-fade-in whitespace-pre-wrap text-base font-semibold leading-relaxed text-foreground/90">
          {content}
        </p>
      ) : (
        <div className="space-y-2">
          <div className="h-3 w-full rounded-full bg-foreground/10" />
          <div className="h-3 w-4/5 rounded-full bg-foreground/10" />
          <div className="h-3 w-3/5 rounded-full bg-foreground/10" />
        </div>
      )}
    </section>
  );
}

export default function TimelinePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="font-display animate-pulse text-xl font-bold text-foreground/60">
            🌀 Opening portal...
          </p>
        </div>
      }
    >
      <TimelineContent />
    </Suspense>
  );
}
