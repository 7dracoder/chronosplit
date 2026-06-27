import Link from "next/link";
import { redirect } from "next/navigation";
import { QrJoin } from "@/components/qr-join";
import { auth0 } from "@/lib/auth0";

const LOGIN_URL = "/auth/login?returnTo=/questions";

export default async function HomePage() {
  const session = await auth0.getSession();
  if (session?.user) {
    redirect("/questions");
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-12 px-6 py-16 lg:flex-row lg:gap-16 lg:text-left">
        <div className="flex-1 text-center lg:text-left">
          <div className="sticker sticker-yellow mx-auto mb-5 w-fit animate-wiggle lg:mx-0">
            🎪 Multiverse Photo Booth!
          </div>
          <h1 className="font-display mb-5 text-5xl font-extrabold leading-tight sm:text-7xl">
            Chrono<span className="rainbow-text">Split</span>
          </h1>
          <p className="mb-3 max-w-xl text-2xl font-extrabold text-foreground">
            Meet your parallel you! ✨🦄
          </p>
          <p className="mb-8 max-w-lg text-lg font-semibold text-foreground/70">
            Answer silly questions. Watch magic happen. Find out who you are
            here AND in a goofy alternate universe!
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
            <a href={LOGIN_URL} className="btn-primary text-center">
              🚀 Let&apos;s goooo!
            </a>
            <Link href="/wall" className="btn-secondary text-center">
              👀 Peek at the wall
            </Link>
          </div>

          <p className="mt-8 text-sm font-bold text-foreground/45">
            Just for fun! Made-up stories! 🎉
          </p>
        </div>

        <div className="card-playful card-playful-tilt animate-float flex flex-col items-center p-8 lg:p-10">
          <QrJoin size={200} label="📱 Scan to join the fun!" />
          <div className="mt-6 grid w-full gap-3 text-left text-base font-bold text-foreground/70">
            <p>1️⃣ Scan with your phone!</p>
            <p>2️⃣ Sign in & answer 4 silly Qs</p>
            <p>3️⃣ Watch your twin timelines pop up</p>
            <p>4️⃣ Get a cool email keepsake 💌</p>
          </div>
          <Link
            href="/booth"
            className="mt-6 font-display text-sm font-bold text-accent hover:underline"
          >
            Big screen booth mode →
          </Link>
        </div>
      </div>
    </main>
  );
}
