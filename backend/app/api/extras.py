from flask import Blueprint, request
from flask_jwt_extended import current_user
from sqlalchemy import select

from ..extensions import db
from ..models import EXTRA_PAYMENT_METHODS, EXTRA_STATUS, FUNCOES_EXTRA, SETORES, Extra
from ..permissions import require_permission
from ..validation import Field, month_bounds, parse_payload

# Os extras usam as mesmas permissões de despesas, como no sistema original.
bp = Blueprint("extras", __name__)

SPEC = {
    "data": Field("data", kind="date", required=True),
    "nome": Field("nome", required=True, max_len=120),
    "setor": Field("setor", required=True, choices=SETORES),
    "funcao": Field("funcao", required=True, choices=FUNCOES_EXTRA),
    "valorAReceber": Field("valor", kind="money", required=True),
    "formaPagamento": Field("forma_pagamento", required=True, choices=EXTRA_PAYMENT_METHODS),
    "status": Field("status", required=True, choices=EXTRA_STATUS),
    "observacao": Field("observacao"),
}


@bp.get("")
@require_permission("view_despesas")
def list_extras():
    query = select(Extra).order_by(Extra.data.desc(), Extra.id.desc())
    if bounds := month_bounds(request.args.get("mes")):
        query = query.where(Extra.data >= bounds[0], Extra.data < bounds[1])
    return [e.to_dict() for e in db.session.scalars(query)]


@bp.post("")
@require_permission("add_despesas")
def create_extra():
    item = Extra(**parse_payload(request.get_json(silent=True), SPEC), registrado_por=current_user)
    db.session.add(item)
    db.session.commit()
    return item.to_dict(), 201


@bp.put("/<int:item_id>")
@require_permission("edit_despesas")
def update_extra(item_id: int):
    item = db.get_or_404(Extra, item_id, description="Extra não encontrado.")
    for attr, value in parse_payload(request.get_json(silent=True), SPEC, partial=True).items():
        setattr(item, attr, value)
    db.session.commit()
    return item.to_dict()


@bp.delete("/<int:item_id>")
@require_permission("delete_despesas")
def delete_extra(item_id: int):
    item = db.get_or_404(Extra, item_id, description="Extra não encontrado.")
    db.session.delete(item)
    db.session.commit()
    return "", 204
