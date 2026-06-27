import { auth0 } from "@/lib/auth0";
import { upsertUser } from "@/lib/supabase";

export async function requireSession() {
  const session = await auth0.getSession();
  if (!session?.user) {
    return null;
  }
  return session;
}

export async function getOrCreateDbUser() {
  const session = await requireSession();
  if (!session?.user) return null;

  const sub = session.user.sub;
  const email = session.user.email;
  if (!sub || !email) return null;

  const user = await upsertUser({
    auth0Sub: sub,
    email,
    name: session.user.name ?? session.user.nickname ?? null,
  });

  return { session, user };
}
