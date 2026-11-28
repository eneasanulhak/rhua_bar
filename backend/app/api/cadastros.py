"""CRUD dos cadastros auxiliares.

Listar é liberado para quem vê despesas (os formulários de lançamento precisam das listas);
criar, editar e excluir exige `manage_cadastros` (só o administrador).
"""

from collections.abc import Callable

from flask import Blueprint, abort, request
from sqlalchemy import exists, func, select

from ..cadastros import resolver_cadastro, validar_funcao_do_setor
from ..extensions import db
from ..models import Categoria, Colaborador, Despesa, Extra, FormaPagamento, Fornecedor, Funcao, Setor
from ..permissions import require_permission
from ..validation import Field, parse_payload


def cadastro_blueprint(
    name: str,
    model,
    spec: dict[str, Field],
    em_uso: Callable[[int], bool],
    unico_por: str | None = None,
    validar: Callable[[dict, object | None], dict] | None = None,
) -> Blueprint:
    """Gera listar/criar/editar/excluir de um cadastro.

    `unico_por`: o nome só precisa ser único dentro deste atributo (ex.: função por setor).
    `validar(campos, item_atual)`: troca ids por objetos e aplica regras; devolve os campos.
    """
    bp = Blueprint(name, __name__)
    flags = {f.attr for f in spec.values() if f.kind == "bool"}

    def nome_livre(nome: str, escopo=None, ignorar_id: int | None = None) -> None:
        query = select(model.id).where(func.lower(model.nome) == func.lower(nome))
        if unico_por:
            query = query.where(getattr(model, unico_por) == escopo)
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
        nome_livre(fields["nome"], fields.get(unico_por))
        if validar:
            fields = validar(fields, None)
        item = model(**{k: v for k, v in fields.items() if v is not None})
        db.session.add(item)
        db.session.commit()
        return item.to_dict(), 201

    @bp.put("/<int:item_id>")
    @require_permission("manage_cadastros")
    def atualizar(item_id: int):
        item = carregar(item_id)
        fields = parse_payload(request.get_json(silent=True), spec, partial=True)
        if "nome" in fields or (unico_por and unico_por in fields):
            nome_livre(
                fields.get("nome", item.nome),
                fields.get(unico_por, getattr(item, unico_por)) if unico_por else None,
                ignorar_id=item.id,
            )
        if validar:
            fields = validar(fields, item)
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


def _usado_em(*colunas) -> Callable[[int], bool]:
    return lambda item_id: any(db.session.scalar(select(exists().where(c == item_id))) for c in colunas)


categorias_bp = cadastro_blueprint(
    "categorias",
    Categoria,
    {
        "nome": Field("nome", required=True, max_len=80),
        "ativo": Field("ativo", kind="bool"),
    },
    _usado_em(Despesa.categoria_id),
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
    _usado_em(Despesa.forma_pagamento_id, Extra.forma_pagamento_id),
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
    _usado_em(Despesa.fornecedor_id),
)


# --- Cadastros de extras ------------------------------------------------------

setores_bp = cadastro_blueprint(
    "setores",
    Setor,
    {
        "nome": Field("nome", required=True, max_len=60),
        "ativo": Field("ativo", kind="bool"),
    },
    _usado_em(Funcao.setor_id, Colaborador.setor_id, Extra.setor_id),
)


def _validar_funcao(fields: dict, atual: Funcao | None) -> dict:
    if "setor_id" in fields:
        fields["setor"] = resolver_cadastro(Setor, fields.pop("setor_id"), "setorId", atual and atual.setor_id)
    return fields


funcoes_bp = cadastro_blueprint(
    "funcoes",
    Funcao,
    {
        "nome": Field("nome", required=True, max_len=60),
        "setorId": Field("setor_id", kind="int", required=True),
        "ativo": Field("ativo", kind="bool"),
    },
    _usado_em(Colaborador.funcao_id, Extra.funcao_id),
    unico_por="setor_id",
    validar=_validar_funcao,
)


def _validar_colaborador(fields: dict, atual: Colaborador | None) -> dict:
    """Setor e função padrão são opcionais, mas a função precisa ser do setor."""
    for attr, model, campo in (("setor", Setor, "setorId"), ("funcao", Funcao, "funcaoId")):
        if f"{attr}_id" in fields:
            item_id = fields.pop(f"{attr}_id")
            fields[attr] = None if item_id is None else resolver_cadastro(
                model, item_id, campo, atual and getattr(atual, f"{attr}_id"),
            )
    setor = fields["setor"] if "setor" in fields else atual and atual.setor
    funcao = fields["funcao"] if "funcao" in fields else atual and atual.funcao
    validar_funcao_do_setor(funcao, setor)
    return fields


colaboradores_bp = cadastro_blueprint(
    "colaboradores",
    Colaborador,
    {
        "nome": Field("nome", required=True, max_len=120),
        "setorId": Field("setor_id", kind="int"),
        "funcaoId": Field("funcao_id", kind="int"),
        "valorDiaria": Field("valor_diaria", kind="money"),
        "telefone": Field("telefone", max_len=30),
        "chavePix": Field("chave_pix", max_len=120),
        "observacao": Field("observacao"),
        "ativo": Field("ativo", kind="bool"),
    },
    _usado_em(Extra.colaborador_id),
    validar=_validar_colaborador,
)
