const FLOATERS = [
  { emoji: "⭐", left: "5%", delay: "0s", dur: "12s", size: "text-3xl" },
  { emoji: "🦄", left: "18%", delay: "1s", dur: "16s", size: "text-4xl" },
  { emoji: "🍭", left: "35%", delay: "2s", dur: "14s", size: "text-2xl" },
  { emoji: "🌈", left: "52%", delay: "0.5s", dur: "18s", size: "text-3xl" },
  { emoji: "🚀", left: "68%", delay: "3s", dur: "15s", size: "text-3xl" },
  { emoji: "🎈", left: "82%", delay: "1.5s", dur: "17s", size: "text-4xl" },
  { emoji: "✨", left: "92%", delay: "4s", dur: "13s", size: "text-2xl" },
  { emoji: "🪐", left: "25%", delay: "2.5s", dur: "19s", size: "text-3xl" },
  { emoji: "🎪", left: "75%", delay: "0.8s", dur: "20s", size: "text-3xl" },
];

export function BoothBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      {FLOATERS.map((f) => (
        <span
          key={f.emoji + f.left}
          className={`absolute bottom-[-10%] opacity-50 ${f.size}`}
          style={{
            left: f.left,
            animation: `drift ${f.dur} linear infinite`,
            animationDelay: f.delay,
          }}
        >
          {f.emoji}
        </span>
      ))}
    </div>
  );
}

export function BoothHeader({
  step,
  title,
  subtitle,
}: {
  step?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="mb-10 text-center">
      {step && (
        <p className="sticker sticker-blue mx-auto mb-4 w-fit">{step}</p>
      )}
      <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
        {title}
      </h1>
      {subtitle && (
        <p className="mx-auto mt-4 max-w-lg text-lg font-semibold text-foreground/75">
          {subtitle}
        </p>
      )}
    </header>
  );
}
