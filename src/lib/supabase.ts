import {
  isMemoryStoreEnabled,
  memoryCreateSubmission,
  memoryCreateTimeline,
  memoryGetSubmission,
  memoryGetTimelineBySubmission,
  memoryGetWallItems,
  memoryMarkEmailSent,
  memoryUpsertUser,
  type ProfileSubmission,
  type Timeline,
  type User,
} from "@/lib/memory-store";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export type { User, ProfileSubmission, Timeline };

let supabaseTablesOk: boolean | null = null;

function isMissingTableError(message: string) {
  return (
    message.includes("Could not find the table") ||
    message.includes("relation") ||
    message.includes("PGRST205")
  );
}

function getSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  return url;
}

function getServiceKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return key;
}

export function createServiceClient(): SupabaseClient {
  return createClient(getSupabaseUrl(), getServiceKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function hasSupabase() {
  return !isMemoryStoreEnabled() && supabaseTablesOk !== false;
}

async function shouldUseSupabase(): Promise<boolean> {
  if (isMemoryStoreEnabled()) return false;
  if (supabaseTablesOk === false) return false;
  if (supabaseTablesOk === true) return true;

  const supabase = createServiceClient();
  const { error } = await supabase.from("users").select("id").limit(1);
  if (error && isMissingTableError(error.message)) {
    supabaseTablesOk = false;
    console.warn("[ChronoSplit] Supabase tables missing, using in-memory store");
    return false;
  }
  if (error) throw error;
  supabaseTablesOk = true;
  return true;
}

export async function upsertUser(params: {
  auth0Sub: string;
  email: string;
  name?: string | null;
}): Promise<User> {
  if (!(await shouldUseSupabase())) return memoryUpsertUser(params);

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("users")
    .upsert(
      {
        auth0_sub: params.auth0Sub,
        email: params.email,
        name: params.name ?? null,
      },
      { onConflict: "auth0_sub" }
    )
    .select()
    .single();

  if (error) {
    if (isMissingTableError(error.message)) {
      supabaseTablesOk = false;
      return memoryUpsertUser(params);
    }
    throw error;
  }
  return data as User;
}

export async function createSubmission(params: {
  userId: string;
  vibe: string;
  dream_city: string;
  secret_talent: string;
  wild_goal: string | null;
}): Promise<{ id: string }> {
  if (!(await shouldUseSupabase())) {
    const row = await memoryCreateSubmission(params);
    return { id: row.id };
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("profile_submissions")
    .insert({
      user_id: params.userId,
      vibe: params.vibe,
      dream_city: params.dream_city,
      secret_talent: params.secret_talent,
      wild_goal: params.wild_goal,
    })
    .select("id")
    .single();

  if (error) {
    if (isMissingTableError(error.message)) {
      supabaseTablesOk = false;
      const row = await memoryCreateSubmission(params);
      return { id: row.id };
    }
    throw error;
  }
  return { id: data.id };
}

export async function getSubmissionForUser(params: {
  submissionId: string;
  userId: string;
}): Promise<ProfileSubmission | null> {
  if (!(await shouldUseSupabase())) return memoryGetSubmission(params);

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("profile_submissions")
    .select("*")
    .eq("id", params.submissionId)
    .eq("user_id", params.userId)
    .single();

  if (error) return null;
  return data as ProfileSubmission;
}

export async function saveTimeline(params: {
  userId: string;
  profileSubmissionId: string;
  this_timeline: string;
  alternate_timeline: string;
}): Promise<Timeline> {
  if (!(await shouldUseSupabase())) return memoryCreateTimeline(params);

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("timelines")
    .insert({
      user_id: params.userId,
      profile_submission_id: params.profileSubmissionId,
      this_timeline: params.this_timeline,
      alternate_timeline: params.alternate_timeline,
    })
    .select()
    .single();

  if (error) {
    if (isMissingTableError(error.message)) {
      supabaseTablesOk = false;
      return memoryCreateTimeline(params);
    }
    throw error;
  }
  return data as Timeline;
}

export async function getTimelineBySubmission(params: {
  submissionId: string;
  userId: string;
}) {
  if (!(await shouldUseSupabase())) return memoryGetTimelineBySubmission(params);

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("timelines")
    .select("*, profile_submissions(*)")
    .eq("profile_submission_id", params.submissionId)
    .eq("user_id", params.userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function markEmailSent(timelineId: string) {
  if (!(await shouldUseSupabase())) return memoryMarkEmailSent(timelineId);

  const supabase = createServiceClient();
  await supabase.from("timelines").update({ email_sent: true }).eq("id", timelineId);
}

export async function getWallItems(limit: number) {
  if (!(await shouldUseSupabase())) return memoryGetWallItems(limit);

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("timelines")
    .select("id, alternate_timeline, created_at")
    .order("created_at", { ascending: false })
    .limit(limit * 3);

  if (error) {
    if (isMissingTableError(error.message)) {
      supabaseTablesOk = false;
      return memoryGetWallItems(limit);
    }
    throw error;
  }

  return (data ?? [])
    .sort(() => Math.random() - 0.5)
    .slice(0, limit);
}
