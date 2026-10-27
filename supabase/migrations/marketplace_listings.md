# KhetiTantra — Marketplace Migration

Run this in the **Supabase SQL Editor** to add the `listings` table and all required policies.

```sql
-- 1. LISTINGS TABLE
create table public.listings (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users on delete cascade,
  linked_crop_id      uuid references public.crops on delete set null,

  crop_type           text not null,
  category            text not null check (category in (
                        'Vegetables', 'Fruits', 'Grains', 'Pulses', 'Spices', 'Other'
                      )),

  price_per_unit      numeric not null check (price_per_unit > 0),
  quantity_available  numeric not null check (quantity_available > 0),
  unit                text not null check (unit in (
                        'quintal', 'kg', 'ton', 'dozen', 'piece'
                      )),

  description         text,
  harvest_date        date,
  status              text not null default 'active'
                        check (status in ('active', 'sold', 'cancelled')),

  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- Auto-update the updated_at timestamp
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger listings_updated_at
  before update on public.listings
  for each row execute procedure public.set_updated_at();


-- 2. ROW LEVEL SECURITY
alter table public.listings enable row level security;

-- Anyone authenticated can browse active listings
create policy "Authenticated users can view active listings"
  on public.listings for select
  using (auth.role() = 'authenticated' and status = 'active');

-- Owners can see all their own listings (including sold/cancelled)
create policy "Owners can view all their own listings"
  on public.listings for select
  using (auth.uid() = user_id);

-- Only the listing owner can insert
create policy "Users can create own listings"
  on public.listings for insert
  with check (auth.uid() = user_id);

-- Only the listing owner can update
create policy "Users can update own listings"
  on public.listings for update
  using (auth.uid() = user_id);

-- Only the listing owner can delete
create policy "Users can delete own listings"
  on public.listings for delete
  using (auth.uid() = user_id);


-- 3. ALLOW CROSS-USER PROFILE READS FOR MARKETPLACE
-- Buyers need to see seller name, village, district, phone.
-- Remove the old "Users can view own profile" SELECT policy first if needed.
create policy "Authenticated users can read any profile"
  on public.profiles for select
  using (auth.role() = 'authenticated');
```

> NOTE: The last policy allows any logged-in user to read any profile row.
> If you already have a restrictive SELECT policy on profiles, drop it first:
>   DROP POLICY "Users can view own profile" ON public.profiles;
> Then re-run the new policy above.
