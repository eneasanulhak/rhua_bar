from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Enum, ForeignKey, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from werkzeug.security import check_password_hash, generate_password_hash

from .extensions import db

ROLES = ("admin", "gerente", "operador", "auditor")

# Valores iniciais dos cadastros auxiliares (criados pela migração e por `garantir_cadastros_padrao`).
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
# Categorias que o DRE mostra abaixo do resultado operacional (não são custo da operação).
CATEGORIAS_FORA_DO_RESULTADO = ("Retirada de Sócios", "Adiantamentos")
PAYMENT_METHODS = ("Dinheiro", "Crédito", "Débito", "Pix", "Voucher", "Boleto", "DDA", "Débito em conta", "Sicoob")
TRANSACTION_STATUS = ("Compensado", "Pendente", "Atrasado")
SETORES = ("COZINHA", "SEGURANÇA", "BAR", "SALÃO", "RECEPÇÃO", "LIMPEZA")
# Função -> setor ao qual pertence.
FUNCOES_EXTRA = {
    "COZINHA": "COZINHA", "BAR": "BAR", "SALÃO": "SALÃO", "LÍDER": "SALÃO", "CUMIM": "SALÃO",
    "SEGURANÇA": "SEGURANÇA", "RECEPÇÃO": "RECEPÇÃO", "LIMPEZA": "LIMPEZA",
}
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


class CadastroMixin:
    """Campos comuns dos cadastros auxiliares. Itens em uso não são excluídos, só inativados."""

    id: Mapped[int] = mapped_column(primary_key=True)
    ativo: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


class Categoria(CadastroMixin, db.Model):
    __tablename__ = "categorias"

    nome: Mapped[str] = mapped_column(String(80), unique=True)
    # Retiradas, adiantamentos…: o DRE as mostra depois do resultado operacional.
    fora_do_resultado: Mapped[bool] = mapped_column(default=False)

    def to_dict(self) -> dict:
        return {"id": self.id, "nome": self.nome, "foraDoResultado": self.fora_do_resultado, "ativo": self.ativo}


class FormaPagamento(CadastroMixin, db.Model):
    __tablename__ = "formas_pagamento"

    nome: Mapped[str] = mapped_column(String(60), unique=True)
    usa_despesas: Mapped[bool] = mapped_column(default=True)
    usa_extras: Mapped[bool] = mapped_column(default=False)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "nome": self.nome,
            "usaDespesas": self.usa_despesas,
            "usaExtras": self.usa_extras,
            "ativo": self.ativo,
        }


class Fornecedor(CadastroMixin, db.Model):
    __tablename__ = "fornecedores"

    nome: Mapped[str] = mapped_column(String(180), unique=True)
    documento: Mapped[str | None] = mapped_column(String(20))
    telefone: Mapped[str | None] = mapped_column(String(30))
    email: Mapped[str | None] = mapped_column(String(180))
    observacao: Mapped[str | None] = mapped_column(Text)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "nome": self.nome,
            "documento": self.documento,
            "telefone": self.telefone,
            "email": self.email,
            "observacao": self.observacao,
            "ativo": self.ativo,
        }


class Despesa(RegistradoPorMixin, db.Model):
    __tablename__ = "despesas"

    id: Mapped[int] = mapped_column(primary_key=True)
    descricao: Mapped[str] = mapped_column(String(255))
    fornecedor_id: Mapped[int] = mapped_column(ForeignKey("fornecedores.id"), index=True)
    categoria_id: Mapped[int] = mapped_column(ForeignKey("categorias.id"), index=True)
    forma_pagamento_id: Mapped[int] = mapped_column(ForeignKey("formas_pagamento.id"), index=True)
    valor: Mapped[Decimal] = mapped_column(Money)
    data_emissao: Mapped[date]
    data_vencimento: Mapped[date] = mapped_column(index=True)
    data_pagamento: Mapped[date | None]
    status: Mapped[str] = mapped_column(Enum(*TRANSACTION_STATUS, name="transaction_status"), default="Pendente")
    numero_nf: Mapped[str | None] = mapped_column(String(60))
    parcela: Mapped[str | None] = mapped_column(String(20))
    observacao: Mapped[str | None] = mapped_column(Text)

    registrado_por: Mapped[User | None] = relationship()
    fornecedor: Mapped[Fornecedor] = relationship(lazy="joined")
    categoria: Mapped[Categoria] = relationship(lazy="joined")
    forma_pagamento: Mapped[FormaPagamento] = relationship(lazy="joined")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "descricao": self.descricao,
            "fornecedorId": self.fornecedor_id,
            "fornecedorOuFavorecido": self.fornecedor.nome,
            "categoriaId": self.categoria_id,
            "categoria": self.categoria.nome,
            "formaPagamentoId": self.forma_pagamento_id,
            "formaPagamento": self.forma_pagamento.nome,
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


