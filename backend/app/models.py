from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Enum, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from werkzeug.security import check_password_hash, generate_password_hash

from .extensions import db

ROLES = ("admin", "gerente", "operador", "auditor")

EXPENSE_CATEGORIES = (
    "Fixos e Básicos",
    "Compras Bar e Salão",
    "Compras Cozinha e Hortifruti",
    "Salário Funcionários",
    "Operacional / Extras",
    "Atrações e DJs",
    "Manutenção e Reparos",
    "Pagamentos e Reembolsos",
    "Impostos e Taxas",
    "Parcelamentos e Boletos",
    "Retirada de Sócios",
    "Adiantamentos",
)
PAYMENT_METHODS = ("Dinheiro", "Crédito", "Débito", "Pix", "Voucher", "Boleto", "DDA", "Débito em conta", "Sicoob")
TRANSACTION_STATUS = ("Compensado", "Pendente", "Atrasado")
SETORES = ("COZINHA", "SEGURANÇA", "BAR", "SALÃO", "RECEPÇÃO", "LIMPEZA")
FUNCOES_EXTRA = ("COZINHA", "BAR", "SALÃO", "LÍDER", "SEGURANÇA", "RECEPÇÃO", "LIMPEZA", "CUMIM")
EXTRA_PAYMENT_METHODS = ("Dinheiro", "Pix")
EXTRA_STATUS = ("PAGO", "PENDENTE")

Money = Numeric(12, 2)


def _money(value: Decimal | None) -> float:
    return float(value or 0)


def _iso(value: date | None) -> str | None:
    return value.isoformat() if value else None


class User(db.Model):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(180), unique=True, index=True)
    role: Mapped[str] = mapped_column(Enum(*ROLES, name="user_role"), default="operador")
    avatar: Mapped[str | None] = mapped_column(String(500))
    password_hash: Mapped[str] = mapped_column(String(255))
    ativo: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "avatar": self.avatar,
            "ativo": self.ativo,
        }


class RegistradoPorMixin:
    registrado_por_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    @property
    def registrado_por_nome(self) -> str:
        return self.registrado_por.name if self.registrado_por else ""


class Faturamento(RegistradoPorMixin, db.Model):
    __tablename__ = "faturamentos"

    id: Mapped[int] = mapped_column(primary_key=True)
    data: Mapped[date] = mapped_column(index=True)
    dinheiro: Mapped[Decimal] = mapped_column(Money, default=0)
    credito: Mapped[Decimal] = mapped_column(Money, default=0)
    debito: Mapped[Decimal] = mapped_column(Money, default=0)
    pix: Mapped[Decimal] = mapped_column(Money, default=0)
    voucher: Mapped[Decimal] = mapped_column(Money, default=0)
    sicoob: Mapped[Decimal] = mapped_column(Money, default=0)
    diferenca_caixa: Mapped[Decimal] = mapped_column(Money, default=0)
    observacao: Mapped[str | None] = mapped_column(Text)

    registrado_por: Mapped[User | None] = relationship()

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "data": _iso(self.data),
            "dinheiro": _money(self.dinheiro),
            "credito": _money(self.credito),
            "debito": _money(self.debito),
            "pix": _money(self.pix),
            "voucher": _money(self.voucher),
            "sicoob": _money(self.sicoob),
            "diferencaCaixa": _money(self.diferenca_caixa),
            "observacao": self.observacao,
            "registradoPor": self.registrado_por_nome,
        }


class Despesa(RegistradoPorMixin, db.Model):
    __tablename__ = "despesas"

    id: Mapped[int] = mapped_column(primary_key=True)
    descricao: Mapped[str] = mapped_column(String(255))
    fornecedor: Mapped[str] = mapped_column(String(180))
    categoria: Mapped[str] = mapped_column(Enum(*EXPENSE_CATEGORIES, name="expense_category"))
    forma_pagamento: Mapped[str] = mapped_column(Enum(*PAYMENT_METHODS, name="payment_method"))
    valor: Mapped[Decimal] = mapped_column(Money)
    data_emissao: Mapped[date]
    data_vencimento: Mapped[date] = mapped_column(index=True)
    data_pagamento: Mapped[date | None]
    status: Mapped[str] = mapped_column(Enum(*TRANSACTION_STATUS, name="transaction_status"), default="Pendente")
    numero_nf: Mapped[str | None] = mapped_column(String(60))
    parcela: Mapped[str | None] = mapped_column(String(20))
    observacao: Mapped[str | None] = mapped_column(Text)

    registrado_por: Mapped[User | None] = relationship()

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "descricao": self.descricao,
            "fornecedorOuFavorecido": self.fornecedor,
            "categoria": self.categoria,
            "formaPagamento": self.forma_pagamento,
            "valor": _money(self.valor),
            "dataEmissao": _iso(self.data_emissao),
            "dataVencimento": _iso(self.data_vencimento),
            "dataPagamento": _iso(self.data_pagamento),
            "status": self.status,
            "numeroNF": self.numero_nf,
            "parcela": self.parcela,
            "observacao": self.observacao,
            "registradoPor": self.registrado_por_nome,
        }


class Extra(RegistradoPorMixin, db.Model):
    __tablename__ = "extras"

    id: Mapped[int] = mapped_column(primary_key=True)
    data: Mapped[date] = mapped_column(index=True)
    nome: Mapped[str] = mapped_column(String(120))
    setor: Mapped[str] = mapped_column(Enum(*SETORES, name="setor"))
    funcao: Mapped[str] = mapped_column(Enum(*FUNCOES_EXTRA, name="funcao_extra"))
    valor: Mapped[Decimal] = mapped_column(Money)
    forma_pagamento: Mapped[str] = mapped_column(Enum(*EXTRA_PAYMENT_METHODS, name="extra_payment_method"))
    status: Mapped[str] = mapped_column(Enum(*EXTRA_STATUS, name="extra_status"), default="PENDENTE")
    observacao: Mapped[str | None] = mapped_column(Text)

    registrado_por: Mapped[User | None] = relationship()

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "data": _iso(self.data),
            "nome": self.nome,
            "setor": self.setor,
            "funcao": self.funcao,
            "valorAReceber": _money(self.valor),
            "formaPagamento": self.forma_pagamento,
            "status": self.status,
            "observacao": self.observacao,
            "registradoPor": self.registrado_por_nome,
        }
