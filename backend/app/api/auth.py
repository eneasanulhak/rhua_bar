from flask import Blueprint, abort, request
from flask_jwt_extended import create_access_token, current_user, jwt_required
from sqlalchemy import func, select

from ..extensions import db
from ..models import User
from ..permissions import ROLE_PERMISSIONS

bp = Blueprint("auth", __name__)


def _session_payload(user: User) -> dict:
    return {"user": user.to_dict(), "permissions": sorted(ROLE_PERMISSIONS.get(user.role, ()))}


@bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))
    if not email or not password:
        abort(422, description="Informe e-mail e senha.")

    user = db.session.scalar(select(User).where(func.lower(User.email) == email))
    if not user or not user.check_password(password):
        abort(401, description="E-mail ou senha incorretos.")
    if not user.ativo:
        abort(403, description="Usuário desativado.")

    return {"accessToken": create_access_token(identity=user), **_session_payload(user)}


@bp.get("/me")
@jwt_required()
def me():
    return _session_payload(current_user)


@bp.put("/me/password")
@jwt_required()
def change_password():
    data = request.get_json(silent=True) or {}
    if not current_user.check_password(str(data.get("currentPassword", ""))):
        abort(422, description="Senha atual incorreta.")
    new_password = str(data.get("newPassword", ""))
    if len(new_password) < 6:
        abort(422, description="A nova senha deve ter pelo menos 6 caracteres.")
    current_user.set_password(new_password)
    db.session.commit()
    return {"message": "Senha alterada."}
