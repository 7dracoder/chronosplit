"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BoothHeader } from "@/components/booth-ui";

const PROMPTS = [
  {
    key: "vibe" as const,
    emoji: "✨",
    label: "Your vibe in 3 words!",
    placeholder: "curious, caffeinated, chaotic",
    required: true,
  },
  {
    key: "dream_city" as const,
    emoji: "🌍",
    label: "Dream city to live in",
    placeholder: "Tokyo, NYC, Reykjavik...",
    required: true,
  },
  {
    key: "secret_talent" as const,
    emoji: "🎭",
    label: "Secret talent or hobby",
    placeholder: "underwater basket weaving",
    required: true,
  },
  {
    key: "wild_goal" as const,
    emoji: "🚀",
    label: "Wild goal (optional but fun!)",
    placeholder: "open a cat café on Mars",
    required: false,
  },
];

export default function QuestionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    vibe: "",
    dream_city: "",
    secret_talent: "",
    wild_goal: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.status === 401) {
        window.location.href = "/auth/login?returnTo=/questions";
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save answers");

      router.push(`/timeline?submission=${data.submission_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative mx-auto min-h-screen max-w-xl px-6 py-16">
      <Link
        href="/"
        className="mb-8 inline-block text-sm font-bold text-foreground/45 hover:text-foreground"
      >
        ← ChronoSplit
      </Link>

      <BoothHeader
        step="Step 1 of 2 · Question time!"
        title="Tell the multiverse about you! 🎤"
        subtitle="No wrong answers. Be weird. Be silly. Be YOU!"
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        {PROMPTS.map((p, i) => (
          <label
            key={p.key}
            className={`card-playful block p-5 ${i % 2 === 0 ? "card-playful-tilt" : "card-playful-tilt-alt"}`}
          >
            <span className="mb-2 flex items-center gap-2 text-base font-extrabold text-foreground">
              <span className="text-2xl">{p.emoji}</span>
              {p.label}
            </span>
            <input
              name={p.key}
              value={form[p.key]}
              onChange={(e) => setForm((f) => ({ ...f, [p.key]: e.target.value }))}
              placeholder={p.placeholder}
              required={p.required}
              className="input-playful"
            />
          </label>
        ))}

        {error && <p className="error-bubble">😅 {error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "⏳ Splitting the universe..." : "🌀 Split my timeline!"}
        </button>
      </form>
    </main>
  );
}
