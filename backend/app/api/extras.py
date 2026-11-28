from flask import Blueprint, request
from flask_jwt_extended import current_user
from sqlalchemy import select

from ..cadastros import obter_ou_criar_colaborador, resolver_cadastro, validar_funcao_do_setor
from ..extensions import db
from ..models import EXTRA_STATUS, Extra, FormaPagamento, Funcao, Setor
from ..permissions import require_permission
from ..validation import Field, month_bounds, parse_payload

# Os extras usam as mesmas permissões de despesas, como no sistema original.
bp = Blueprint("extras", __name__)

# O colaborador vem pelo nome: se ainda não existir, é cadastrado automaticamente.
# Setor, função e forma de pagamento vêm pelo id do cadastro.
SPEC = {
    "data": Field("data", kind="date", required=True),
    "nome": Field("colaborador_nome", required=True, max_len=120),
    "setorId": Field("setor_id", kind="int", required=True),
    "funcaoId": Field("funcao_id", kind="int", required=True),
    "valorAReceber": Field("valor", kind="money", required=True),
    "formaPagamentoId": Field("forma_pagamento_id", kind="int", required=True),
    "status": Field("status", required=True, choices=EXTRA_STATUS),
    "observacao": Field("observacao"),
}


def _resolver_cadastros(fields: dict, atual: Extra | None = None) -> dict:
    """Troca ids e o nome do colaborador pelos cadastros e valida a função do setor."""
    if "setor_id" in fields:
        fields["setor"] = resolver_cadastro(Setor, fields.pop("setor_id"), "setorId", atual and atual.setor_id)
    if "funcao_id" in fields:
        fields["funcao"] = resolver_cadastro(Funcao, fields.pop("funcao_id"), "funcaoId", atual and atual.funcao_id)
    if "forma_pagamento_id" in fields:
        fields["forma_pagamento"] = resolver_cadastro(
            FormaPagamento, fields.pop("forma_pagamento_id"), "formaPagamentoId",
            atual and atual.forma_pagamento_id, valido=lambda f: f.usa_extras,
        )

    setor = fields.get("setor") or atual.setor
    funcao = fields.get("funcao") or atual.funcao
    validar_funcao_do_setor(funcao, setor)

    if "colaborador_nome" in fields:
        fields["colaborador"] = obter_ou_criar_colaborador(
            fields.pop("colaborador_nome"),
            setor=setor, funcao=funcao, valor_diaria=fields.get("valor", atual and atual.valor),
        )
    return fields


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
    fields = _resolver_cadastros(parse_payload(request.get_json(silent=True), SPEC))
    item = Extra(**fields, registrado_por=current_user)
    db.session.add(item)
    db.session.commit()
    return item.to_dict(), 201


@bp.put("/<int:item_id>")
@require_permission("edit_despesas")
def update_extra(item_id: int):
    item = db.get_or_404(Extra, item_id, description="Extra não encontrado.")
    fields = _resolver_cadastros(parse_payload(request.get_json(silent=True), SPEC, partial=True), item)
    for attr, value in fields.items():
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
