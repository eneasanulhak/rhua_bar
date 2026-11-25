def test_login_ok_returns_token_and_permissions(client):
    resp = client.post("/api/auth/login", json={"email": "ADMIN@teste.com", "password": "senha123"})
    assert resp.status_code == 200
    assert resp.json["user"]["role"] == "admin"
    assert "manage_users" in resp.json["permissions"]
    assert "password_hash" not in resp.json["user"]


def test_login_wrong_password(client):
    resp = client.post("/api/auth/login", json={"email": "admin@teste.com", "password": "errada"})
    assert resp.status_code == 401


def test_me_requires_token(client):
    assert client.get("/api/auth/me").status_code == 401


def test_me(client, login):
    resp = client.get("/api/auth/me", headers=login("auditor"))
    assert resp.status_code == 200
    assert resp.json["user"]["email"] == "auditor@teste.com"


def test_change_password(client, login):
    headers = login("operador")
    resp = client.put("/api/auth/me/password", headers=headers,
                      json={"currentPassword": "senha123", "newPassword": "nova-senha"})
    assert resp.status_code == 200
    resp = client.post("/api/auth/login", json={"email": "operador@teste.com", "password": "nova-senha"})
    assert resp.status_code == 200


def test_inactive_user_token_rejected(client, login):
    admin, operador = login("admin"), login("operador")
    users = client.get("/api/usuarios", headers=admin).json
    op_id = next(u["id"] for u in users if u["role"] == "operador")
    client.put(f"/api/usuarios/{op_id}", headers=admin, json={"ativo": False})
    assert client.get("/api/auth/me", headers=operador).status_code == 401
