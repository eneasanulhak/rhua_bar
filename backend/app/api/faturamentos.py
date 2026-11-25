from flask import Blueprint, request
from flask_jwt_extended import current_user
from sqlalchemy import select

from ..extensions import db
from ..models import Faturamento
from ..permissions import require_permission
from ..validation import Field, month_bounds, parse_payload

bp = Blueprint("faturamentos", __name__)

SPEC = {
    "data": Field("data", kind="date", required=True),
    "dinheiro": Field("dinheiro", kind="money"),
    "credito": Field("credito", kind="money"),
    "debito": Field("debito", kind="money"),
    "pix": Field("pix", kind="money"),
    "voucher": Field("voucher", kind="money"),
    "sicoob": Field("sicoob", kind="money"),
    "diferencaCaixa": Field("diferenca_caixa", kind="money"),
    "observacao": Field("observacao"),
}


@bp.get("")
@require_permission("view_faturamento")
def list_faturamentos():
    query = select(Faturamento).order_by(Faturamento.data.desc(), Faturamento.id.desc())
    if bounds := month_bounds(request.args.get("mes")):
        query = query.where(Faturamento.data >= bounds[0], Faturamento.data < bounds[1])
    return [f.to_dict() for f in db.session.scalars(query)]


@bp.post("")
@require_permission("add_faturamento")
def create_faturamento():
    item = Faturamento(**parse_payload(request.get_json(silent=True), SPEC), registrado_por=current_user)
    db.session.add(item)
    db.session.commit()
    return item.to_dict(), 201


@bp.put("/<int:item_id>")
@require_permission("edit_faturamento")
def update_faturamento(item_id: int):
    item = db.get_or_404(Faturamento, item_id, description="Faturamento não encontrado.")
    for attr, value in parse_payload(request.get_json(silent=True), SPEC, partial=True).items():
        setattr(item, attr, value)
    db.session.commit()
    return item.to_dict()


@bp.delete("/<int:item_id>")
@require_permission("delete_faturamento")
def delete_faturamento(item_id: int):
    item = db.get_or_404(Faturamento, item_id, description="Faturamento não encontrado.")
    db.session.delete(item)
    db.session.commit()
    return "", 204
