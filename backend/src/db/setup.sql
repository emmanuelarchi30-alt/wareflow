-- Wareflow Database Schema for Supabase
-- Ejecuta esto en el SQL Editor de Supabase

-- Extensiones necesarias
create extension if not exists "uuid-ossp";

-- Tabla de perfiles de usuario (extiende auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text,
  security_question text,
  security_answer text,
  country text,
  region text,
  city text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla de credenciales de usuarios (solo para fines educativos/demo)
-- ALMACENAR CONTRASEÑAS EN TEXTO PLANO ES INSEGURO EN PRODUCCIÓN
create table if not exists public.user_credentials (
  id uuid default uuid_generate_v4() primary key,
  email text unique not null,
  password text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla de almacenes
create table if not exists public.warehouses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  address text,
  country text,
  region text,
  city text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla de análisis de layout
create table if not exists public.layout_analyses (
  id uuid default uuid_generate_v4() primary key,
  warehouse_id uuid references public.warehouses on delete cascade not null,
  image_url text not null,
  json_analysis jsonb,
  status text default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  error_note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Agrega error_note si la tabla ya existe (idempotente)
do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'layout_analyses') then
    begin
      alter table public.layout_analyses add column error_note text;
    exception when duplicate_column then null;
    end;
  end if;
end $$;

-- Tabla de problemas detectados
create table if not exists public.detected_issues (
  id uuid default uuid_generate_v4() primary key,
  analysis_id uuid references public.layout_analyses on delete cascade not null,
  type text not null check (type in ('bottleneck', 'wasted_space', 'blocked_aisle', 'poor_flow', 'disorganization')),
  description text not null,
  severity text not null check (severity in ('critical', 'warning', 'good')),
  coordinates_x numeric(5,2) not null,
  coordinates_y numeric(5,2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla de recomendaciones
create table if not exists public.recommendations (
  id uuid default uuid_generate_v4() primary key,
  analysis_id uuid references public.layout_analyses on delete cascade not null,
  description text not null,
  priority text not null check (priority in ('high', 'medium', 'low')),
  estimated_impact text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Índices para performance
create index if not exists idx_warehouses_user_id on public.warehouses(user_id);
create index if not exists idx_layout_analyses_warehouse_id on public.layout_analyses(warehouse_id);
create index if not exists idx_detected_issues_analysis_id on public.detected_issues(analysis_id);
create index if not exists idx_recommendations_analysis_id on public.recommendations(analysis_id);

-- Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.warehouses enable row level security;
alter table public.layout_analyses enable row level security;
alter table public.detected_issues enable row level security;
alter table public.recommendations enable row level security;

-- Políticas RLS para profiles
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Políticas RLS para user_credentials
alter table public.user_credentials enable row level security;

create policy "Insert own credentials" on public.user_credentials
  for insert with check (auth.uid() is not null);

create policy "View credentials" on public.user_credentials
  for select using (auth.uid() is not null);

-- Políticas RLS para warehouses
create policy "Users can view own warehouses" on public.warehouses
  for select using (auth.uid() = user_id);

create policy "Users can insert own warehouses" on public.warehouses
  for insert with check (auth.uid() = user_id);

create policy "Users can update own warehouses" on public.warehouses
  for update using (auth.uid() = user_id);

create policy "Users can delete own warehouses" on public.warehouses
  for delete using (auth.uid() = user_id);

-- Políticas RLS para layout_analyses (acceso a través de warehouse)
create policy "Users can view analyses of own warehouses" on public.layout_analyses
  for select using (
    exists (
      select 1 from public.warehouses
      where warehouses.id = layout_analyses.warehouse_id
      and warehouses.user_id = auth.uid()
    )
  );

create policy "Users can insert analyses for own warehouses" on public.layout_analyses
  for insert with check (
    exists (
      select 1 from public.warehouses
      where warehouses.id = layout_analyses.warehouse_id
      and warehouses.user_id = auth.uid()
    )
  );

create policy "Users can update analyses of own warehouses" on public.layout_analyses
  for update using (
    exists (
      select 1 from public.warehouses
      where warehouses.id = layout_analyses.warehouse_id
      and warehouses.user_id = auth.uid()
    )
  );

-- Políticas RLS para detected_issues
create policy "Users can view issues of own analyses" on public.detected_issues
  for select using (
    exists (
      select 1 from public.layout_analyses la
      join public.warehouses w on w.id = la.warehouse_id
      where la.id = detected_issues.analysis_id
      and w.user_id = auth.uid()
    )
  );

-- Políticas RLS para recommendations
create policy "Users can view recommendations of own analyses" on public.recommendations
  for select using (
    exists (
      select 1 from public.layout_analyses la
      join public.warehouses w on w.id = la.warehouse_id
      where la.id = recommendations.analysis_id
      and w.user_id = auth.uid()
    )
  );

-- Trigger para actualizar updated_at
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end $$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger warehouses_updated_at
  before update on public.warehouses
  for each row execute procedure public.handle_updated_at();

create trigger layout_analyses_updated_at
  before update on public.layout_analyses
  for each row execute procedure public.handle_updated_at();

-- Storage bucket para imágenes de almacenes
insert into storage.buckets (id, name, public) values ('warehouse-images', 'warehouse-images', true)
on conflict (id) do nothing;

-- Políticas de storage
create policy "Users can upload to own folder" on storage.objects
  for insert with check (
    bucket_id = 'warehouse-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view own images" on storage.objects
  for select using (
    bucket_id = 'warehouse-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Public can view warehouse images" on storage.objects
  for select using (bucket_id = 'warehouse-images');