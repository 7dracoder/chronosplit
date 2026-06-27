"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import confetti from "canvas-confetti";
import { BoothHeader } from "@/components/booth-ui";
import { alternateTimelineAvatar, thisTimelineAvatar } from "@/lib/avatars";

type Profile = {
  vibe: string;
  dream_city: string;
  secret_talent: string;
  wild_goal: string | null;
};

type TimelineData = {
  this_timeline: string;
  alternate_timeline: string;
  profile?: Profile;
};

const LOADING_STEPS = [
  "🔍 Scanning your vibe...",
  "🌍 Locating your dream city...",
  "🎭 Unlocking secret talents...",
  "🌀 Splitting the multiverse...",
  "✨ Almost there!",
];

function typewriterReveal(
  full: string,
  onUpdate: (value: string) => void,
  ms = 8
) {
  return new Promise<void>((resolve) => {
    let i = 0;
    const tick = () => {
      i += 2;
      onUpdate(full.slice(0, i));
      if (i >= full.length) {
        onUpdate(full);
        resolve();
      } else {
        setTimeout(tick, ms);
      }
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
  const [loading, setLoading] = useState(true);
  const [loadStep, setLoadStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayThis, setDisplayThis] = useState("");
  const [displayAlt, setDisplayAlt] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadStep((s) => (s + 1) % LOADING_STEPS.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (!submissionId) return;

    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000);

    async function run() {
      setLoading(true);
      setError(null);
      setDone(false);
      setDisplayThis("");
      setDisplayAlt("");

      try {
        const res = await fetch("/api/generate-timeline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ submission_id: submissionId }),
          signal: controller.signal,
        });

        const data = (await res.json()) as TimelineData & { error?: string };

        if (cancelled) return;

        if (!res.ok) {
          throw new Error(data.error ?? `Request failed (${res.status})`);
        }

        if (!data.this_timeline || !data.alternate_timeline) {
          throw new Error("Timeline came back empty. Try again!");
        }

        setProfile(data.profile ?? null);
        setLoading(false);

        await typewriterReveal(data.this_timeline, setDisplayThis);
        if (cancelled) return;
        await typewriterReveal(data.alternate_timeline, setDisplayAlt);
        if (!cancelled) setDone(true);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof Error && err.name === "AbortError") {
          setError("The multiverse took too long. Please try again!");
        } else {
          setError(err instanceof Error ? err.message : "Something went wrong");
        }
        setLoading(false);
      } finally {
        clearTimeout(timeout);
      }
    }

    run();
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeout);
    };
  }, [submissionId]);

  useEffect(() => {
    if (!done || confettiFired.current) return;
    confettiFired.current = true;
    burstConfetti();
  }, [done]);

  useEffect(() => {
    if (!submissionId || !done || emailStatus !== "idle") return;

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
  }, [submissionId, done, emailStatus]);

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

  const avatarSeed = submissionId;

  return (
    <main className="relative mx-auto min-h-screen max-w-5xl px-6 py-16">
      <BoothHeader
        step="Step 2 of 2 · Timeline split!"
        title="Your timelines are splitting! 🌀"
        subtitle={
          loading
            ? LOADING_STEPS[loadStep]
            : done
              ? "Two yous! One scan! Infinite silly possibilities!"
              : "Meet your twin selves below!"
        }
      />

      {profile && (
        <div className="card-playful sticker-blue mx-auto mb-8 max-w-2xl p-4 text-center">
          <p className="font-display text-sm font-extrabold uppercase tracking-wide text-foreground/50">
            Who you told us you are
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <span className="sticker sticker-yellow text-xs">✨ {profile.vibe}</span>
            <span className="sticker sticker-pink text-xs">🌍 {profile.dream_city}</span>
            <span className="sticker text-xs">🎭 {profile.secret_talent}</span>
            {profile.wild_goal && (
              <span className="sticker sticker-blue text-xs">🚀 {profile.wild_goal}</span>
            )}
          </div>
        </div>
      )}

      {loading && (
        <div className="card-playful mx-auto mb-8 max-w-md p-8 text-center animate-pulse-glow">
          <p className="text-5xl animate-bounce-soft">🌀</p>
          <p className="font-display mt-4 text-xl font-bold">{LOADING_STEPS[loadStep]}</p>
          <p className="mt-2 text-sm font-semibold text-foreground/50">
            Drawing your parallel portraits...
          </p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <TimelinePanel
          title="This Timeline You"
          emoji="🌍"
          subtitle="Grounded. Present. Real you!"
          content={displayThis}
          loading={loading && !displayThis}
          variant="lime"
          avatarUrl={thisTimelineAvatar(avatarSeed)}
          avatarAlt="This timeline you"
        />
        <TimelinePanel
          title="Alternate Timeline You"
          emoji="🪐"
          subtitle="Parallel. Wild. What if?!"
          content={displayAlt}
          loading={loading && !displayAlt}
          variant="pink"
          avatarUrl={alternateTimelineAvatar(avatarSeed)}
          avatarAlt="Alternate timeline you"
        />
      </div>

      {error && (
        <div className="mt-6 text-center">
          <p className="error-bubble inline-block">😅 {error}</p>
          <div className="mt-4">
            <Link href="/questions" className="btn-secondary text-sm">
              🔄 Try again
            </Link>
          </div>
        </div>
      )}

      {done && (
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
  avatarUrl,
  avatarAlt,
}: {
  title: string;
  emoji: string;
  subtitle: string;
  content: string;
  loading: boolean;
  variant: "lime" | "pink";
  avatarUrl: string;
  avatarAlt: string;
}) {
  const cardClass = variant === "lime" ? "card-lime" : "card-pink";

  return (
    <section
      className={`card-playful ${cardClass} p-6 ${loading && !content ? "animate-shimmer" : ""}`}
    >
      <div className="mb-4 flex flex-col items-center">
        <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-foreground bg-white shadow-[4px_4px_0_var(--shadow)]">
          <Image
            src={avatarUrl}
            alt={avatarAlt}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      </div>
      <div className="mb-1 flex items-center justify-center gap-2">
        <span className="text-3xl">{emoji}</span>
        <h2 className="font-display text-xl font-extrabold">{title}</h2>
      </div>
      <p className="mb-4 text-center text-sm font-extrabold uppercase tracking-wide text-foreground/50">
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
