-- ========================================================
-- RECYCLO: Database Schema & Row Level Security (RLS)
-- Supabase PostgreSQL 15+ compatible
-- ========================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Create Enums
create type user_role as enum ('generator', 'collector', 'admin');
create type listing_status as enum ('available', 'pending_pickup', 'sold');
create type transaction_status as enum ('pending', 'completed', 'cancelled');

-- 2. Users / Profiles Table (synced with Supabase Auth)
create table public.users (
    id uuid references auth.users on delete cascade primary key,
    email text,
    role user_role not null default 'generator',
    full_name text,
    contact_info text,
    location jsonb default '{"city": "Metropolis", "lat": 0.0, "lng": 0.0, "address": ""}'::jsonb,
    green_points integer not null default 0,
    created_at timestamptz not null default timezone('utc'::text, now()),
    updated_at timestamptz not null default timezone('utc'::text, now())
);

-- Trigger to sync auth.users with public.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'Eco User'),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'generator'::user_role)
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Restoration Products Table (Cross-sell catalog)
create table public.restoration_products (
    id uuid primary key default gen_random_uuid(),
    product_name text not null,
    category text not null,
    price numeric(10, 2) not null check (price >= 0),
    affiliate_link_or_internal_stock text not null,
    description text,
    image_url text,
    tags text[] default array[]::text[],
    in_stock boolean default true,
    created_at timestamptz not null default timezone('utc'::text, now())
);

-- 4. Marketplace Listings Table
create table public.marketplace_listings (
    id uuid primary key default gen_random_uuid(),
    generator_id uuid not null references public.users(id) on delete cascade,
    item_name text not null,
    category text not null,
    materials text[] default array[]::text[],
    condition text not null,
    ai_estimated_value numeric(10, 2) check (ai_estimated_value >= 0),
    user_asking_price numeric(10, 2) not null check (user_asking_price >= 0),
    image_url text,
    status listing_status not null default 'available',
    location jsonb,
    ai_analysis jsonb,
    created_at timestamptz not null default timezone('utc'::text, now()),
    updated_at timestamptz not null default timezone('utc'::text, now())
);

-- 5. Transaction History Table
create table public.transaction_history (
    id uuid primary key default gen_random_uuid(),
    listing_id uuid not null references public.marketplace_listings(id) on delete restrict,
    generator_id uuid not null references public.users(id) on delete restrict,
    collector_id uuid not null references public.users(id) on delete restrict,
    final_price numeric(10, 2) not null check (final_price >= 0),
    status transaction_status not null default 'completed',
    green_points_awarded integer not null default 25,
    completed_at timestamptz not null default timezone('utc'::text, now())
);

-- Auto-award Green Points on successful transaction
create or replace function public.handle_transaction_completion()
returns trigger as $$
begin
  if new.status = 'completed' and (old.status is distinct from 'completed') then
    -- Award points to waste generator
    update public.users
    set green_points = green_points + new.green_points_awarded
    where id = new.generator_id;

    -- Award bonus points to collector for diversion from landfill
    update public.users
    set green_points = green_points + (new.green_points_awarded / 2)
    where id = new.collector_id;

    -- Mark listing as sold
    update public.marketplace_listings
    set status = 'sold', updated_at = now()
    where id = new.listing_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_transaction_completed
  after insert or update on public.transaction_history
  for each row execute procedure public.handle_transaction_completion();

-- Indexes for performance
create index idx_listings_status on public.marketplace_listings(status);
create index idx_listings_category on public.marketplace_listings(category);
create index idx_listings_generator on public.marketplace_listings(generator_id);
create index idx_products_category on public.restoration_products(category);
create index idx_transactions_participants on public.transaction_history(generator_id, collector_id);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================

alter table public.users enable row level security;
alter table public.restoration_products enable row level security;
alter table public.marketplace_listings enable row level security;
alter table public.transaction_history enable row level security;

-- USERS POLICIES
create policy "Users can read own profile or basic public profiles"
  on public.users for select
  using (true);

create policy "Users can update only their own profile"
  on public.users for update
  using (auth.uid() = id);

-- RESTORATION PRODUCTS POLICIES
create policy "Anyone can view restoration products"
  on public.restoration_products for select
  using (true);

create policy "Only service role can manage restoration products"
  on public.restoration_products for all
  using (auth.jwt()->>'role' = 'service_role');

-- MARKETPLACE LISTINGS POLICIES
create policy "Anyone can view available marketplace listings"
  on public.marketplace_listings for select
  using (status = 'available' or auth.uid() = generator_id);

create policy "Generators can create listings"
  on public.marketplace_listings for insert
  with check (auth.uid() = generator_id);

create policy "Generators can update their own listings"
  on public.marketplace_listings for update
  using (auth.uid() = generator_id);

create policy "Generators can delete their own listings"
  on public.marketplace_listings for delete
  using (auth.uid() = generator_id and status = 'available');

create policy "Collectors can reserve/book listings (pending_pickup)"
  on public.marketplace_listings for update
  using (status = 'available')
  with check (status = 'pending_pickup');

-- TRANSACTION HISTORY POLICIES
create policy "Participants can view their transactions"
  on public.transaction_history for select
  using (auth.uid() = generator_id or auth.uid() = collector_id);

create policy "Collectors can initiate booking transactions"
  on public.transaction_history for insert
  with check (auth.uid() = collector_id);

-- ========================================================
-- STORAGE BUCKET CONFIGURATION (for Supabase Storage)
-- ========================================================
insert into storage.buckets (id, name, public)
values ('item-images', 'item-images', true)
on conflict (id) do nothing;

create policy "Item images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'item-images');

create policy "Authenticated users can upload item images"
  on storage.objects for insert
  with check (bucket_id = 'item-images' and auth.role() = 'authenticated');
