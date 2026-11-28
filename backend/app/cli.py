import json
from datetime import date
from decimal import Decimal
from pathlib import Path

import click
from flask import Flask
from sqlalchemy import func, select

from .cadastros import (
    buscar_funcao,
    buscar_por_nome,
    garantir_cadastros_padrao,
    obter_ou_criar_colaborador,
    obter_ou_criar_fornecedor,
)
from .extensions import db
from .models import FUNCOES_EXTRA, ROLES, Categoria, Despesa, Extra, Faturamento, FormaPagamento, Setor, User

DEMO_USERS = [
    ("Fernando (Nando)", "fernando@empresa.com.br", "admin"),
    ("Francine Eing", "francine@empresa.com.br", "gerente"),
    ("Jhonatan Souza", "jhonatan@empresa.com.br", "operador"),
    ("Diego (Consultoria)", "diego@empresa.com.br", "auditor"),
]


def register_cli(app: Flask) -> None:
    @app.cli.command("create-user")
    @click.option("--name", prompt="Nome")
    @click.option("--email", prompt="E-mail")
    @click.option("--role", type=click.Choice(ROLES), default="admin", show_default=True)
    @click.password_option(prompt="Senha")
    def create_user(name: str, email: str, role: str, password: str):
        """Cria um usuário (por padrão, administrador)."""
        email = email.strip().lower()
        if db.session.scalar(select(User).where(func.lower(User.email) == email)):
            raise click.ClickException("Já existe um usuário com este e-mail.")
        user = User(name=name, email=email, role=role)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        click.echo(f"Usuário {email} ({role}) criado.")

    @app.cli.command("seed-demo")
    @click.option("--password", default="rhua123", show_default=True, help="Senha dos 4 usuários de demonstração.")
    def seed_demo(password: str):
        """Carrega usuários e lançamentos de demonstração (somente em banco vazio)."""
        if db.session.scalar(select(func.count(Faturamento.id))) or db.session.scalar(select(func.count(Despesa.id))):
            raise click.ClickException("O banco já tem lançamentos; seed cancelado.")

        users_by_name = {}
        for name, email, role in DEMO_USERS:
            user = db.session.scalar(select(User).where(User.email == email))
            if not user:
                user = User(name=name, email=email, role=role)
                user.set_password(password)
                db.session.add(user)
            users_by_name[name] = user

        garantir_cadastros_padrao()
        data = json.loads((Path(__file__).parent / "seed_data.json").read_text(encoding="utf-8"))
        for f in data["faturamentos"]:
            db.session.add(Faturamento(
                data=date.fromisoformat(f["data"]),
                dinheiro=Decimal(str(f["dinheiro"])), credito=Decimal(str(f["credito"])),
                debito=Decimal(str(f["debito"])), pix=Decimal(str(f["pix"])),
                voucher=Decimal(str(f["voucher"])), sicoob=Decimal(str(f["sicoob"])),
                diferenca_caixa=Decimal(str(f["diferencaCaixa"])), observacao=f.get("observacao"),
                registrado_por=users_by_name.get(f["registradoPor"]),
            ))
        for d in data["despesas"]:
            db.session.add(Despesa(
                descricao=d["descricao"], fornecedor=obter_ou_criar_fornecedor(d["fornecedorOuFavorecido"]),
                categoria=buscar_por_nome(Categoria, d["categoria"]),
                forma_pagamento=buscar_por_nome(FormaPagamento, d["formaPagamento"]), valor=Decimal(str(d["valor"])),
                data_emissao=date.fromisoformat(d["dataEmissao"]),
                data_vencimento=date.fromisoformat(d["dataVencimento"]),
                data_pagamento=date.fromisoformat(d["dataPagamento"]) if d.get("dataPagamento") else None,
                status=d["status"], numero_nf=d.get("numeroNF"), parcela=d.get("parcela"),
                observacao=d.get("observacao"), registrado_por=users_by_name.get(d["registradoPor"]),
            ))
        admin = users_by_name["Fernando (Nando)"]
        for e in data["extras"]:
            setor = buscar_por_nome(Setor, e.get("setor") or FUNCOES_EXTRA[e["funcao"]])
            funcao = buscar_funcao(e["funcao"], setor.id)
            valor = Decimal(str(e["valorAReceber"]))
            db.session.add(Extra(
                data=date.fromisoformat(e["data"]),
                colaborador=obter_ou_criar_colaborador(e["nome"], setor=setor, funcao=funcao, valor_diaria=valor),
                setor=setor, funcao=funcao, valor=valor,
                forma_pagamento=buscar_por_nome(FormaPagamento, e["formaPagamento"]), status=e["status"],
                observacao=e.get("observacao"), registrado_por=admin,
            ))
        db.session.commit()
        click.echo(
            f"Seed concluído: {len(data['faturamentos'])} faturamentos, {len(data['despesas'])} despesas, "
            f"{len(data['extras'])} extras. Usuários de demonstração com senha '{password}'."
        )
