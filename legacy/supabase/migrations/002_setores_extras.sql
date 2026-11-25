-- Execute no SQL Editor caso o schema inicial já tenha sido criado.
alter table public.extras add column if not exists setor text;

update public.extras
set setor = case
  when funcao in ('LÍDER', 'CUMIM', 'SALÃO') then 'SALÃO'
  when funcao in ('COZINHA', 'SEGURANÇA', 'BAR', 'RECEPÇÃO', 'LIMPEZA') then funcao
  else 'SALÃO'
end
where setor is null;

alter table public.extras alter column setor set not null;

alter table public.extras drop constraint if exists extras_setor_check;
alter table public.extras add constraint extras_setor_check
  check (setor in ('COZINHA','SEGURANÇA','BAR','SALÃO','RECEPÇÃO','LIMPEZA'));
