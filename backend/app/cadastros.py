"""Regras dos cadastros auxiliares usadas pelos lançamentos, pelo seed e pelos testes."""

from flask import abort
from sqlalchemy import func, select

from .extensions import db
from .models import (
    EXPENSE_CATEGORIES,
    FUNCOES_EXTRA,
    PAYMENT_METHODS,
    SETORES,
    Categoria,
    Colaborador,
    FormaPagamento,
    Fornecedor,
    Funcao,
    Setor,
)

# Formas de pagamento que, além de despesas, também valem para diárias de extras.
FORMAS_EXTRAS = ("Dinheiro", "Pix")


def buscar_por_nome(model, nome: str):
    """Busca ignorando maiúsculas/minúsculas e espaços nas pontas."""
    return db.session.scalar(select(model).where(func.lower(model.nome) == func.lower(nome.strip())))


def garantir_cadastros_padrao() -> None:
    """Cria os cadastros iniciais que ainda não existirem (não faz commit)."""
    for nome in EXPENSE_CATEGORIES:
        if not buscar_por_nome(Categoria, nome):
            db.session.add(Categoria(nome=nome))
    for nome in PAYMENT_METHODS:
        if not buscar_por_nome(FormaPagamento, nome):
            db.session.add(FormaPagamento(nome=nome, usa_despesas=True, usa_extras=nome in FORMAS_EXTRAS))
    for nome in SETORES:
        if not buscar_por_nome(Setor, nome):
            db.session.add(Setor(nome=nome))
    db.session.flush()
    for nome, setor_nome in FUNCOES_EXTRA.items():
        setor = buscar_por_nome(Setor, setor_nome)
        if not buscar_funcao(nome, setor.id):
            db.session.add(Funcao(nome=nome, setor=setor))
    db.session.flush()


def buscar_funcao(nome: str, setor_id: int) -> Funcao | None:
    """Funções são únicas por setor, então a busca por nome precisa do setor."""
    return db.session.scalar(
        select(Funcao).where(func.lower(Funcao.nome) == func.lower(nome.strip()), Funcao.setor_id == setor_id)
    )


def obter_ou_criar_fornecedor(nome: str) -> Fornecedor:
    """Usa o fornecedor de mesmo nome ou cadastra um novo (só com o nome) no lançamento."""
    nome = nome.strip()
    fornecedor = buscar_por_nome(Fornecedor, nome)
    if not fornecedor:
        fornecedor = Fornecedor(nome=nome)
        db.session.add(fornecedor)
        db.session.flush()
    return fornecedor


def obter_ou_criar_colaborador(nome: str, **padroes) -> Colaborador:
    """Usa o colaborador de mesmo nome ou cadastra um novo no lançamento.

    No cadastro automático, setor, função e valor do lançamento viram os padrões do colaborador.
    """
    nome = nome.strip()
    colaborador = buscar_por_nome(Colaborador, nome)
    if not colaborador:
        colaborador = Colaborador(nome=nome, **padroes)
        db.session.add(colaborador)
        db.session.flush()
    return colaborador


def validar_funcao_do_setor(funcao: Funcao | None, setor: Setor | None) -> None:
    if funcao and setor and funcao.setor_id != setor.id:
        abort(422, description=f"A função {funcao.nome} não pertence ao setor {setor.nome}.")


def resolver_cadastro(model, item_id: int, campo: str, atual_id: int | None = None, valido=lambda _: True):
    """Carrega o cadastro referenciado por um lançamento.

    Um item inativo (ou que não vale para o tipo de lançamento) só é aceito se o lançamento
    já o usava, para que editar um lançamento antigo não obrigue a trocar a categoria/forma.
    """
    item = db.session.get(model, item_id)
    if not item:
        abort(422, description=f"Valor inválido em {campo}.")
    if item.id != atual_id and not (item.ativo and valido(item)):
        abort(422, description=f"{item.nome} não está disponível para novos lançamentos ({campo}).")
    return item
