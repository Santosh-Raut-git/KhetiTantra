# KhetiTantra Supabase Schema

To ensure the backend for KhetiTantra is perfectly set up and fully compatible with the React Native Expo app we built, run the following SQL query in the **SQL Editor** of your Supabase Dashboard. 

This script will set up all tables, triggers, views, storage buckets, and Row Level Security (RLS) policies required for the application.

```sql
-- 1. PROFILES TABLE & AUTH TRIGGER
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  phone text,
  village text,
  district text,
  land_area_acres numeric,
  preferred_language text default 'en',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Trigger to automatically create a profile when a new user signs up
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. CROPS TABLE
create table public.crops (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  crop_name text not null,
  variety text,
  season text not null check (season in ('Kharif', 'Rabi', 'Zaid')),
  area_acres numeric,
  sowing_date date not null,
  expected_harvest_date date,
  status text not null check (status in ('active', 'harvested', 'failed')),
  actual_harvest_date date,
  yield_quantity numeric,
  yield_unit text default 'quintal',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);


-- 3. TRANSACTIONS TABLE
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  crop_id uuid not null references public.crops on delete cascade,
  amount numeric not null,
  transaction_date date not null,
  type text not null check (type in ('income', 'expense')),
  category text not null,
  description text,
  receipt_url text,
  created_at timestamptz default now()
);


-- 4. CROP PROFITS VIEW
-- A view to automatically calculate the net profit for each crop
create view public.crop_profits as
select
  c.id          as crop_id,
  c.user_id,
  c.crop_name,
  c.season,
  coalesce(sum(case when t.type = 'income'  then t.amount else 0         end), 0) as total_income,
  coalesce(sum(case when t.type = 'expense' then t.amount else 0         end), 0) as total_expense,
  coalesce(sum(case when t.type = 'income'  then t.amount else -t.amount end), 0) as net_profit
from public.crops c
left join public.transactions t on c.id = t.crop_id
group by c.id, c.user_id, c.crop_name, c.season;


-- 5. AI CHAT TABLES
create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  title text,
  created_at timestamptz default now()
);

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);


-- 6. ROW LEVEL SECURITY (RLS) POLICIES
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

alter table public.crops enable row level security;
create policy "Users can view own crops" on public.crops for select using (auth.uid() = user_id);
create policy "Users can insert own crops" on public.crops for insert with check (auth.uid() = user_id);
create policy "Users can update own crops" on public.crops for update using (auth.uid() = user_id);
create policy "Users can delete own crops" on public.crops for delete using (auth.uid() = user_id);

alter table public.transactions enable row level security;
create policy "Users can view own transactions" on public.transactions for select using (auth.uid() = user_id);
create policy "Users can insert own transactions" on public.transactions for insert with check (auth.uid() = user_id);
create policy "Users can update own transactions" on public.transactions for update using (auth.uid() = user_id);
create policy "Users can delete own transactions" on public.transactions for delete using (auth.uid() = user_id);

alter table public.ai_conversations enable row level security;
create policy "Users can view own convos" on public.ai_conversations for select using (auth.uid() = user_id);
create policy "Users can insert own convos" on public.ai_conversations for insert with check (auth.uid() = user_id);
create policy "Users can update own convos" on public.ai_conversations for update using (auth.uid() = user_id);
create policy "Users can delete own convos" on public.ai_conversations for delete using (auth.uid() = user_id);

alter table public.ai_messages enable row level security;
create policy "Users can manage own messages" on public.ai_messages
for all using (
  conversation_id in (select id from public.ai_conversations where user_id = auth.uid())
) with check (
  conversation_id in (select id from public.ai_conversations where user_id = auth.uid())
);


-- 7. STORAGE BUCKET FOR RECEIPTS
-- Create the receipts bucket (public so images can be rendered in the app)
insert into storage.buckets (id, name, public) values ('receipts', 'receipts', true);

-- Storage RLS Policies
create policy "Receipts are publicly accessible." on storage.objects for select using (bucket_id = 'receipts');

-- Users can only upload, update, and delete files inside a folder named with their own User ID
create policy "Users can upload receipts" on storage.objects for insert with check (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can update own receipts" on storage.objects for update using (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can delete own receipts" on storage.objects for delete using (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);
```
