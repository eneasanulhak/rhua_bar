import json
from datetime import date
from decimal import Decimal
from pathlib import Path

import click
from flask import Flask
from sqlalchemy import func, select

from .extensions import db
from .models import ROLES, Despesa, Extra, Faturamento, User

DEMO_USERS = [
    ("Fernando (Nando)", "fernando@empresa.com.br", "admin"),
    ("Francine Eing", "francine@empresa.com.br", "gerente"),
    ("Jhonatan Souza", "jhonatan@empresa.com.br", "operador"),
    ("Diego (Consultoria)", "diego@empresa.com.br", "auditor"),
]

# Mesmo mapeamento da antiga migração 002_setores_extras.sql.
SETOR_POR_FUNCAO = {"LÍDER": "SALÃO", "CUMIM": "SALÃO"}


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
                descricao=d["descricao"], fornecedor=d["fornecedorOuFavorecido"], categoria=d["categoria"],
                forma_pagamento=d["formaPagamento"], valor=Decimal(str(d["valor"])),
                data_emissao=date.fromisoformat(d["dataEmissao"]),
                data_vencimento=date.fromisoformat(d["dataVencimento"]),
                data_pagamento=date.fromisoformat(d["dataPagamento"]) if d.get("dataPagamento") else None,
                status=d["status"], numero_nf=d.get("numeroNF"), parcela=d.get("parcela"),
                observacao=d.get("observacao"), registrado_por=users_by_name.get(d["registradoPor"]),
            ))
        admin = users_by_name["Fernando (Nando)"]
        for e in data["extras"]:
            db.session.add(Extra(
                data=date.fromisoformat(e["data"]), nome=e["nome"],
                setor=e.get("setor") or SETOR_POR_FUNCAO.get(e["funcao"], e["funcao"]),
                funcao=e["funcao"], valor=Decimal(str(e["valorAReceber"])),
                forma_pagamento=e["formaPagamento"], status=e["status"],
                observacao=e.get("observacao"), registrado_por=admin,
            ))
        db.session.commit()
        click.echo(
            f"Seed concluído: {len(data['faturamentos'])} faturamentos, {len(data['despesas'])} despesas, "
            f"{len(data['extras'])} extras. Usuários de demonstração com senha '{password}'."
        )
