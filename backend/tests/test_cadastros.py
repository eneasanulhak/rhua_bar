from app.models import Categoria, FormaPagamento, Funcao, Setor

CADASTROS = ("categorias", "formas-pagamento", "fornecedores", "setores", "funcoes", "colaboradores")


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


# --- Cadastros de extras -------------------------------------------------------

def test_funcao_unica_por_setor(client, login, cadastro_id):
    headers = login("admin")
    bar, cozinha = cadastro_id(Setor, "BAR"), cadastro_id(Setor, "COZINHA")
    resp = client.post("/api/funcoes", headers=headers, json={"nome": "Auxiliar", "setorId": bar})
    assert resp.status_code == 201 and resp.json["setor"] == "BAR"
    # mesmo nome em outro setor pode; no mesmo setor, não
    assert client.post("/api/funcoes", headers=headers, json={"nome": "auxiliar", "setorId": cozinha}).status_code == 201
    assert client.post("/api/funcoes", headers=headers, json={"nome": "AUXILIAR", "setorId": bar}).status_code == 409
    assert client.post("/api/funcoes", headers=headers, json={"nome": "X", "setorId": 9999}).status_code == 422
    # mover para um setor onde o nome já existe também é recusado
    resp = client.put(f"/api/funcoes/{resp.json['id']}", headers=headers, json={"setorId": cozinha})
    assert resp.status_code == 409


def test_colaborador_valida_funcao_do_setor(client, login, cadastro_id):
    headers = login("admin")
    salao, bar = cadastro_id(Setor, "SALÃO"), cadastro_id(Setor, "BAR")
    lider = cadastro_id(Funcao, "LÍDER")
    resp = client.post("/api/colaboradores", headers=headers,
                       json={"nome": "Ana", "setorId": salao, "funcaoId": lider, "valorDiaria": 250})
    assert resp.status_code == 201
    assert resp.json["funcao"] == "LÍDER" and resp.json["valorDiaria"] == 250.0

    resp = client.put(f"/api/colaboradores/{resp.json['id']}", headers=headers, json={"setorId": bar})
    assert resp.status_code == 422 and "não pertence" in resp.json["message"]
    # só o nome é obrigatório
    assert client.post("/api/colaboradores", headers=headers, json={"nome": "Beto"}).status_code == 201


def test_colaborador_criado_no_lancamento(client, login, extra, cadastro_id):
    headers = login("operador")
    resp = client.post("/api/extras", headers=headers, json=extra(nome="Marlon", valorAReceber=310,
                       setorId=cadastro_id(Setor, "BAR"), funcaoId=cadastro_id(Funcao, "BAR")))
    assert resp.status_code == 201 and resp.json["nome"] == "Marlon" and resp.json["setor"] == "BAR"

    # o primeiro lançamento define os padrões do colaborador...
    colab = next(c for c in client.get("/api/colaboradores", headers=headers).json if c["nome"] == "Marlon")
    assert (colab["setor"], colab["funcao"], colab["valorDiaria"]) == ("BAR", "BAR", 310.0)

    # ...e os seguintes reaproveitam o cadastro sem alterá-lo
    resp = client.post("/api/extras", headers=headers, json=extra(nome=" MARLON ", valorAReceber=200))
    assert resp.json["colaboradorId"] == colab["id"]
    colab = next(c for c in client.get("/api/colaboradores", headers=headers).json if c["nome"] == "Marlon")
    assert colab["valorDiaria"] == 310.0


def test_extra_valida_setor_funcao_e_forma(client, login, extra, cadastro_id):
    headers = login("admin")
    resp = client.post("/api/extras", headers=headers, json=extra(funcaoId=cadastro_id(Funcao, "CUMIM")))
    assert resp.status_code == 422 and "não pertence" in resp.json["message"]

    boleto = cadastro_id(FormaPagamento, "Boleto")  # vale só para despesas
    assert client.post("/api/extras", headers=headers, json=extra(formaPagamentoId=boleto)).status_code == 422

    item = client.post("/api/extras", headers=headers, json=extra()).json
    # editar só a função precisa respeitar o setor já gravado
    resp = client.put(f"/api/extras/{item['id']}", headers=headers, json={"funcaoId": cadastro_id(Funcao, "BAR")})
    assert resp.status_code == 422


def test_cadastros_de_extras_em_uso(client, login, extra):
    headers = login("admin")
    item = client.post("/api/extras", headers=headers, json=extra()).json
    for recurso, chave in (("setores", "setorId"), ("funcoes", "funcaoId"), ("colaboradores", "colaboradorId"),
                           ("formas-pagamento", "formaPagamentoId")):
        assert client.delete(f"/api/{recurso}/{item[chave]}", headers=headers).status_code == 409, recurso
