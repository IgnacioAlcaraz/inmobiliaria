import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parse a YYYY-MM-DD date string into year, month (0-based), and day
 * without timezone offset issues. This avoids the problem where
 * `new Date("2026-01-01")` becomes Dec 31, 2025 in UTC-3 timezones.
 */
export function parseDateStr(dateStr: string): { year: number; month: number; day: number } {
  const [y, m, d] = dateStr.split('T')[0].split('-').map(Number)
  return { year: y, month: m - 1, day: d }
}

/** Create a local Date from a YYYY-MM-DD string without timezone shift */
export function localDate(dateStr: string): Date {
  const { year, month, day } = parseDateStr(dateStr)
  return new Date(year, month, day)
}

/** Format a YYYY-MM-DD string to a localized display string */
export function formatDateDisplay(dateStr: string, opts?: Intl.DateTimeFormatOptions): string {
  const d = localDate(dateStr)
  return d.toLocaleDateString('es-AR', opts ?? { day: '2-digit', month: '2-digit', year: 'numeric' })
}
