const brlFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function brl(value: number) {
  return brlFormatter.format(value)
}

/** 'AAAA-MM-DD' -> 'DD/MM/AAAA' */
export function dateBR(value: string | null | undefined) {
  return value ? value.split('-').reverse().join('/') : '-'
}

export function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
