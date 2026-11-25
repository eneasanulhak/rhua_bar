# ADM RHUA

Sistema web de gestão financeira do **RHUA Bar**. Ele substitui a planilha de controle de caixa: registra o dinheiro que entra e sai do bar e mostra o resultado da operação.

## Funcionalidades

- **Painel & DRE**: faturamento, despesas, resultado e valores a pagar do período, com despesas por categoria e próximos vencimentos.
- **Faturamento diário**: entradas do dia por meio de pagamento (dinheiro, crédito, débito, Pix, voucher, Sicoob) e diferença de caixa (sobra ou falta).
- **Despesas & compras**: contas e compras por fornecedor, categoria, nota fiscal, parcela e vencimento.
- **Boletos & vencimentos**: controle do que está pendente, atrasado ou pago, com alertas de vencimento.
- **Pagamento de extras**: diárias da equipe de apoio por setor e função.
- **Relatórios**: exportação para Excel e PDF.
- **Usuários & permissões**: quatro níveis de acesso, checados na API.

> **Status:** em migração do antigo app React (pasta `legacy/`) para a nova arquitetura. A API já cobre todos os recursos. No frontend, Login, Painel e Faturamento estão prontos; Despesas, Boletos, Extras, Relatórios e Usuários estão sendo portados.

## Tecnologias

| Camada | Stack |
|---|---|
| Backend | Python 3, Flask, SQLAlchemy 2, Flask-Migrate (Alembic), Flask-JWT-Extended, Gunicorn |
| Banco de dados | MySQL 8 (driver PyMySQL) |
| Frontend | Vue 3, TypeScript, Pinia, Vue Router, Tailwind CSS 4, Vite |
| Testes | pytest (API), Vitest (frontend) |

## Estrutura

```
adm-rhua/
├── backend/        API REST (Flask)
│   ├── app/        modelos, blueprints em api/, permissões, validação, comandos CLI
│   ├── migrations/ migrações Alembic
│   └── tests/      testes da API (rodam em SQLite em memória)
├── frontend/       SPA Vue 3
│   └── src/        views, componentes, stores Pinia, cliente da API
└── legacy/         app React antigo, só para consulta durante a migração
```

## Como rodar localmente

### Pré-requisitos

- Python 3.11 ou superior
- Node.js 22.18 ou superior (ou 24.12+)
- MySQL 8

### 1. Banco de dados

```sql
CREATE DATABASE adm_rhua CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'adm_rhua'@'localhost' IDENTIFIED BY 'troque-esta-senha';
GRANT ALL PRIVILEGES ON adm_rhua.* TO 'adm_rhua'@'localhost';
```

### 2. Backend

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements-dev.txt
cp .env.example .env          # ajuste DATABASE_URL e JWT_SECRET_KEY
.venv/bin/flask db upgrade    # cria as tabelas
.venv/bin/flask create-user   # cria o primeiro administrador
.venv/bin/flask seed-demo     # opcional: dados de demonstração (senha rhua123)
.venv/bin/flask run           # API em http://localhost:5000
```

Para gerar um `JWT_SECRET_KEY`:

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

Em desenvolvimento, o Vite encaminha as chamadas `/api` para `localhost:5000`, sem precisar configurar CORS.

## Comandos úteis

| Onde | Comando | O que faz |
|---|---|---|
| backend | `.venv/bin/pytest` | roda os testes da API |
| backend | `.venv/bin/flask db migrate -m "descrição"` | gera uma migração após mudar `app/models.py` |
| backend | `.venv/bin/flask db upgrade` | aplica as migrações pendentes |
| backend | `.venv/bin/gunicorn -c gunicorn.conf.py wsgi:app` | sobe a API em modo produção |
| frontend | `npm run type-check` | checagem de tipos |
| frontend | `npm run lint` | oxlint + ESLint |
| frontend | `npm run build` | build de produção em `frontend/dist` |

## API

Todas as rotas ficam em `/api` e, exceto login e health, exigem o header `Authorization: Bearer <token>`.

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/auth/login` | login; devolve token, usuário e permissões |
| `GET` | `/api/auth/me` | sessão atual |
| `PUT` | `/api/auth/me/password` | troca a própria senha |
| `GET/POST` | `/api/faturamentos` | lista (`?mes=AAAA-MM`) / cria |
| `PUT/DELETE` | `/api/faturamentos/<id>` | edita / exclui |
| `GET/POST` | `/api/despesas` | lista (`?mes=AAAA-MM`, pelo vencimento) / cria |
| `PUT/DELETE` | `/api/despesas/<id>` | edita / exclui |
| `PATCH` | `/api/despesas/<id>/status` | marca como paga ou pendente |
| `GET/POST` | `/api/extras` | lista (`?mes=AAAA-MM`) / cria |
| `PUT/DELETE` | `/api/extras/<id>` | edita / exclui |
| `GET` | `/api/notificacoes` | boletos atrasados, vencendo hoje ou nos próximos 7 dias |
| `GET/POST` | `/api/usuarios` | lista / cria usuários (só admin) |
| `PUT/DELETE` | `/api/usuarios/<id>` | edita / exclui usuários (só admin) |
| `GET` | `/api/health` | verificação de saúde |

Erros sempre voltam como JSON: `{"message": "..."}`.

## Perfis de acesso

| Perfil | Pode |
|---|---|
| **Administrador** | tudo, inclusive excluir lançamentos e gerenciar usuários |
| **Gerente financeiro** | lançar, editar e dar baixa em pagamentos; exportar relatórios |
| **Operador de caixa** | lançar faturamento, despesas e extras do dia |
| **Auditor** | consultar e exportar, sem alterar dados |
