from flask import Flask

from .auth import bp as auth_bp
from .cadastros import (
    categorias_bp,
    colaboradores_bp,
    formas_pagamento_bp,
    fornecedores_bp,
    funcoes_bp,
    setores_bp,
)
from .despesas import bp as despesas_bp
from .extras import bp as extras_bp
from .faturamentos import bp as faturamentos_bp
from .notificacoes import bp as notificacoes_bp
from .users import bp as users_bp


def register_blueprints(app: Flask) -> None:
    for bp in (
        auth_bp, users_bp, faturamentos_bp, despesas_bp, extras_bp, notificacoes_bp,
        categorias_bp, formas_pagamento_bp, fornecedores_bp, setores_bp, funcoes_bp, colaboradores_bp,
    ):
        app.register_blueprint(bp, url_prefix=f"/api/{bp.name}")
