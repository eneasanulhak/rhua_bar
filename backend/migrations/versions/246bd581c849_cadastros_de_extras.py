"""cadastros de extras: setores, funções e colaboradores

Troca as listas fixas (Enum) de setor, função e forma de pagamento e o nome digitado
do colaborador por cadastros, ligando cada diária aos registros correspondentes.
Cada colaborador recebe como padrão o setor, a função e o valor do seu primeiro lançamento.
As listas iniciais são copiadas aqui de propósito: a migração não depende do código atual.

Revision ID: 246bd581c849
Revises: 55fdd3b7be56
Create Date: 2026-11-28

"""
from alembic import op
import sqlalchemy as sa


revision = '246bd581c849'
down_revision = '55fdd3b7be56'
branch_labels = None
depends_on = None

SETORES = ('COZINHA', 'SEGURANÇA', 'BAR', 'SALÃO', 'RECEPÇÃO', 'LIMPEZA')
FUNCOES = {  # função -> setor
    'COZINHA': 'COZINHA', 'BAR': 'BAR', 'SALÃO': 'SALÃO', 'LÍDER': 'SALÃO', 'CUMIM': 'SALÃO',
    'SEGURANÇA': 'SEGURANÇA', 'RECEPÇÃO': 'RECEPÇÃO', 'LIMPEZA': 'LIMPEZA',
}
FORMAS_EXTRAS = ('Dinheiro', 'Pix')

NOVAS_COLUNAS = ('colaborador_id', 'setor_id', 'funcao_id', 'forma_pagamento_id')
FKS = (  # coluna em extras, tabela referenciada
    ('colaborador_id', 'colaboradores'),
    ('setor_id', 'setores'),
    ('funcao_id', 'funcoes'),
    ('forma_pagamento_id', 'formas_pagamento'),
)


