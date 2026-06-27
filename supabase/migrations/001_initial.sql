-- ChronoSplit initial schema

create extension if not exists "uuid-ossp";

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  auth0_sub text unique not null,
  email text not null,
  name text,
  created_at timestamptz not null default now()
);

create table if not exists profile_submissions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  vibe text not null,
  dream_city text not null,
  secret_talent text not null,
  wild_goal text,
  created_at timestamptz not null default now()
);

create table if not exists timelines (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  profile_submission_id uuid not null references profile_submissions(id) on delete cascade,
  this_timeline text not null,
  alternate_timeline text not null,
  email_sent boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_profile_submissions_user_id on profile_submissions(user_id);
create index if not exists idx_timelines_user_id on timelines(user_id);
create index if not exists idx_timelines_created_at on timelines(created_at desc);

alter table users enable row level security;
alter table profile_submissions enable row level security;
alter table timelines enable row level security;

-- Service role bypasses RLS; anon has no direct access (API uses service role)
