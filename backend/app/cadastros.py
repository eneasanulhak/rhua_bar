"""Regras dos cadastros auxiliares usadas pelos lançamentos, pelo seed e pelos testes."""

from flask import abort
from sqlalchemy import func, select

from .extensions import db
from .models import EXPENSE_CATEGORIES, PAYMENT_METHODS, Categoria, FormaPagamento, Fornecedor

# Formas de pagamento que, além de despesas, também valem para diárias de extras.
FORMAS_EXTRAS = ("Dinheiro", "Pix")


def buscar_por_nome(model, nome: str):
    """Busca ignorando maiúsculas/minúsculas e espaços nas pontas."""
    return db.session.scalar(select(model).where(func.lower(model.nome) == nome.strip().lower()))


def garantir_cadastros_padrao() -> None:
    """Cria as categorias e formas de pagamento iniciais que ainda não existirem (não faz commit)."""
    for nome in EXPENSE_CATEGORIES:
        if not buscar_por_nome(Categoria, nome):
            db.session.add(Categoria(nome=nome))
    for nome in PAYMENT_METHODS:
        if not buscar_por_nome(FormaPagamento, nome):
            db.session.add(FormaPagamento(nome=nome, usa_despesas=True, usa_extras=nome in FORMAS_EXTRAS))
    db.session.flush()


def obter_ou_criar_fornecedor(nome: str) -> Fornecedor:
    """Usa o fornecedor de mesmo nome ou cadastra um novo (só com o nome) no lançamento."""
    nome = nome.strip()
    fornecedor = buscar_por_nome(Fornecedor, nome)
    if not fornecedor:
        fornecedor = Fornecedor(nome=nome)
        db.session.add(fornecedor)
        db.session.flush()
    return fornecedor


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
