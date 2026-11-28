from datetime import date, timedelta

from flask import Blueprint
from sqlalchemy import select

from ..extensions import db
from ..models import Despesa
from ..permissions import require_permission

bp = Blueprint("notificacoes", __name__)


def _brl(value) -> str:
    formatted = f"{float(value):,.2f}"
    return "R$ " + formatted.replace(",", "X").replace(".", ",").replace("X", ".")


def _br_date(value: date) -> str:
    return value.strftime("%d/%m/%Y")


@bp.get("")
@require_permission("view_despesas")
def list_notificacoes():
    """Despesas não pagas vencidas, vencendo hoje ou nos próximos 7 dias."""
    today = date.today()
    query = (
        select(Despesa)
        .where(Despesa.status != "Compensado", Despesa.data_vencimento <= today + timedelta(days=7))
        .order_by(Despesa.data_vencimento)
    )

    items = []
    for d in db.session.scalars(query):
        days = (d.data_vencimento - today).days
        valor, quem, venc = _brl(d.valor), d.fornecedor.nome, _br_date(d.data_vencimento)
        if days < 0:
            kind, title = "overdue", "Boleto atrasado"
            message = f'O pagamento para "{quem}" de {valor} venceu há {-days} dia(s) em {venc}.'
            tipo = "urgent"
        elif days == 0:
            kind, title, tipo = "today", "Vence hoje", "warning"
            message = f'Boleto de {valor} para "{quem}" vence HOJE.'
        else:
            kind, title, tipo = "upcoming", "Vencimento próximo", "info"
            message = f'Boleto de {valor} para "{quem}" vence em {days} dia(s) ({venc}).'
        items.append({
            "id": f"notif-{kind}-{d.id}",
            "title": title,
            "message": message,
            "date": d.data_vencimento.isoformat(),
            "type": tipo,
            "despesaId": d.id,
        })
    return items
