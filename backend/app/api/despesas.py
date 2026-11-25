from datetime import date

from flask import Blueprint, request
from flask_jwt_extended import current_user
from sqlalchemy import select

from ..extensions import db
from ..models import EXPENSE_CATEGORIES, PAYMENT_METHODS, TRANSACTION_STATUS, Despesa
from ..permissions import require_permission
from ..validation import Field, month_bounds, parse_payload

bp = Blueprint("despesas", __name__)

SPEC = {
    "descricao": Field("descricao", required=True, max_len=255),
    "fornecedorOuFavorecido": Field("fornecedor", required=True, max_len=180),
    "categoria": Field("categoria", required=True, choices=EXPENSE_CATEGORIES),
    "formaPagamento": Field("forma_pagamento", required=True, choices=PAYMENT_METHODS),
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


def _apply_status_rules(item: Despesa) -> None:
    """Despesa compensada sempre tem data de pagamento; as demais, nunca."""
    if item.status == "Compensado":
        item.data_pagamento = item.data_pagamento or date.today()
    else:
        item.data_pagamento = None


@bp.get("")
@require_permission("view_despesas")
def list_despesas():
    query = select(Despesa).order_by(Despesa.data_vencimento.desc(), Despesa.id.desc())
    if bounds := month_bounds(request.args.get("mes")):
        query = query.where(Despesa.data_vencimento >= bounds[0], Despesa.data_vencimento < bounds[1])
    return [d.to_dict() for d in db.session.scalars(query)]


@bp.post("")
@require_permission("add_despesas")
def create_despesa():
    item = Despesa(**parse_payload(request.get_json(silent=True), SPEC), registrado_por=current_user)
    _apply_status_rules(item)
    db.session.add(item)
    db.session.commit()
    return item.to_dict(), 201


@bp.put("/<int:item_id>")
@require_permission("edit_despesas")
def update_despesa(item_id: int):
    item = db.get_or_404(Despesa, item_id, description="Despesa não encontrada.")
    for attr, value in parse_payload(request.get_json(silent=True), SPEC, partial=True).items():
        setattr(item, attr, value)
    _apply_status_rules(item)
    db.session.commit()
    return item.to_dict()


@bp.patch("/<int:item_id>/status")
@require_permission("compensar_despesas")
def update_status(item_id: int):
    item = db.get_or_404(Despesa, item_id, description="Despesa não encontrada.")
    fields = parse_payload(request.get_json(silent=True), STATUS_SPEC)
    item.status = fields["status"]
    item.data_pagamento = fields["data_pagamento"]
    _apply_status_rules(item)
    db.session.commit()
    return item.to_dict()


@bp.delete("/<int:item_id>")
@require_permission("delete_despesas")
def delete_despesa(item_id: int):
    item = db.get_or_404(Despesa, item_id, description="Despesa não encontrada.")
    db.session.delete(item)
    db.session.commit()
    return "", 204
