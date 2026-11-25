# ADM RHUA

Sistema web responsivo de gestão financeira do RHUA Bar.

## Executar localmente

1. Instale o Node.js 20 ou superior.
2. Execute `npm install`.
3. Execute `npm run dev`.
4. Abra `http://localhost:3000`.

Sem variáveis de ambiente, o sistema inicia em modo demonstração. Clique em **Apresentar níveis de acesso** para testar os quatro perfis.

## Ativar autenticação em nuvem

1. Crie um projeto gratuito no Supabase.
2. Execute [`supabase/schema.sql`](supabase/schema.sql) no SQL Editor.
3. Crie o primeiro usuário em Authentication > Users e promova o perfil conforme a instrução ao final do SQL.
4. Copie `.env.example` para `.env.local` e informe `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
5. Reinicie o servidor.

Nunca coloque a chave `service_role` no frontend.

## Publicação

O projeto está pronto para Vercel e Netlify. Configure as duas variáveis `VITE_SUPABASE_*` no painel da hospedagem e use:

- comando de build: `npm run build`
- diretório publicado: `dist`

## Perfis

- Administrador: acesso total e gestão de usuários.
- Gerente financeiro: lançamentos, pagamentos e relatórios.
- Operador de caixa: lançamentos diários de entradas e despesas.
- Auditor: consulta e exportação, sem alteração de dados.
