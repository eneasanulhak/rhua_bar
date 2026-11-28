from app.models import Categoria, FormaPagamento

CADASTROS = ("categorias", "formas-pagamento", "fornecedores")


def test_listar_liberado_para_quem_ve_despesas(client, login):
    for recurso in CADASTROS:
        assert client.get(f"/api/{recurso}", headers=login("auditor")).status_code == 200
    nomes = [c["nome"] for c in client.get("/api/categorias", headers=login("operador")).json]
    assert "Impostos e Taxas" in nomes


def test_so_admin_altera_cadastros(client, login):
    for role in ("gerente", "operador", "auditor"):
        headers = login(role)
        for recurso in CADASTROS:
            assert client.post(f"/api/{recurso}", headers=headers, json={"nome": "X"}).status_code == 403
            assert client.put(f"/api/{recurso}/1", headers=headers, json={"nome": "X"}).status_code == 403
            assert client.delete(f"/api/{recurso}/1", headers=headers).status_code == 403


def test_crud_e_nome_unico(client, login):
    headers = login("admin")
    resp = client.post("/api/formas-pagamento", headers=headers, json={"nome": " Vale Refeição ", "usaExtras": True})
    assert resp.status_code == 201
    forma = resp.json
    assert forma == {**forma, "nome": "Vale Refeição", "usaDespesas": True, "usaExtras": True, "ativo": True}

    # nome repetido, ignorando maiúsculas, é recusado ao criar e ao renomear
    assert client.post("/api/formas-pagamento", headers=headers, json={"nome": "vale refeição"}).status_code == 409
    assert client.put(f"/api/formas-pagamento/{forma['id']}", headers=headers, json={"nome": "PIX"}).status_code == 409

    resp = client.put(f"/api/formas-pagamento/{forma['id']}", headers=headers, json={"ativo": False, "usaExtras": None})
    assert resp.json["ativo"] is False and resp.json["usaExtras"] is True
    assert client.delete(f"/api/formas-pagamento/{forma['id']}", headers=headers).status_code == 204


def test_cadastro_em_uso_so_inativa(client, login, despesa):
    headers = login("admin")
    item = client.post("/api/despesas", headers=headers, json=despesa()).json
    for recurso, chave in (("categorias", "categoriaId"), ("formas-pagamento", "formaPagamentoId"),
                           ("fornecedores", "fornecedorId")):
        resp = client.delete(f"/api/{recurso}/{item[chave]}", headers=headers)
        assert resp.status_code == 409 and "Inative" in resp.json["message"]


def test_fornecedor_criado_no_lancamento(client, login, despesa):
    headers = login("operador")
    primeira = client.post("/api/despesas", headers=headers, json=despesa(fornecedorOuFavorecido="Nova Distribuidora"))
    assert primeira.status_code == 201
    # mesmo nome com outra grafia reaproveita o cadastro
    segunda = client.post("/api/despesas", headers=headers, json=despesa(fornecedorOuFavorecido=" nova distribuidora "))
    assert segunda.json["fornecedorId"] == primeira.json["fornecedorId"]
    assert segunda.json["fornecedorOuFavorecido"] == "Nova Distribuidora"

    nomes = [f["nome"] for f in client.get("/api/fornecedores", headers=headers).json]
    assert nomes.count("Nova Distribuidora") == 1


def test_cadastro_inativo_ou_de_outro_uso(client, login, despesa, cadastro_id):
    admin = login("admin")
    impostos = cadastro_id(Categoria, "Impostos e Taxas")
    item = client.post("/api/despesas", headers=admin, json=despesa(categoriaId=impostos)).json
    client.put(f"/api/categorias/{impostos}", headers=admin, json={"ativo": False})

    # novo lançamento não aceita a categoria inativa...
    resp = client.post("/api/despesas", headers=admin, json=despesa(categoriaId=impostos))
    assert resp.status_code == 422 and "Impostos e Taxas" in resp.json["message"]
    # ...mas a despesa antiga continua editável sem trocar a categoria
    resp = client.put(f"/api/despesas/{item['id']}", headers=admin, json=despesa(categoriaId=impostos, valor=10))
    assert resp.status_code == 200 and resp.json["categoria"] == "Impostos e Taxas"

    # renomear o cadastro reflete nos lançamentos
    client.put(f"/api/categorias/{impostos}", headers=admin, json={"nome": "Impostos"})
    assert client.get(f"/api/despesas", headers=admin).json[0]["categoria"] == "Impostos"

    # forma que não vale para despesas é recusada
    pix = cadastro_id(FormaPagamento, "Pix")
    client.put(f"/api/formas-pagamento/{pix}", headers=admin, json={"usaDespesas": False})
    assert client.post("/api/despesas", headers=admin, json=despesa(formaPagamentoId=pix)).status_code == 422
