"""CRUD dos cadastros auxiliares.

Listar é liberado para quem vê despesas (os formulários de lançamento precisam das listas);
criar, editar e excluir exige `manage_cadastros` (só o administrador).
"""

from collections.abc import Callable

from flask import Blueprint, abort, request
from sqlalchemy import exists, func, select

from ..extensions import db
from ..models import Categoria, Despesa, FormaPagamento, Fornecedor
from ..permissions import require_permission
from ..validation import Field, parse_payload


def cadastro_blueprint(
    name: str,
    model,
    spec: dict[str, Field],
    em_uso: Callable[[int], bool],
) -> Blueprint:
    bp = Blueprint(name, __name__)
    flags = {f.attr for f in spec.values() if f.kind == "bool"}

    def nome_livre(nome: str, ignorar_id: int | None = None) -> None:
        query = select(model.id).where(func.lower(model.nome) == nome.lower())
        if ignorar_id:
            query = query.where(model.id != ignorar_id)
        if db.session.scalar(query):
            abort(409, description=f"Já existe um cadastro com o nome {nome}.")

    def carregar(item_id: int):
        return db.get_or_404(model, item_id, description="Cadastro não encontrado.")

    @bp.get("")
    @require_permission("view_despesas")
    def listar():
        return [i.to_dict() for i in db.session.scalars(select(model).order_by(model.nome))]

    @bp.post("")
    @require_permission("manage_cadastros")
    def criar():
        fields = parse_payload(request.get_json(silent=True), spec)
        nome_livre(fields["nome"])
        item = model(**{k: v for k, v in fields.items() if v is not None})
        db.session.add(item)
        db.session.commit()
        return item.to_dict(), 201

    @bp.put("/<int:item_id>")
    @require_permission("manage_cadastros")
    def atualizar(item_id: int):
        item = carregar(item_id)
        fields = parse_payload(request.get_json(silent=True), spec, partial=True)
        if "nome" in fields:
            nome_livre(fields["nome"], ignorar_id=item.id)
        for attr, value in fields.items():
            if value is None and attr in flags:
                continue  # marcação (ativo, usa_*) enviada como null: mantém o valor atual
            setattr(item, attr, value)
        db.session.commit()
        return item.to_dict()

    @bp.delete("/<int:item_id>")
    @require_permission("manage_cadastros")
    def excluir(item_id: int):
        item = carregar(item_id)
        if em_uso(item.id):
            abort(409, description=f"{item.nome} está em uso em lançamentos. Inative-o em vez de excluir.")
        db.session.delete(item)
        db.session.commit()
        return "", 204

    return bp


def _usado_em_despesas(coluna) -> Callable[[int], bool]:
    return lambda item_id: bool(db.session.scalar(select(exists().where(coluna == item_id))))


categorias_bp = cadastro_blueprint(
    "categorias",
    Categoria,
    {
        "nome": Field("nome", required=True, max_len=80),
        "ativo": Field("ativo", kind="bool"),
    },
    _usado_em_despesas(Despesa.categoria_id),
)

formas_pagamento_bp = cadastro_blueprint(
    "formas-pagamento",
    FormaPagamento,
    {
        "nome": Field("nome", required=True, max_len=60),
        "usaDespesas": Field("usa_despesas", kind="bool"),
        "usaExtras": Field("usa_extras", kind="bool"),
        "ativo": Field("ativo", kind="bool"),
    },
    _usado_em_despesas(Despesa.forma_pagamento_id),
)

fornecedores_bp = cadastro_blueprint(
    "fornecedores",
    Fornecedor,
    {
        "nome": Field("nome", required=True, max_len=180),
        "documento": Field("documento", max_len=20),
        "telefone": Field("telefone", max_len=30),
        "email": Field("email", max_len=180),
        "observacao": Field("observacao"),
        "ativo": Field("ativo", kind="bool"),
    },
    _usado_em_despesas(Despesa.fornecedor_id),
)
