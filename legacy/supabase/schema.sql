-- Execute este arquivo no SQL Editor do Supabase uma única vez.
create type public.app_role as enum ('admin', 'gerente', 'operador', 'auditor');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role public.app_role not null default 'operador',
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.current_role()
returns public.app_role language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;

create policy "usuario visualiza o proprio perfil"
on public.profiles for select to authenticated
using (id = auth.uid() or public.current_role() = 'admin');

create policy "administrador gerencia perfis"
on public.profiles for all to authenticated
using (public.current_role() = 'admin')
with check (public.current_role() = 'admin');

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 'operador');
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users for each row execute procedure public.handle_new_user();

create table public.faturamentos (
  id uuid primary key default gen_random_uuid(), data date not null,
  dinheiro numeric(12,2) not null default 0, credito numeric(12,2) not null default 0,
  debito numeric(12,2) not null default 0, pix numeric(12,2) not null default 0,
  voucher numeric(12,2) not null default 0, sicoob numeric(12,2) not null default 0,
  diferenca_caixa numeric(12,2) not null default 0, observacao text,
  registrado_por uuid not null references public.profiles(id), created_at timestamptz not null default now()
);

create table public.despesas (
  id uuid primary key default gen_random_uuid(), descricao text not null,
  fornecedor text not null, categoria text not null, forma_pagamento text not null,
  valor numeric(12,2) not null check (valor >= 0), data_emissao date not null,
  data_vencimento date not null, data_pagamento date, status text not null,
  numero_nf text, parcela text, observacao text,
  registrado_por uuid not null references public.profiles(id), created_at timestamptz not null default now()
);

create table public.extras (
  id uuid primary key default gen_random_uuid(), data date not null, nome text not null,
  setor text not null check (setor in ('COZINHA','SEGURANÇA','BAR','SALÃO','RECEPÇÃO','LIMPEZA')),
  funcao text not null, valor numeric(12,2) not null check (valor >= 0),
  forma_pagamento text not null, status text not null, observacao text,
  registrado_por uuid not null references public.profiles(id), created_at timestamptz not null default now()
);

alter table public.faturamentos enable row level security;
alter table public.despesas enable row level security;
alter table public.extras enable row level security;

create policy "equipe autenticada consulta faturamentos" on public.faturamentos for select to authenticated using (true);
create policy "equipe operacional insere faturamentos" on public.faturamentos for insert to authenticated with check (public.current_role() in ('admin','gerente','operador'));
create policy "gestao altera faturamentos" on public.faturamentos for update to authenticated using (public.current_role() in ('admin','gerente'));
create policy "admin exclui faturamentos" on public.faturamentos for delete to authenticated using (public.current_role() = 'admin');

create policy "equipe autenticada consulta despesas" on public.despesas for select to authenticated using (true);
create policy "equipe operacional insere despesas" on public.despesas for insert to authenticated with check (public.current_role() in ('admin','gerente','operador'));
create policy "gestao altera despesas" on public.despesas for update to authenticated using (public.current_role() in ('admin','gerente'));
create policy "admin exclui despesas" on public.despesas for delete to authenticated using (public.current_role() = 'admin');

create policy "perfis autorizados consultam extras" on public.extras for select to authenticated using (public.current_role() in ('admin','gerente','auditor'));
create policy "gestao insere extras" on public.extras for insert to authenticated with check (public.current_role() in ('admin','gerente'));
create policy "gestao altera extras" on public.extras for update to authenticated using (public.current_role() in ('admin','gerente'));
create policy "admin exclui extras" on public.extras for delete to authenticated using (public.current_role() = 'admin');

-- Depois de criar o primeiro usuário no painel Authentication, promova-o:
-- update public.profiles set role = 'admin' where id = 'UUID_DO_USUARIO';
