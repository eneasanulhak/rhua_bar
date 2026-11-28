"""cadastros de despesas: categorias, formas de pagamento e fornecedores

Troca as listas fixas (Enum) e o texto livre do fornecedor por cadastros, ligando cada
despesa aos registros correspondentes. As listas iniciais são copiadas aqui de propósito:
a migração não pode depender do código atual dos modelos.

Revision ID: 55fdd3b7be56
Revises: 004cdc5ceee0
Create Date: 2026-11-28

"""
from alembic import op
import sqlalchemy as sa


revision = '55fdd3b7be56'
down_revision = '004cdc5ceee0'
branch_labels = None
depends_on = None

CATEGORIAS = (
    'Fixos e Básicos', 'Compras Bar e Salão', 'Compras Cozinha e Hortifruti', 'Salário Funcionários',
    'Operacional / Extras', 'Atrações e DJs', 'Manutenção e Reparos', 'Pagamentos e Reembolsos',
    'Impostos e Taxas', 'Parcelamentos e Boletos', 'Retirada de Sócios', 'Adiantamentos',
)
FORMAS = ('Dinheiro', 'Crédito', 'Débito', 'Pix', 'Voucher', 'Boleto', 'DDA', 'Débito em conta', 'Sicoob')
FORMAS_EXTRAS = ('Dinheiro', 'Pix')

LIGACOES = (  # coluna nova em despesas, tabela do cadastro, coluna antiga
    ('fornecedor_id', 'fornecedores', 'fornecedor'),
    ('categoria_id', 'categorias', 'categoria'),
    ('forma_pagamento_id', 'formas_pagamento', 'forma_pagamento'),
)


def _cadastro(nome: str, tamanho: int, *extras: sa.Column) -> sa.Table:
    return op.create_table(
        nome,
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nome', sa.String(length=tamanho), nullable=False),
        *extras,
        sa.Column('ativo', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('nome'),
    )


def upgrade():
    categorias = _cadastro('categorias', 80)
    formas = _cadastro(
        'formas_pagamento', 60,
        sa.Column('usa_despesas', sa.Boolean(), nullable=False),
        sa.Column('usa_extras', sa.Boolean(), nullable=False),
    )
    _cadastro(
        'fornecedores', 180,
        sa.Column('documento', sa.String(length=20), nullable=True),
        sa.Column('telefone', sa.String(length=30), nullable=True),
        sa.Column('email', sa.String(length=180), nullable=True),
        sa.Column('observacao', sa.Text(), nullable=True),
    )

    op.bulk_insert(categorias, [{'nome': n, 'ativo': True} for n in CATEGORIAS])
    op.bulk_insert(formas, [
        {'nome': n, 'usa_despesas': True, 'usa_extras': n in FORMAS_EXTRAS, 'ativo': True} for n in FORMAS
    ])
    # Cada fornecedor digitado até hoje vira um cadastro.
    op.execute(
        "INSERT INTO fornecedores (nome, ativo) "
        "SELECT DISTINCT TRIM(fornecedor), 1 FROM despesas"
    )

    with op.batch_alter_table('despesas') as batch_op:
        for coluna, _, _ in LIGACOES:
            batch_op.add_column(sa.Column(coluna, sa.Integer(), nullable=True))

    for coluna, tabela, antiga in LIGACOES:
        op.execute(
            f"UPDATE despesas SET {coluna} = "
            f"(SELECT c.id FROM {tabela} c WHERE c.nome = TRIM(despesas.{antiga}))"
        )

    with op.batch_alter_table('despesas') as batch_op:
        for coluna, tabela, antiga in LIGACOES:
            batch_op.alter_column(coluna, existing_type=sa.Integer(), nullable=False)
            batch_op.create_foreign_key(f'fk_despesas_{coluna}', tabela, [coluna], ['id'])
            batch_op.create_index(f'ix_despesas_{coluna}', [coluna], unique=False)
            batch_op.drop_column(antiga)


def downgrade():
    # Só funciona se todas as categorias/formas em uso existirem nas listas fixas antigas.
    with op.batch_alter_table('despesas') as batch_op:
        batch_op.add_column(sa.Column('fornecedor', sa.String(length=180), nullable=True))
        batch_op.add_column(sa.Column('categoria', sa.Enum(*CATEGORIAS, name='expense_category'), nullable=True))
        batch_op.add_column(sa.Column('forma_pagamento', sa.Enum(*FORMAS, name='payment_method'), nullable=True))

    for coluna, tabela, antiga in LIGACOES:
        op.execute(f"UPDATE despesas SET {antiga} = (SELECT c.nome FROM {tabela} c WHERE c.id = despesas.{coluna})")

    with op.batch_alter_table('despesas') as batch_op:
        batch_op.alter_column('fornecedor', existing_type=sa.String(length=180), nullable=False)
        batch_op.alter_column(
            'categoria', existing_type=sa.Enum(*CATEGORIAS, name='expense_category'), nullable=False,
        )
        batch_op.alter_column(
            'forma_pagamento', existing_type=sa.Enum(*FORMAS, name='payment_method'), nullable=False,
        )
        for coluna, _, _ in LIGACOES:
            batch_op.drop_constraint(f'fk_despesas_{coluna}', type_='foreignkey')
            batch_op.drop_index(f'ix_despesas_{coluna}')
            batch_op.drop_column(coluna)

    op.drop_table('fornecedores')
    op.drop_table('formas_pagamento')
    op.drop_table('categorias')
