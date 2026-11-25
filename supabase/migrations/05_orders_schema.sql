-- ==============================================================================
-- KhetiTantra — End-to-End Procurement & Orders Migration
-- ==============================================================================
-- Run this in the Supabase SQL Editor to enable wholesale supply chain orders,
-- procurement tracking, counterparty permissions, and ledger synchronization.

-- 1. ORDERS TABLE
create table if not exists public.orders (
  id                  uuid primary key default gen_random_uuid(),
  listing_id          uuid references public.listings(id) on delete set null,
  farmer_id           uuid not null references public.profiles(id) on delete cascade,
  retailer_id         uuid not null references public.profiles(id) on delete cascade,

  -- Produce specifications snapshot (persists even if listing changes/deletes)
  crop_name           text not null,
  category            text not null,
  quantity            numeric not null check (quantity > 0),
  unit                text not null,
  unit_price          numeric not null check (unit_price > 0),
  total_amount        numeric not null check (total_amount > 0),

  -- Order lifecycle state
  status              text not null default 'pending'
                        check (status in ('pending', 'confirmed', 'dispatched', 'delivered', 'cancelled')),

  -- Logistics & fulfillment
  delivery_address    text not null,
  delivery_phone      text,
  notes               text,

  -- Linked farm cycle & auto ledger sync
  linked_crop_id      uuid references public.crops(id) on delete set null,
  ledger_transaction_id uuid references public.transactions(id) on delete set null,

  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- Index for high-performance order queries by user and status
create index if not exists idx_orders_farmer_id on public.orders (farmer_id);
create index if not exists idx_orders_retailer_id on public.orders (retailer_id);
create index if not exists idx_orders_status on public.orders (status);

-- Auto-update updated_at timestamp
create or replace function public.set_orders_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at
  before update on public.orders
  for each row execute procedure public.set_orders_updated_at();

-- 2. ENSURE TRANSACTIONS TABLE ACCEPTS NULL CROP_ID FOR GENERAL/PROCUREMENT SALES
alter table public.transactions alter column crop_id drop not null;

-- 3. ROW LEVEL SECURITY (RLS) FOR ORDERS
alter table public.orders enable row level security;

-- Drop existing policies if re-running
drop policy if exists "Users can view their own orders as buyer or seller" on public.orders;
drop policy if exists "Retailers can create purchase orders" on public.orders;
drop policy if exists "Parties can update order lifecycle" on public.orders;
drop policy if exists "Users can delete cancelled orders" on public.orders;

-- Policy 1: Buyers, sellers, and admins can view orders
create policy "Users can view their own orders as buyer or seller"
  on public.orders for select
  using (
    auth.role() = 'authenticated' and (
      auth.uid() = retailer_id or
      auth.uid() = farmer_id or
      exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
    )
  );

-- Policy 2: Authenticated buyers can insert orders
create policy "Retailers can create purchase orders"
  on public.orders for insert
  with check (
    auth.role() = 'authenticated' and
    auth.uid() = retailer_id
  );

-- Policy 3: Buyers, sellers, and admins can update order status
create policy "Parties can update order lifecycle"
  on public.orders for update
  using (
    auth.role() = 'authenticated' and (
      auth.uid() = retailer_id or
      auth.uid() = farmer_id or
      exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
    )
  );

-- Policy 4: Buyers can delete their own cancelled orders
create policy "Users can delete cancelled orders"
  on public.orders for delete
  using (
    auth.role() = 'authenticated' and (
      (auth.uid() = retailer_id and status = 'cancelled') or
      exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
    )
  );