class Setor(CadastroMixin, db.Model):
    __tablename__ = "setores"

    nome: Mapped[str] = mapped_column(String(60), unique=True)

    def to_dict(self) -> dict:
        return {"id": self.id, "nome": self.nome, "ativo": self.ativo}


class Funcao(CadastroMixin, db.Model):
    """Função de extra; pertence a um setor (o nome só se repete em setores diferentes)."""

    __tablename__ = "funcoes"
    __table_args__ = (UniqueConstraint("setor_id", "nome", name="uq_funcoes_setor_nome"),)

    nome: Mapped[str] = mapped_column(String(60))
    setor_id: Mapped[int] = mapped_column(ForeignKey("setores.id"), index=True)

    setor: Mapped[Setor] = relationship(lazy="joined")

    def to_dict(self) -> dict:
        return {"id": self.id, "nome": self.nome, "setorId": self.setor_id, "setor": self.setor.nome, "ativo": self.ativo}


class Colaborador(CadastroMixin, db.Model):
    """Colaborador extra. Setor, função e valor da diária são padrões para agilizar o lançamento."""

    __tablename__ = "colaboradores"

    nome: Mapped[str] = mapped_column(String(120), unique=True)
    setor_id: Mapped[int | None] = mapped_column(ForeignKey("setores.id"))
    funcao_id: Mapped[int | None] = mapped_column(ForeignKey("funcoes.id"))
    valor_diaria: Mapped[Decimal] = mapped_column(Money, default=0)
    telefone: Mapped[str | None] = mapped_column(String(30))
    chave_pix: Mapped[str | None] = mapped_column(String(120))
    observacao: Mapped[str | None] = mapped_column(Text)

    setor: Mapped[Setor | None] = relationship(lazy="joined")
    funcao: Mapped[Funcao | None] = relationship(lazy="joined")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "nome": self.nome,
            "setorId": self.setor_id,
            "setor": self.setor.nome if self.setor else None,
            "funcaoId": self.funcao_id,
            "funcao": self.funcao.nome if self.funcao else None,
            "valorDiaria": _money(self.valor_diaria),
            "telefone": self.telefone,
            "chavePix": self.chave_pix,
            "observacao": self.observacao,
            "ativo": self.ativo,
        }


class Extra(RegistradoPorMixin, db.Model):
    __tablename__ = "extras"

    id: Mapped[int] = mapped_column(primary_key=True)
    data: Mapped[date] = mapped_column(index=True)
    colaborador_id: Mapped[int] = mapped_column(ForeignKey("colaboradores.id"), index=True)
    setor_id: Mapped[int] = mapped_column(ForeignKey("setores.id"), index=True)
    funcao_id: Mapped[int] = mapped_column(ForeignKey("funcoes.id"), index=True)
    valor: Mapped[Decimal] = mapped_column(Money)
    forma_pagamento_id: Mapped[int] = mapped_column(ForeignKey("formas_pagamento.id"), index=True)
    status: Mapped[str] = mapped_column(Enum(*EXTRA_STATUS, name="extra_status"), default="PENDENTE")
    observacao: Mapped[str | None] = mapped_column(Text)

    registrado_por: Mapped[User | None] = relationship()
    colaborador: Mapped[Colaborador] = relationship(lazy="joined")
    setor: Mapped[Setor] = relationship(lazy="joined")
    funcao: Mapped[Funcao] = relationship(lazy="joined")
    forma_pagamento: Mapped[FormaPagamento] = relationship(lazy="joined")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "data": _iso(self.data),
            "colaboradorId": self.colaborador_id,
            "nome": self.colaborador.nome,
            "setorId": self.setor_id,
            "setor": self.setor.nome,
            "funcaoId": self.funcao_id,
            "funcao": self.funcao.nome,
            "valorAReceber": _money(self.valor),
            "formaPagamentoId": self.forma_pagamento_id,
            "formaPagamento": self.forma_pagamento.nome,
            "status": self.status,
            "observacao": self.observacao,
            "registradoPor": self.registrado_por_nome,
        }
