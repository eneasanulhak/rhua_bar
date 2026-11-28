"""DRE simplificado do período, usado pelo Painel & DRE e pela tela de Relatórios.

Duas leituras do mesmo período:
- Resultado (competência pelo vencimento): faturamento − tudo que vence no período, pago ou não.
- Saldo de caixa: faturamento − só o que já foi pago.

Despesas de categorias marcadas `fora_do_resultado` (retiradas, adiantamentos) ficam abaixo do
resultado operacional e só aparecem para quem tem `view_retiradas`.
"""

from decimal import Decimal

from flask import Blueprint, request
from flask_jwt_extended import current_user
from sqlalchemy import case, func, select

from ..extensions import db
from ..models import Categoria, Despesa, Extra, Faturamento
from ..permissions import has_permission, require_permission
from ..validation import month_bounds

bp = Blueprint("relatorios", __name__)

MEIOS = ("dinheiro", "credito", "debito", "pix", "voucher", "sicoob")
ZERO = Decimal("0")


def _soma(coluna):
    return func.coalesce(func.sum(coluna), 0)


def _somas_despesas(bounds) -> list[dict]:
    """Total e total pago por categoria, com a marcação fora_do_resultado."""
    pago = _soma(case((Despesa.status == "Compensado", Despesa.valor), else_=0))
    query = (
        select(Categoria.nome, Categoria.fora_do_resultado, _soma(Despesa.valor), pago)
        .join(Despesa, Despesa.categoria_id == Categoria.id)
        .group_by(Categoria.id, Categoria.nome, Categoria.fora_do_resultado)
    )
    if bounds:
        query = query.where(Despesa.data_vencimento >= bounds[0], Despesa.data_vencimento < bounds[1])
    return [
        {"categoria": nome, "fora": bool(fora), "total": Decimal(total), "pago": Decimal(pago)}
        for nome, fora, total, pago in db.session.execute(query)
    ]


def _grupo(linhas: list[dict]) -> dict:
    linhas = sorted(linhas, key=lambda l: l["total"], reverse=True)
    return {
        "total": float(sum((l["total"] for l in linhas), ZERO)),
        "pago": float(sum((l["pago"] for l in linhas), ZERO)),
        "categorias": [
            {"categoria": l["categoria"], "total": float(l["total"]), "pago": float(l["pago"])} for l in linhas
        ],
    }


@bp.get("/dre")
@require_permission("view_dashboard")
def dre():
    mes = request.args.get("mes")
    bounds = month_bounds(mes)

    fat_query = select(*(_soma(getattr(Faturamento, m)) for m in MEIOS), _soma(Faturamento.diferenca_caixa))
    if bounds:
        fat_query = fat_query.where(Faturamento.data >= bounds[0], Faturamento.data < bounds[1])
    *por_meio, diferenca = db.session.execute(fat_query).one()
    faturamento = sum((Decimal(v) for v in por_meio), ZERO)

    ext_query = select(_soma(Extra.valor), _soma(case((Extra.status == "PAGO", Extra.valor), else_=0)))
    if bounds:
        ext_query = ext_query.where(Extra.data >= bounds[0], Extra.data < bounds[1])
    extras_total, extras_pago = (Decimal(v) for v in db.session.execute(ext_query).one())

    linhas = _somas_despesas(bounds)
    despesas = _grupo([l for l in linhas if not l["fora"]])
    retiradas = _grupo([l for l in linhas if l["fora"]])
    ve_retiradas = has_permission(current_user.role, "view_retiradas")

    resultado_operacional = float(faturamento) - despesas["total"] - float(extras_total)
    saldo_caixa = float(faturamento) - despesas["pago"] - float(extras_pago)
    a_pagar = (despesas["total"] - despesas["pago"]) + float(extras_total - extras_pago)
    if ve_retiradas:
        saldo_caixa -= retiradas["pago"]
        a_pagar += retiradas["total"] - retiradas["pago"]

    def r(v: float) -> float:  # evita resíduos de ponto flutuante (ex.: 0.30000000000000004)
        return round(v, 2)

    return {
        "periodo": mes or "all",
        "faturamento": {
            "total": float(faturamento),
            "porMeio": {m: float(v) for m, v in zip(MEIOS, por_meio)},
            "diferencaCaixa": float(diferenca),
        },
        "despesas": despesas,
        "extras": {"total": float(extras_total), "pago": float(extras_pago)},
        "resultadoOperacional": r(resultado_operacional),
        "retiradas": retiradas if ve_retiradas else None,
        "resultadoFinal": r(resultado_operacional - retiradas["total"]) if ve_retiradas else None,
        "saldoCaixa": r(saldo_caixa),
        "aPagar": r(a_pagar),
    }
