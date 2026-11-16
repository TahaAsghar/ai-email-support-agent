create table users (
  id bigint generated always as identity primary key,
  email text not null unique,
  name text not null,
  password_hash text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index users_email_idx on users (email);

alter table users enable row level security;