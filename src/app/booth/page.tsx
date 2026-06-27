import { QrJoin } from "@/components/qr-join";
import Link from "next/link";

export default function BoothPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-6 py-12 text-center">
      <div className="sticker sticker-pink mb-6 animate-wiggle text-lg">
        🎪 ChronoSplit Booth!
      </div>
      <h1 className="font-display mb-4 max-w-3xl text-5xl font-extrabold sm:text-6xl md:text-8xl">
        Scan to enter the{" "}
        <span className="rainbow-text">multiverse!</span>
      </h1>
      <p className="mb-10 max-w-xl text-xl font-bold text-foreground/70">
        Point your camera here! Answer fun questions! Meet your parallel you!
        Easy peasy! 🍭
      </p>

      <div className="card-playful animate-pulse-glow p-10 md:p-14">
        <QrJoin size={300} label="📱 SCAN ME!!!" showUrl={true} />
      </div>

      <div className="mt-12 flex flex-wrap justify-center gap-3">
        <span className="sticker sticker-yellow">✨ Magic timelines</span>
        <span className="sticker sticker-blue">🌌 Parallel you</span>
        <span className="sticker sticker-pink">💌 Email souvenir</span>
      </div>

      <Link
        href="/"
        className="mt-10 text-sm font-bold text-foreground/45 hover:text-foreground"
      >
        ← Back home
      </Link>
    </main>
  );
}
