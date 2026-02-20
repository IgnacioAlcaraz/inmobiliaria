export function exportToCSV<T extends object>(
  data: T[],
  filename: string,
  columns?: { key: keyof T & string; label: string }[]
) {
  if (data.length === 0) return

  const cols = columns || Object.keys(data[0]).map((k) => ({ key: k as keyof T & string, label: k }))
  const header = cols.map((c) => c.label).join(',')
  const rows = data.map((row) =>
    cols
      .map((c) => {
        const val = (row as Record<string, unknown>)[c.key]
        if (val === null || val === undefined) return ''
        const str = String(val)
        return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str
      })
      .join(',')
  )

  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.click()
  URL.revokeObjectURL(url)
}

export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-AR').format(value)
}
