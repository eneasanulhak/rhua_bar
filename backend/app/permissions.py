from functools import wraps

from flask import abort
from flask_jwt_extended import current_user, jwt_required

ROLE_PERMISSIONS: dict[str, set[str]] = {
    "admin": {
        "view_dashboard", "view_faturamento", "add_faturamento", "edit_faturamento", "delete_faturamento",
        "view_despesas", "add_despesas", "edit_despesas", "delete_despesas", "compensar_despesas",
        "view_retiradas", "export_reports", "manage_users", "manage_cadastros",
    },
    "gerente": {
        "view_dashboard", "view_faturamento", "add_faturamento", "edit_faturamento",
        "view_despesas", "add_despesas", "edit_despesas", "compensar_despesas",
        "view_retiradas", "export_reports",
    },
    "operador": {
        "view_dashboard", "view_faturamento", "add_faturamento", "view_despesas", "add_despesas",
    },
    "auditor": {
        "view_dashboard", "view_faturamento", "view_despesas", "view_retiradas", "export_reports",
    },
}


def has_permission(role: str, permission: str) -> bool:
    return permission in ROLE_PERMISSIONS.get(role, set())


def require_permission(permission: str):
    """Exige JWT válido e que o papel do usuário logado tenha a permissão."""

    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            if not has_permission(current_user.role, permission):
                abort(403, description="Você não tem permissão para esta ação.")
            return fn(*args, **kwargs)

        return wrapper

    return decorator
