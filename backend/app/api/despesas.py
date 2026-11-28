from datetime import date

from flask import Blueprint, abort, request
from flask_jwt_extended import current_user
from sqlalchemy import select

from ..cadastros import categorias_restritas, obter_ou_criar_fornecedor, resolver_cadastro
from ..extensions import db
from ..models import TRANSACTION_STATUS, Categoria, Despesa, FormaPagamento
from ..permissions import has_permission, require_permission
from ..validation import Field, month_bounds, parse_payload

bp = Blueprint("despesas", __name__)

# O fornecedor vem pelo nome: se ainda não existir, é cadastrado automaticamente.
# Categoria e forma de pagamento vêm pelo id do cadastro.
SPEC = {
    "descricao": Field("descricao", required=True, max_len=255),
    "fornecedorOuFavorecido": Field("fornecedor_nome", required=True, max_len=180),
    "categoriaId": Field("categoria_id", kind="int", required=True),
    "formaPagamentoId": Field("forma_pagamento_id", kind="int", required=True),
    "valor": Field("valor", kind="money", required=True),
    "dataEmissao": Field("data_emissao", kind="date", required=True),
    "dataVencimento": Field("data_vencimento", kind="date", required=True),
    "dataPagamento": Field("data_pagamento", kind="date"),
    "status": Field("status", required=True, choices=TRANSACTION_STATUS),
    "numeroNF": Field("numero_nf", max_len=60),
    "parcela": Field("parcela", max_len=20),
    "observacao": Field("observacao"),
}

STATUS_SPEC = {
    "status": Field("status", required=True, choices=TRANSACTION_STATUS),
    "dataPagamento": Field("data_pagamento", kind="date"),
}


def _resolver_cadastros(fields: dict, atual: Despesa | None = None) -> dict:
    """Troca o nome do fornecedor e os ids recebidos pelos cadastros correspondentes."""
    if "fornecedor_nome" in fields:
        fields["fornecedor"] = obter_ou_criar_fornecedor(fields.pop("fornecedor_nome"))
    if "categoria_id" in fields:
        fields["categoria"] = resolver_cadastro(
            Categoria, fields.pop("categoria_id"), "categoriaId", atual and atual.categoria_id,
        )
    if "forma_pagamento_id" in fields:
        fields["forma_pagamento"] = resolver_cadastro(
            FormaPagamento, fields.pop("forma_pagamento_id"), "formaPagamentoId",
            atual and atual.forma_pagamento_id, valido=lambda f: f.usa_despesas,
        )
    categoria = fields.get("categoria")
    if categoria and categoria.fora_do_resultado and not has_permission(current_user.role, "view_retiradas"):
        abort(403, description=f"Você não tem permissão para lançar despesas de {categoria.nome}.")
    return fields


def _visiveis(query):
    """Esconde retiradas/adiantamentos de quem não tem `view_retiradas`."""
    if (restritas := categorias_restritas()) is not None:
        query = query.where(Despesa.categoria_id.not_in(restritas))
    return query


def _carregar(item_id: int) -> Despesa:
    """Despesa invisível para o usuário responde 404, como se não existisse."""
    item = db.session.scalar(_visiveis(select(Despesa).where(Despesa.id == item_id)))
    if not item:
        abort(404, description="Despesa não encontrada.")
    return item


def _apply_status_rules(item: Despesa) -> None:
    """Despesa compensada sempre tem data de pagamento; as demais, nunca."""
    if item.status == "Compensado":
        item.data_pagamento = item.data_pagamento or date.today()
    else:
        item.data_pagamento = None


@bp.get("")
@require_permission("view_despesas")
def list_despesas():
    query = _visiveis(select(Despesa).order_by(Despesa.data_vencimento.desc(), Despesa.id.desc()))
    if bounds := month_bounds(request.args.get("mes")):
        query = query.where(Despesa.data_vencimento >= bounds[0], Despesa.data_vencimento < bounds[1])
    return [d.to_dict() for d in db.session.scalars(query)]


@bp.post("")
@require_permission("add_despesas")
def create_despesa():
    fields = _resolver_cadastros(parse_payload(request.get_json(silent=True), SPEC))
    item = Despesa(**fields, registrado_por=current_user)
    _apply_status_rules(item)
    db.session.add(item)
    db.session.commit()
    return item.to_dict(), 201


@bp.put("/<int:item_id>")
@require_permission("edit_despesas")
def update_despesa(item_id: int):
    item = _carregar(item_id)
    fields = _resolver_cadastros(parse_payload(request.get_json(silent=True), SPEC, partial=True), item)
    for attr, value in fields.items():
        setattr(item, attr, value)
    _apply_status_rules(item)
    db.session.commit()
    return item.to_dict()


@bp.patch("/<int:item_id>/status")
@require_permission("compensar_despesas")
def update_status(item_id: int):
    item = _carregar(item_id)
    fields = parse_payload(request.get_json(silent=True), STATUS_SPEC)
    item.status = fields["status"]
    item.data_pagamento = fields["data_pagamento"]
    _apply_status_rules(item)
    db.session.commit()
    return item.to_dict()


@bp.delete("/<int:item_id>")
@require_permission("delete_despesas")
def delete_despesa(item_id: int):
    item = _carregar(item_id)
    db.session.delete(item)
    db.session.commit()
    return "", 204
