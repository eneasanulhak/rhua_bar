from flask import Flask

from .auth import bp as auth_bp
from .despesas import bp as despesas_bp
from .extras import bp as extras_bp
from .faturamentos import bp as faturamentos_bp
from .notificacoes import bp as notificacoes_bp
from .users import bp as users_bp


def register_blueprints(app: Flask) -> None:
    for bp in (auth_bp, users_bp, faturamentos_bp, despesas_bp, extras_bp, notificacoes_bp):
        app.register_blueprint(bp, url_prefix=f"/api/{bp.name}")
