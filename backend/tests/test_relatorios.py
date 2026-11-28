from app.models import Categoria

MES = "2026-08"


def _lancar(client, headers, despesa, extra):
    """Agosto: faturamento 1.000; despesas 300 (100 pagas); extras 150 (50 pagos); retirada 200 (paga)."""
    client.post("/api/faturamentos", headers=headers, json={"data": "2026-08-01", "dinheiro": 600, "pix": 400.1,
                                                            "diferencaCaixa": -2})
    client.post("/api/faturamentos", headers=headers, json={"data": "2026-08-02", "credito": -0.1})
    pago = {"status": "Compensado", "dataPagamento": "2026-08-10"}
    client.post("/api/despesas", headers=headers, json=despesa(valor=100, **pago))
    client.post("/api/despesas", headers=headers, json=despesa(valor=200))
    client.post("/api/extras", headers=headers, json=extra(valorAReceber=50))
    client.post("/api/extras", headers=headers, json=extra(valorAReceber=100, status="PENDENTE"))
    # fora do período: não entra
    client.post("/api/despesas", headers=headers, json=despesa(valor=999, dataVencimento="2026-09-01"))
    client.post("/api/extras", headers=headers, json=extra(valorAReceber=999, data="2026-07-31"))


def test_dre_do_mes(client, login, despesa, extra, cadastro_id):
    headers = login("admin")
    _lancar(client, headers, despesa, extra)
    retirada = cadastro_id(Categoria, "Retirada de Sócios")
    client.post("/api/despesas", headers=headers, json=despesa(valor=200, categoriaId=retirada,
                                                                status="Compensado"))

    dre = client.get(f"/api/relatorios/dre?mes={MES}", headers=headers).json
    assert dre["faturamento"]["total"] == 1000
    assert dre["faturamento"]["porMeio"]["pix"] == 400.1 and dre["faturamento"]["diferencaCaixa"] == -2
    assert dre["despesas"]["total"] == 300 and dre["despesas"]["pago"] == 100
    assert dre["despesas"]["categorias"] == [{"categoria": "Compras Bar e Salão", "total": 300, "pago": 100}]
    assert dre["extras"] == {"total": 150, "pago": 50}
    assert dre["resultadoOperacional"] == 1000 - 300 - 150
    assert dre["retiradas"]["categorias"][0]["categoria"] == "Retirada de Sócios"
    assert dre["resultadoFinal"] == 550 - 200
    assert dre["saldoCaixa"] == 1000 - 100 - 50 - 200
    assert dre["aPagar"] == 200 + 100

    # sem filtro de mês, entra tudo
    todos = client.get("/api/relatorios/dre", headers=headers).json
    assert todos["despesas"]["total"] == 300 + 999 and todos["extras"]["total"] == 150 + 999


def test_dre_sem_permissao_de_retiradas(client, login, despesa, extra, cadastro_id):
    admin = login("admin")
    _lancar(client, admin, despesa, extra)
    client.post("/api/despesas", headers=admin, json=despesa(
        valor=200, categoriaId=cadastro_id(Categoria, "Adiantamentos"), status="Compensado"))

    # operador vê o resultado operacional e o caixa da operação, mas não as retiradas
    dre = client.get(f"/api/relatorios/dre?mes={MES}", headers=login("operador")).json
    assert dre["retiradas"] is None and dre["resultadoFinal"] is None
    assert dre["resultadoOperacional"] == 550 and dre["saldoCaixa"] == 1000 - 100 - 50


def test_categoria_fora_do_resultado_e_editavel(client, login, cadastro_id):
    headers = login("admin")
    cats = {c["nome"]: c for c in client.get("/api/categorias", headers=headers).json}
    assert cats["Adiantamentos"]["foraDoResultado"] is True
    assert cats["Impostos e Taxas"]["foraDoResultado"] is False
    resp = client.put(f"/api/categorias/{cats['Impostos e Taxas']['id']}", headers=headers,
                      json={"foraDoResultado": True})
    assert resp.json["foraDoResultado"] is True
