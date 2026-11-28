"""Validação simples de payloads JSON.

Cada campo é descrito por um `Field`; `parse_payload` converte os nomes
camelCase do frontend para os atributos do modelo e valida tipo/escolhas.
"""

from dataclasses import dataclass
from datetime import date
from decimal import Decimal, InvalidOperation
from typing import Any

from flask import abort


@dataclass
class Field:
    attr: str
    kind: str = "str"  # str | int | money | date | bool
    required: bool = False
    choices: tuple[str, ...] | None = None
    max_len: int | None = None


def _convert(name: str, field: Field, value: Any) -> Any:
    if value is None or value == "":
        if field.required:
            abort(422, description=f"Campo obrigatório: {name}.")
        return Decimal("0") if field.kind == "money" else None

    if field.kind == "money":
        try:
            converted = Decimal(str(value)).quantize(Decimal("0.01"))
        except InvalidOperation:
            abort(422, description=f"Valor inválido em {name}.")
        if not converted.is_finite():
            abort(422, description=f"Valor inválido em {name}.")
        return converted
    if field.kind == "date":
        try:
            return date.fromisoformat(str(value))
        except ValueError:
            abort(422, description=f"Data inválida em {name} (use AAAA-MM-DD).")
    if field.kind == "int":
        if isinstance(value, bool) or not isinstance(value, int):
            abort(422, description=f"Valor inválido em {name}.")
        return value
    if field.kind == "bool":
        if not isinstance(value, bool):
            abort(422, description=f"Valor inválido em {name}.")
        return value

    value = str(value).strip()
    if field.choices and value not in field.choices:
        abort(422, description=f"Valor inválido em {name}.")
    if field.max_len and len(value) > field.max_len:
        abort(422, description=f"{name} excede {field.max_len} caracteres.")
    return value


def parse_payload(data: Any, spec: dict[str, Field], partial: bool = False) -> dict[str, Any]:
    """Retorna {atributo_do_modelo: valor}. Com `partial`, ignora campos ausentes."""
    if not isinstance(data, dict):
        abort(400, description="Corpo JSON inválido.")
    result = {}
    for name, field in spec.items():
        if name not in data:
            if partial:
                continue
            if field.required:
                abort(422, description=f"Campo obrigatório: {name}.")
        result[field.attr] = _convert(name, field, data.get(name))
    return result


def month_bounds(mes: str | None) -> tuple[date, date] | None:
    """Converte 'AAAA-MM' em (primeiro dia, primeiro dia do mês seguinte)."""
    if not mes or mes == "all":
        return None
    try:
        year, month = (int(p) for p in mes.split("-"))
        start = date(year, month, 1)
    except ValueError:
        abort(422, description="Parâmetro mes inválido (use AAAA-MM).")
    end = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)
    return start, end
