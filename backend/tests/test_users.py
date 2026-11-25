NOVO = {"name": "Nova Pessoa", "email": "Nova@Teste.com", "role": "operador", "password": "segredo1"}


def test_only_admin_manages_users(client, login):
    assert client.get("/api/usuarios", headers=login("gerente")).status_code == 403
    assert client.get("/api/usuarios", headers=login("admin")).status_code == 200


def test_create_update_delete_user(client, login):
    headers = login("admin")
    resp = client.post("/api/usuarios", headers=headers, json=NOVO)
    assert resp.status_code == 201
    user = resp.json
    assert user["email"] == "nova@teste.com" and user["ativo"] is True

    assert client.post("/api/usuarios", headers=headers, json=NOVO).status_code == 409
    assert client.post("/api/usuarios", headers=headers,
                       json={**NOVO, "email": "x@teste.com", "password": "123"}).status_code == 422

    resp = client.put(f"/api/usuarios/{user['id']}", headers=headers, json={"role": "gerente", "password": "outra-senha"})
    assert resp.json["role"] == "gerente"
    login_resp = client.post("/api/auth/login", json={"email": "nova@teste.com", "password": "outra-senha"})
    assert login_resp.status_code == 200

    assert client.delete(f"/api/usuarios/{user['id']}", headers=headers).status_code == 204


def test_admin_cannot_demote_or_delete_self(client, login):
    headers = login("admin")
    me = client.get("/api/auth/me", headers=headers).json["user"]
    assert client.put(f"/api/usuarios/{me['id']}", headers=headers, json={"role": "auditor"}).status_code == 422
    assert client.delete(f"/api/usuarios/{me['id']}", headers=headers).status_code == 422
