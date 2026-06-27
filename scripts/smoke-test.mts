import {
  memoryUpsertUser,
  memoryCreateSubmission,
  memoryCreateTimeline,
  memoryGetTimelineBySubmission,
  memoryGetWallItems,
} from "../src/lib/memory-store";
import { templateTimeline, hasAnthropicKey } from "../src/lib/timeline-agent";

async function main() {
  const failures: string[] = [];

  function ok(label: string) {
    console.log(`✓ ${label}`);
  }

  function fail(label: string, err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    failures.push(`${label}: ${msg}`);
    console.error(`✗ ${label} — ${msg}`);
  }

  try {
    const user = await memoryUpsertUser({
      auth0Sub: "auth0|smoke-test",
      email: "smoke@chronosplit.dev",
      name: "Smoke Tester",
    });
    ok("user upsert");

    const submission = await memoryCreateSubmission({
      userId: user.id,
      vibe: "curious, bold, caffeinated",
      dream_city: "Tokyo",
      secret_talent: "speed-cubing",
      wild_goal: "open a midnight ramen lab",
    });
    ok("submission create");

    const timeline = templateTimeline({
      vibe: submission.vibe,
      dream_city: submission.dream_city,
      secret_talent: submission.secret_talent,
      wild_goal: submission.wild_goal,
    });

    if (!timeline.this_timeline || !timeline.alternate_timeline) {
      throw new Error("template timeline empty");
    }
    ok(`template AI (anthropic configured: ${hasAnthropicKey()})`);

    await memoryCreateTimeline({
      userId: user.id,
      profileSubmissionId: submission.id,
      this_timeline: timeline.this_timeline,
      alternate_timeline: timeline.alternate_timeline,
    });
    ok("timeline save");

    const fetched = await memoryGetTimelineBySubmission({
      submissionId: submission.id,
      userId: user.id,
    });
    if (!fetched?.this_timeline) throw new Error("timeline fetch failed");
    ok("timeline fetch");

    const wall = await memoryGetWallItems(5);
    if (wall.length < 1) throw new Error("wall empty");
    ok(`wall (${wall.length} items)`);
  } catch (err) {
    fail("data pipeline", err);
  }

  const routes = [
    ["health", "http://localhost:3000/api/health"],
    ["home", "http://localhost:3000/"],
    ["wall page", "http://localhost:3000/wall"],
    ["wall api", "http://localhost:3000/api/wall"],
  ] as const;

  for (const [name, url] of routes) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      ok(`route ${name}`);
    } catch (err) {
      fail(`route ${name}`, err);
    }
  }

  try {
    const res = await fetch("http://localhost:3000/auth/login", {
      redirect: "manual",
    });
    if (res.status !== 307 && res.status !== 302) {
      throw new Error(`expected redirect, got ${res.status}`);
    }
    const location = res.headers.get("location") ?? "";
    if (!location.includes("auth0.com/authorize")) {
      throw new Error("missing auth0 authorize redirect");
    }
    ok("auth0 login redirect");
  } catch (err) {
    fail("auth0 login redirect", err);
  }

  if (failures.length) {
    console.error(`\n${failures.length} failure(s)`);
    process.exit(1);
  }

  console.log("\nAll smoke tests passed.");
}

main();
