import { randomUUID } from "crypto";

export type User = {
  id: string;
  auth0_sub: string;
  email: string;
  name: string | null;
  created_at: string;
};

export type ProfileSubmission = {
  id: string;
  user_id: string;
  vibe: string;
  dream_city: string;
  secret_talent: string;
  wild_goal: string | null;
  created_at: string;
};

export type Timeline = {
  id: string;
  user_id: string;
  profile_submission_id: string;
  this_timeline: string;
  alternate_timeline: string;
  email_sent: boolean;
  created_at: string;
};

type TimelineWithSubmission = Timeline & {
  profile_submissions: ProfileSubmission;
};

const users = new Map<string, User>();
const usersByAuth0 = new Map<string, User>();
const submissions = new Map<string, ProfileSubmission>();
const timelines = new Map<string, Timeline>();

export function isMemoryStoreEnabled() {
  return !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL;
}

export async function memoryUpsertUser(params: {
  auth0Sub: string;
  email: string;
  name?: string | null;
}): Promise<User> {
  const existing = usersByAuth0.get(params.auth0Sub);
  if (existing) {
    const updated: User = {
      ...existing,
      email: params.email,
      name: params.name ?? existing.name,
    };
    users.set(updated.id, updated);
    usersByAuth0.set(params.auth0Sub, updated);
    return updated;
  }

  const user: User = {
    id: randomUUID(),
    auth0_sub: params.auth0Sub,
    email: params.email,
    name: params.name ?? null,
    created_at: new Date().toISOString(),
  };
  users.set(user.id, user);
  usersByAuth0.set(params.auth0Sub, user);
  return user;
}

export async function memoryCreateSubmission(params: {
  userId: string;
  vibe: string;
  dream_city: string;
  secret_talent: string;
  wild_goal: string | null;
}): Promise<ProfileSubmission> {
  const row: ProfileSubmission = {
    id: randomUUID(),
    user_id: params.userId,
    vibe: params.vibe,
    dream_city: params.dream_city,
    secret_talent: params.secret_talent,
    wild_goal: params.wild_goal,
    created_at: new Date().toISOString(),
  };
  submissions.set(row.id, row);
  return row;
}

export async function memoryGetSubmission(params: {
  submissionId: string;
  userId: string;
}): Promise<ProfileSubmission | null> {
  const row = submissions.get(params.submissionId);
  if (!row || row.user_id !== params.userId) return null;
  return row;
}

export async function memoryCreateTimeline(params: {
  userId: string;
  profileSubmissionId: string;
  this_timeline: string;
  alternate_timeline: string;
}): Promise<Timeline> {
  const row: Timeline = {
    id: randomUUID(),
    user_id: params.userId,
    profile_submission_id: params.profileSubmissionId,
    this_timeline: params.this_timeline,
    alternate_timeline: params.alternate_timeline,
    email_sent: false,
    created_at: new Date().toISOString(),
  };
  timelines.set(row.id, row);
  return row;
}

export async function memoryGetTimelineBySubmission(params: {
  submissionId: string;
  userId: string;
}): Promise<TimelineWithSubmission | null> {
  for (const timeline of timelines.values()) {
    if (
      timeline.profile_submission_id === params.submissionId &&
      timeline.user_id === params.userId
    ) {
      const sub = submissions.get(timeline.profile_submission_id);
      if (!sub) return null;
      return { ...timeline, profile_submissions: sub };
    }
  }
  return null;
}

export async function memoryMarkEmailSent(timelineId: string) {
  const row = timelines.get(timelineId);
  if (row) timelines.set(timelineId, { ...row, email_sent: true });
}

export async function memoryGetWallItems(limit: number) {
  return [...timelines.values()]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, limit)
    .map((t) => ({
      id: t.id,
      alternate_timeline: t.alternate_timeline,
      created_at: t.created_at,
    }));
}
