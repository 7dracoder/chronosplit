"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BoothHeader } from "@/components/booth-ui";
import { QrJoin } from "@/components/qr-join";

type WallItem = {
  id: string;
  alternate_timeline: string;
  created_at: string;
};

const EMOJIS = ["🪐", "✨", "🌌", "🔮", "⚡", "🌀", "👽", "🎭", "🦄", "🍭", "🎈", "🌈"];

export default function WallPage() {
  const [items, setItems] = useState<WallItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/wall?limit=12")
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="relative mx-auto min-h-screen max-w-5xl px-6 py-16">
      <Link
        href="/"
        className="text-sm font-bold text-foreground/45 hover:text-foreground"
      >
        ← ChronoSplit
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <BoothHeader
            title="Wall of Timelines! 🌌"
            subtitle="Silly alternate-universe snippets from the booth. Anonymized & weird!"
          />

          {loading ? (
            <p className="animate-pulse font-bold text-foreground/45">
              Loading multiverse...
            </p>
          ) : items.length === 0 ? (
            <div className="card-playful card-playful-tilt p-8 text-center">
              <p className="text-6xl">👻</p>
              <p className="mt-3 text-lg font-bold text-foreground/60">
                No timelines yet! Be the first to split yours!
              </p>
              <a href="/auth/login" className="btn-primary mt-6 inline-block">
                🚀 Create yours!
              </a>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item, i) => (
                <li
                  key={item.id}
                  className={`card-playful animate-fade-in p-5 ${i % 2 === 0 ? "card-playful-tilt" : "card-playful-tilt-alt"}`}
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <span className="mb-2 inline-block text-2xl">
                    {EMOJIS[i % EMOJIS.length]}
                  </span>
                  <p className="text-base font-semibold leading-relaxed text-foreground/85">
                    {item.alternate_timeline.length > 280
                      ? `${item.alternate_timeline.slice(0, 280)}…`
                      : item.alternate_timeline}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card-playful card-blue hidden p-6 lg:block">
          <QrJoin size={140} label="📱 Join the fun!" />
        </div>
      </div>
    </main>
  );
}