def _timestamps():
    return (
        sa.Column('ativo', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
    )


def upgrade():
    setores = op.create_table(
        'setores',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nome', sa.String(length=60), nullable=False),
        *_timestamps(),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('nome'),
    )
    op.create_table(
        'funcoes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nome', sa.String(length=60), nullable=False),
        sa.Column('setor_id', sa.Integer(), nullable=False),
        *_timestamps(),
        sa.ForeignKeyConstraint(['setor_id'], ['setores.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('setor_id', 'nome', name='uq_funcoes_setor_nome'),
    )
    op.create_index('ix_funcoes_setor_id', 'funcoes', ['setor_id'], unique=False)
    op.create_table(
        'colaboradores',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nome', sa.String(length=120), nullable=False),
        sa.Column('setor_id', sa.Integer(), nullable=True),
        sa.Column('funcao_id', sa.Integer(), nullable=True),
        sa.Column('valor_diaria', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('telefone', sa.String(length=30), nullable=True),
        sa.Column('chave_pix', sa.String(length=120), nullable=True),
        sa.Column('observacao', sa.Text(), nullable=True),
        *_timestamps(),
        sa.ForeignKeyConstraint(['setor_id'], ['setores.id']),
        sa.ForeignKeyConstraint(['funcao_id'], ['funcoes.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('nome'),
    )

    op.bulk_insert(setores, [{'nome': n, 'ativo': True} for n in SETORES])
    for funcao, setor in FUNCOES.items():
        op.execute(sa.text(
            "INSERT INTO funcoes (nome, setor_id, ativo) SELECT :funcao, id, 1 FROM setores WHERE nome = :setor"
        ).bindparams(funcao=funcao, setor=setor))
    # Garante Dinheiro/Pix disponíveis para extras (a migração anterior já os cria assim).
    for forma in FORMAS_EXTRAS:
        op.execute(sa.text("UPDATE formas_pagamento SET usa_extras = 1 WHERE nome = :n").bindparams(n=forma))

    with op.batch_alter_table('extras') as batch_op:
        for coluna in NOVAS_COLUNAS:
            batch_op.add_column(sa.Column(coluna, sa.Integer(), nullable=True))

    op.execute("UPDATE extras SET setor_id = (SELECT s.id FROM setores s WHERE s.nome = extras.setor)")
    # Função do mesmo setor; se a combinação antiga não bater, a função de mesmo nome.
    op.execute(
        "UPDATE extras SET funcao_id = COALESCE("
        "(SELECT f.id FROM funcoes f WHERE f.nome = extras.funcao AND f.setor_id = extras.setor_id), "
        "(SELECT MIN(f.id) FROM funcoes f WHERE f.nome = extras.funcao))"
    )
    op.execute(
        "UPDATE extras SET forma_pagamento_id = "
        "(SELECT p.id FROM formas_pagamento p WHERE p.nome = extras.forma_pagamento)"
    )

    op.execute("INSERT INTO colaboradores (nome, valor_diaria, ativo) SELECT DISTINCT TRIM(nome), 0, 1 FROM extras")
    op.execute(
        "UPDATE extras SET colaborador_id = (SELECT c.id FROM colaboradores c WHERE c.nome = TRIM(extras.nome))"
    )
    # Padrões do colaborador = dados do seu primeiro lançamento.
    primeiro = (
        "(SELECT e.{col} FROM extras e WHERE e.colaborador_id = colaboradores.id ORDER BY e.data, e.id LIMIT 1)"
    )
    op.execute(
        "UPDATE colaboradores SET "
        f"setor_id = {primeiro.format(col='setor_id')}, "
        f"funcao_id = {primeiro.format(col='funcao_id')}, "
        f"valor_diaria = {primeiro.format(col='valor')}"
    )

    with op.batch_alter_table('extras') as batch_op:
        for coluna, tabela in FKS:
            batch_op.alter_column(coluna, existing_type=sa.Integer(), nullable=False)
            batch_op.create_foreign_key(f'fk_extras_{coluna}', tabela, [coluna], ['id'])
            batch_op.create_index(f'ix_extras_{coluna}', [coluna], unique=False)
        for antiga in ('nome', 'setor', 'funcao', 'forma_pagamento'):
            batch_op.drop_column(antiga)


def downgrade():
    # Só funciona se os setores/funções/formas em uso existirem nas listas fixas antigas.
    setor_enum = sa.Enum(*SETORES, name='setor')
    funcao_enum = sa.Enum(*FUNCOES, name='funcao_extra')
    forma_enum = sa.Enum(*FORMAS_EXTRAS, name='extra_payment_method')

    with op.batch_alter_table('extras') as batch_op:
        batch_op.add_column(sa.Column('nome', sa.String(length=120), nullable=True))
        batch_op.add_column(sa.Column('setor', setor_enum, nullable=True))
        batch_op.add_column(sa.Column('funcao', funcao_enum, nullable=True))
        batch_op.add_column(sa.Column('forma_pagamento', forma_enum, nullable=True))

    for antiga, tabela, coluna in (
        ('nome', 'colaboradores', 'colaborador_id'),
        ('setor', 'setores', 'setor_id'),
        ('funcao', 'funcoes', 'funcao_id'),
        ('forma_pagamento', 'formas_pagamento', 'forma_pagamento_id'),
    ):
        op.execute(f"UPDATE extras SET {antiga} = (SELECT c.nome FROM {tabela} c WHERE c.id = extras.{coluna})")

    with op.batch_alter_table('extras') as batch_op:
        batch_op.alter_column('nome', existing_type=sa.String(length=120), nullable=False)
        batch_op.alter_column('setor', existing_type=setor_enum, nullable=False)
        batch_op.alter_column('funcao', existing_type=funcao_enum, nullable=False)
        batch_op.alter_column('forma_pagamento', existing_type=forma_enum, nullable=False)
        for coluna, _ in FKS:
            batch_op.drop_constraint(f'fk_extras_{coluna}', type_='foreignkey')
            batch_op.drop_index(f'ix_extras_{coluna}')
            batch_op.drop_column(coluna)

    op.drop_table('colaboradores')
    op.drop_index('ix_funcoes_setor_id', table_name='funcoes')
    op.drop_table('funcoes')
    op.drop_table('setores')
