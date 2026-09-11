create extension if not exists pgcrypto;

create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists social_accounts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  platform text not null check (platform in ('facebook','instagram','threads','youtube','tiktok','snapchat','linkedin','x','pinterest')),
  display_name text not null,
  external_account_id text not null,
  access_token_enc text not null,
  refresh_token_enc text,
  scopes text[] not null default '{}',
  status text not null default 'connected' check (status in ('connected','expired','revoked','pending','disabled')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(platform,external_account_id)
);

create table if not exists media_assets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  name text not null,
  media_type text not null check (media_type in ('image','video')),
  source_url text not null,
  checksum text,
  approved boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  name text not null,
  status text not null default 'draft' check (status in ('draft','active','paused','completed','archived')),
  daily_slot_target int not null default 1 check (daily_slot_target between 1 and 20),
  start_at timestamptz,
  end_at timestamptz,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists scheduled_posts (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete cascade,
  social_account_id uuid references social_accounts(id) on delete cascade,
  media_asset_id uuid references media_assets(id),
  title text,
  caption text not null,
  media_url text not null,
  media_type text not null check (media_type in ('image','video')),
  scheduled_for timestamptz not null,
  status text not null default 'queued' check (status in ('queued','publishing','published','failed','cancelled','approval_required')),
  attempt_count int not null default 0,
  max_attempts int not null default 3,
  external_post_id text,
  last_error text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_scheduled_posts_due on scheduled_posts(status,scheduled_for);

create table if not exists publish_attempts (
  id bigserial primary key,
  scheduled_post_id uuid references scheduled_posts(id) on delete cascade,
  status text not null,
  response jsonb,
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists analytics_events (
  id bigserial primary key,
  scheduled_post_id uuid references scheduled_posts(id) on delete cascade,
  metric text not null,
  value numeric not null,
  observed_at timestamptz not null default now(),
  raw jsonb not null default '{}'::jsonb
);

create table if not exists audit_events (
  id bigserial primary key,
  actor text not null,
  event_type text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists system_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
insert into system_settings(key,value) values ('global_pause','false') on conflict (key) do nothing;
