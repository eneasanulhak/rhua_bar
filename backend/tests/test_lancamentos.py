from datetime import date, timedelta

FATURAMENTO = {"data": "2026-08-01", "dinheiro": 100.5, "credito": "200.10", "pix": 0, "diferencaCaixa": -1.25}
DESPESA = {
    "descricao": "Bebidas", "fornecedorOuFavorecido": "Zé Distribuidora", "categoria": "Compras Bar e Salão",
    "formaPagamento": "Boleto", "valor": 2421.56, "dataEmissao": "2026-08-06",
    "dataVencimento": "2026-08-26", "status": "Pendente",
}
EXTRA = {
    "data": "2026-08-08", "nome": "Jussara", "setor": "COZINHA", "funcao": "COZINHA",
    "valorAReceber": 230, "formaPagamento": "Dinheiro", "status": "PAGO",
}


def test_faturamento_crud_and_month_filter(client, login):
    headers = login("operador")
    resp = client.post("/api/faturamentos", headers=headers, json=FATURAMENTO)
    assert resp.status_code == 201
    item = resp.json
    assert item["credito"] == 200.10 and item["diferencaCaixa"] == -1.25
    assert item["registradoPor"] == "Operador"

    assert len(client.get("/api/faturamentos?mes=2026-08", headers=headers).json) == 1
    assert client.get("/api/faturamentos?mes=2026-09", headers=headers).json == []

    # operador não edita nem exclui
    assert client.put(f"/api/faturamentos/{item['id']}", headers=headers, json={"pix": 5}).status_code == 403
    assert client.delete(f"/api/faturamentos/{item['id']}", headers=headers).status_code == 403

    resp = client.put(f"/api/faturamentos/{item['id']}", headers=login("gerente"), json={"pix": 5})
    assert resp.status_code == 200 and resp.json["pix"] == 5.0 and resp.json["dinheiro"] == 100.5
    assert client.delete(f"/api/faturamentos/{item['id']}", headers=login("admin")).status_code == 204


def test_auditor_is_read_only(client, login):
    headers = login("auditor")
    assert client.get("/api/despesas", headers=headers).status_code == 200
    assert client.post("/api/despesas", headers=headers, json=DESPESA).status_code == 403
    assert client.post("/api/faturamentos", headers=headers, json=FATURAMENTO).status_code == 403


def test_validation_errors(client, login):
    headers = login("admin")
    bad = {**DESPESA, "categoria": "Inexistente"}
    assert client.post("/api/despesas", headers=headers, json=bad).status_code == 422
    bad = {**DESPESA, "dataVencimento": "26/08/2026"}
    assert client.post("/api/despesas", headers=headers, json=bad).status_code == 422
    bad = {k: v for k, v in DESPESA.items() if k != "valor"}
    assert client.post("/api/despesas", headers=headers, json=bad).status_code == 422


def test_despesa_status_toggle(client, login):
    item = client.post("/api/despesas", headers=login("operador"), json=DESPESA).json
    assert item["dataPagamento"] is None

    url = f"/api/despesas/{item['id']}/status"
    assert client.patch(url, headers=login("operador"), json={"status": "Compensado"}).status_code == 403

    resp = client.patch(url, headers=login("gerente"), json={"status": "Compensado"})
    assert resp.json["status"] == "Compensado" and resp.json["dataPagamento"] == date.today().isoformat()

    resp = client.patch(url, headers=login("gerente"), json={"status": "Pendente", "dataPagamento": "2026-08-20"})
    assert resp.json["dataPagamento"] is None


def test_extras_use_despesas_permissions(client, login):
    resp = client.post("/api/extras", headers=login("operador"), json=EXTRA)
    assert resp.status_code == 201 and resp.json["valorAReceber"] == 230.0
    assert client.post("/api/extras", headers=login("auditor"), json=EXTRA).status_code == 403
    assert client.delete(f"/api/extras/{resp.json['id']}", headers=login("gerente")).status_code == 403
    assert client.delete(f"/api/extras/{resp.json['id']}", headers=login("admin")).status_code == 204


def test_notificacoes(client, login):
    headers = login("admin")
    today = date.today()
    for days, status in ((-3, "Pendente"), (0, "Pendente"), (5, "Pendente"), (20, "Pendente"), (-1, "Compensado")):
        client.post("/api/despesas", headers=headers, json={
            **DESPESA, "dataVencimento": (today + timedelta(days=days)).isoformat(), "status": status,
        })
    types = [n["type"] for n in client.get("/api/notificacoes", headers=headers).json]
    assert types == ["urgent", "warning", "info"]
