import pytest

from app import create_app
from app.cadastros import garantir_cadastros_padrao
from app.config import TestConfig
from app.extensions import db
from app.models import Categoria, FormaPagamento, Funcao, Setor, User


@pytest.fixture
def app():
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        for role in ("admin", "gerente", "operador", "auditor"):
            user = User(name=role.title(), email=f"{role}@teste.com", role=role)
            user.set_password("senha123")
            db.session.add(user)
        garantir_cadastros_padrao()
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


@pytest.fixture
def cadastro_id(app):
    """cadastro_id(Categoria, "Impostos e Taxas") -> id do cadastro padrão."""

    def _id(model, nome: str) -> int:
        return db.session.scalar(db.select(model.id).where(model.nome == nome))

    return _id


@pytest.fixture
def despesa(cadastro_id):
    """Payload válido de despesa; campos podem ser sobrescritos: despesa(valor=10)."""

    def _payload(**overrides) -> dict:
        return {
            "descricao": "Bebidas", "fornecedorOuFavorecido": "Zé Distribuidora",
            "categoriaId": cadastro_id(Categoria, "Compras Bar e Salão"),
            "formaPagamentoId": cadastro_id(FormaPagamento, "Boleto"),
            "valor": 2421.56, "dataEmissao": "2026-08-06", "dataVencimento": "2026-08-26", "status": "Pendente",
            **overrides,
        }

    return _payload


@pytest.fixture
def extra(cadastro_id):
    """Payload válido de diária de extra; campos podem ser sobrescritos: extra(nome="Ana")."""

    def _payload(**overrides) -> dict:
        return {
            "data": "2026-08-08", "nome": "Jussara",
            "setorId": cadastro_id(Setor, "COZINHA"), "funcaoId": cadastro_id(Funcao, "COZINHA"),
            "valorAReceber": 230, "formaPagamentoId": cadastro_id(FormaPagamento, "Dinheiro"), "status": "PAGO",
            **overrides,
        }

    return _payload
