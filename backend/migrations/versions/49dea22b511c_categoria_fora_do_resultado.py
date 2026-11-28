"""categoria: marcação fora_do_resultado (retiradas e adiantamentos no DRE)

Revision ID: 49dea22b511c
Revises: 246bd581c849
Create Date: 2026-11-28

"""
from alembic import op
import sqlalchemy as sa


revision = '49dea22b511c'
down_revision = '246bd581c849'
branch_labels = None
depends_on = None

FORA_DO_RESULTADO = ('Retirada de Sócios', 'Adiantamentos')


def upgrade():
    with op.batch_alter_table('categorias') as batch_op:
        batch_op.add_column(
            sa.Column('fora_do_resultado', sa.Boolean(), nullable=False, server_default=sa.false()),
        )
    for nome in FORA_DO_RESULTADO:
        op.execute(sa.text("UPDATE categorias SET fora_do_resultado = 1 WHERE nome = :n").bindparams(n=nome))
    # O default no banco só servia para preencher as linhas existentes; o modelo define o padrão.
    with op.batch_alter_table('categorias') as batch_op:
        batch_op.alter_column(
            'fora_do_resultado', existing_type=sa.Boolean(), existing_nullable=False, server_default=None,
        )


def downgrade():
    with op.batch_alter_table('categorias') as batch_op:
        batch_op.drop_column('fora_do_resultado')
