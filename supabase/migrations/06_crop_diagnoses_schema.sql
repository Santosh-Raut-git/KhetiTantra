-- Migration 06: AI Crop Health & Pest Diagnoses Schema
-- Stores historical Gemini 2.5 Flash agronomist leaf scans and treatment plans

create table if not exists public.crop_diagnoses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  crop_id uuid references public.crops on delete set null,
  image_url text,
  crop_name text not null,
  health_status text not null check (health_status in ('healthy', 'infected', 'pest_attack', 'nutrient_deficiency', 'unknown')),
  diagnosis_title text not null,
  scientific_name text,
  severity text not null check (severity in ('none', 'low', 'medium', 'high', 'critical')),
  confidence_score numeric,
  urgency_message text,
  symptoms jsonb default '[]'::jsonb,
  cause text,
  treatments jsonb default '{}'::jsonb,
  notes text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.crop_diagnoses enable row level security;

-- Row Level Security Policies
create policy "Users can view own crop diagnoses"
  on public.crop_diagnoses for select
  using (auth.uid() = user_id);

create policy "Users can insert own crop diagnoses"
  on public.crop_diagnoses for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own crop diagnoses"
  on public.crop_diagnoses for delete
  using (auth.uid() = user_id);

-- Performance Indexes
create index if not exists idx_crop_diagnoses_user_created 
  on public.crop_diagnoses(user_id, created_at desc);

create index if not exists idx_crop_diagnoses_crop 
  on public.crop_diagnoses(crop_id);

