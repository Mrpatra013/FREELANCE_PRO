-- Supabase SQL schema (mirror of Prisma models)
-- Apply in Supabase SQL editor: Project → SQL → New query → Run

create extension if not exists pgcrypto;

-- Enums
do $$ begin
  create type project_status as enum ('ACTIVE','COMPLETED','PAUSED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type rate_type as enum ('HOURLY','FIXED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type invoice_status as enum ('PAID','UNPAID');
exception when duplicate_object then null; end $$;

-- Users
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password text not null,
  name text not null,
  created_at timestamptz not null default now(),

  company_name text,
  business_email text,
  phone_number text,
  business_address text,
  logo_url text,
  invoice_settings_complete boolean not null default false,

  bank_name text,
  account_number text,
  account_holder_name text,
  ifsc_code text,
  upi_id text
);

-- Clients
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  email text not null,
  company text,
  phone text,
  address text,
  description text,
  notes text,
  created_at timestamptz not null default now()
);

-- Projects
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  description text,
  rate double precision not null,
  rate_type rate_type not null,
  start_date timestamptz not null,
  deadline timestamptz,
  status project_status not null default 'ACTIVE',
  created_at timestamptz not null default now()
);

-- Invoices
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  invoice_number text not null unique,
  amount double precision not null,
  description text,
  due_date timestamptz not null,
  status invoice_status not null default 'UNPAID',
  created_at timestamptz not null default now(),
  paid_at timestamptz,

  freelancer_company_name text,
  freelancer_business_email text,
  freelancer_logo_url text
);

-- Optional: Enable RLS (configure policies after switching to Supabase Auth)
-- alter table public.users enable row level security;
-- alter table public.clients enable row level security;
-- alter table public.projects enable row level security;
-- alter table public.invoices enable row level security;