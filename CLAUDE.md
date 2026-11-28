# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Visão geral

ADM RHUA é o sistema de gestão financeira do RHUA Bar (faturamento diário, despesas/boletos, diárias de extras, relatórios, usuários). Domínio, UI, mensagens de erro e nomes de campos estão em português — mantenha esse padrão.

O projeto está **em migração**: o app React antigo (só frontend, dados em `localStorage`) foi movido para `legacy/` e serve apenas de referência visual/funcional. O sistema novo é `backend/` (Flask) + `frontend/` (Vue). Telas ainda não portadas apontam para `frontend/src/views/EmConstrucaoView.vue` no router; ao portar uma, use a tela equivalente em `legacy/src/components/` como referência e `FaturamentoView.vue` como padrão de implementação.

## Comandos

Backend (rodar dentro de `backend/`, venv em `.venv`):
- `.venv/bin/flask run` — API em `:5000` (lê `.flaskenv` e `.env`)
- `.venv/bin/pytest` — testes (SQLite em memória, não precisa de MySQL); um teste: `.venv/bin/pytest tests/test_users.py::test_create_update_delete_user`
- `.venv/bin/flask db migrate -m "..."` / `.venv/bin/flask db upgrade` — migrações Alembic (sempre gerar migração ao mudar `models.py`)
- `.venv/bin/flask create-user` / `.venv/bin/flask seed-demo` — criar usuário / carregar dados de demonstração
- `.venv/bin/gunicorn -c gunicorn.conf.py wsgi:app` — produção

Frontend (dentro de `frontend/`):
- `npm run dev` — Vite em `:5173`, com proxy de `/api` para `localhost:5000`
- `npm run type-check`, `npm run lint` (oxlint + eslint, com `--fix`), `npm run build`
- `npm run test:unit` — Vitest

## Arquitetura

**API** (`backend/app/`): app factory em `__init__.py`; um blueprint por recurso em `api/`, montado em `/api/<nome do blueprint>` (ex.: blueprint `usuarios` → `/api/usuarios`). Erros saem sempre como JSON `{"message": ...}` (inclusive os de JWT).
- **Contrato camelCase ↔ snake_case**: os modelos (`models.py`) usam snake_case; `to_dict()` serializa em camelCase, e o dicionário `SPEC` de cada blueprint (`validation.Field`) mapeia o nome camelCase recebido para o atributo do modelo e valida tipo/escolhas. Novos campos precisam entrar no modelo, no `to_dict`, no `SPEC` e em `frontend/src/types.ts`.
- Valores monetários são `Numeric(12,2)` / `Decimal` no servidor e `number` no JSON.
- `registradoPor` é derivado do usuário do JWT (FK `registrado_por_id`), nunca vem do cliente.
- **Permissões**: `ROLE_PERMISSIONS` em `permissions.py` é a fonte da verdade; endpoints usam `@require_permission(...)` (que já inclui `jwt_required`). O login e `/api/auth/me` devolvem a lista de permissões do usuário, e o frontend só a usa para esconder UI. Extras reaproveitam as permissões de despesas (herança do sistema antigo).
- **Cadastros auxiliares** (categorias, formas de pagamento, fornecedores, setores, funções, colaboradores): CRUD gerado por `cadastro_blueprint` em `api/cadastros.py`; listar exige `view_despesas`, alterar exige `manage_cadastros` (só admin). Item em uso não é excluído (409), só inativado; lançamentos aceitam item inativo apenas se já o usavam (`resolver_cadastro` em `app/cadastros.py`). Lançamentos referenciam os cadastros por id, exceto fornecedor (despesas) e colaborador (extras), que vêm pelo nome e são criados automaticamente se não existirem — o colaborador novo herda setor/função/valor do lançamento como padrões. Função pertence a um setor (nome único por setor) e o lançamento valida a combinação. Formas de pagamento são um cadastro único com marcações `usaDespesas`/`usaExtras`. Comparações de nome usam `func.lower` nos dois lados (o `lower()` do SQLite só trata ASCII). No frontend, todos usam a tela genérica `views/cadastros/CadastroView.vue`, configurada em `views/cadastros/config.ts` (que também gera as rotas e o menu Cadastros).
- `GET /api/notificacoes` calcula no servidor as despesas não pagas atrasadas / vencendo hoje / nos próximos 7 dias.
- Listagens aceitam `?mes=AAAA-MM` (despesas filtram por `data_vencimento`).

**Frontend** (`frontend/src/`):
- `services/api.ts`: wrapper de `fetch` que injeta o Bearer token e lança `ApiError` com a mensagem da API; um 401 com token dispara logout.
- Stores Pinia (setup stores): `auth` (token, usuário, `can(permission)`), `ui` (tema e filtro global de mês `mes`), e os recursos em `stores/resources.ts`, construídos com o composable `useCrud` (`items`, `fetchAll(mes)`, `create`, `update`, `remove`).
- As views recarregam seus stores com `watch(() => ui.mes, ..., { immediate: true })`.
- Router: rotas filhas de `layouts/AppLayout.vue` declaram `meta.permission`; o guard global restaura a sessão (`auth.restore()`) e redireciona para login ou dashboard.
- Estilo: Tailwind 4 com tokens e classes utilitárias (`card`, `btn-primary`, `input`, `label`) em `assets/main.css`; tema escuro via classe `dark` no `<html>`.
