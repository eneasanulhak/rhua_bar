from flask import Flask, jsonify
from werkzeug.exceptions import HTTPException

from .config import Config
from .extensions import cors, db, jwt, migrate


def create_app(config_class: type[Config] = Config) -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})

    from . import models  # noqa: F401  (registra os modelos para o Alembic)
    from .api import register_blueprints
    from .cli import register_cli

    register_blueprints(app)
    register_cli(app)
    _register_jwt_callbacks()
    _register_error_handlers(app)

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    return app


def _register_jwt_callbacks() -> None:
    from .models import User

    @jwt.user_identity_loader
    def user_identity(user: User) -> str:
        return str(user.id)

    @jwt.user_lookup_loader
    def user_lookup(_header, payload):
        user = db.session.get(User, int(payload["sub"]))
        return user if user and user.ativo else None

    @jwt.user_lookup_error_loader
    def user_lookup_error(_header, _payload):
        return jsonify(message="Usuário inexistente ou desativado."), 401

    @jwt.unauthorized_loader
    def missing_token(reason):
        return jsonify(message="Autenticação necessária."), 401

    @jwt.invalid_token_loader
    def invalid_token(reason):
        return jsonify(message="Token inválido."), 401

    @jwt.expired_token_loader
    def expired_token(_header, _payload):
        return jsonify(message="Sessão expirada. Entre novamente."), 401


def _register_error_handlers(app: Flask) -> None:
    @app.errorhandler(HTTPException)
    def http_error(err: HTTPException):
        return jsonify(message=err.description), err.code
