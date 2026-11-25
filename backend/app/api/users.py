from flask import Blueprint, abort, request
from flask_jwt_extended import current_user
from sqlalchemy import func, select

from ..extensions import db
from ..models import ROLES, User
from ..permissions import require_permission
from ..validation import Field, parse_payload

bp = Blueprint("usuarios", __name__)

SPEC = {
    "name": Field("name", required=True, max_len=120),
    "email": Field("email", required=True, max_len=180),
    "role": Field("role", required=True, choices=ROLES),
    "avatar": Field("avatar", max_len=500),
    "ativo": Field("ativo", kind="bool"),
}


def _get_or_404(user_id: int) -> User:
    return db.get_or_404(User, user_id, description="Usuário não encontrado.")


def _check_email_free(email: str, ignore_id: int | None = None) -> None:
    query = select(User.id).where(func.lower(User.email) == email.lower())
    if ignore_id:
        query = query.where(User.id != ignore_id)
    if db.session.scalar(query):
        abort(409, description="Já existe um usuário com este e-mail.")


def _validate_password(password) -> str:
    if not isinstance(password, str) or len(password) < 6:
        abort(422, description="A senha deve ter pelo menos 6 caracteres.")
    return password


@bp.get("")
@require_permission("manage_users")
def list_users():
    users = db.session.scalars(select(User).order_by(User.name))
    return [u.to_dict() for u in users]


@bp.post("")
@require_permission("manage_users")
def create_user():
    data = request.get_json(silent=True)
    fields = parse_payload(data, SPEC)
    fields["email"] = fields["email"].lower()
    _check_email_free(fields["email"])
    if fields.get("ativo") is None:
        fields["ativo"] = True
    user = User(**fields)
    user.set_password(_validate_password(data.get("password")))
    db.session.add(user)
    db.session.commit()
    return user.to_dict(), 201


@bp.put("/<int:user_id>")
@require_permission("manage_users")
def update_user(user_id: int):
    user = _get_or_404(user_id)
    data = request.get_json(silent=True)
    fields = parse_payload(data, SPEC, partial=True)
    if "email" in fields:
        fields["email"] = fields["email"].lower()
        _check_email_free(fields["email"], ignore_id=user.id)
    if user.id == current_user.id and (fields.get("role", "admin") != "admin" or fields.get("ativo") is False):
        abort(422, description="Você não pode rebaixar ou desativar o próprio usuário.")
    for attr, value in fields.items():
        if attr == "ativo" and value is None:
            continue
        setattr(user, attr, value)
    if data.get("password"):
        user.set_password(_validate_password(data["password"]))
    db.session.commit()
    return user.to_dict()


@bp.delete("/<int:user_id>")
@require_permission("manage_users")
def delete_user(user_id: int):
    user = _get_or_404(user_id)
    if user.id == current_user.id:
        abort(422, description="Você não pode excluir o próprio usuário.")
    db.session.delete(user)
    db.session.commit()
    return "", 204
