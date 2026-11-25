import pytest

from app import create_app
from app.config import TestConfig
from app.extensions import db
from app.models import User


@pytest.fixture
def app():
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        for role in ("admin", "gerente", "operador", "auditor"):
            user = User(name=role.title(), email=f"{role}@teste.com", role=role)
            user.set_password("senha123")
            db.session.add(user)
        db.session.commit()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def login(client):
    """login("gerente") -> headers com o token do usuário daquele papel."""

    def _login(role: str) -> dict:
        resp = client.post("/api/auth/login", json={"email": f"{role}@teste.com", "password": "senha123"})
        assert resp.status_code == 200, resp.json
        return {"Authorization": f"Bearer {resp.json['accessToken']}"}

    return _login
