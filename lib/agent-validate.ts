/**
 * Input validation helpers for /api/agent/* routes.
 * All inputs come from the LangGraph agent via tool calls — these guards
 * protect against prompt-injection attacks that could manipulate tool parameters.
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** Validates YYYY-MM-DD format and returns the string or undefined */
export function validDate(val: unknown): string | undefined {
  if (typeof val !== 'string') return undefined
  if (!DATE_RE.test(val)) return undefined
  const d = new Date(val)
  return isNaN(d.getTime()) ? undefined : val
}

/** Validates year in realistic range */
export function validAnio(val: unknown): number | undefined {
  const n = Number(val)
  if (!Number.isInteger(n) || n < 2000 || n > 2100) return undefined
  return n
}

/** Validates month 1-12 */
export function validMes(val: unknown): number | undefined {
  const n = Number(val)
  if (!Number.isInteger(n) || n < 1 || n > 12) return undefined
  return n
}

/** Validates a value against an allowed enum list */
export function validEnum<T extends string>(val: unknown, allowed: readonly T[]): T | undefined {
  if (typeof val !== 'string') return undefined
  return (allowed as readonly string[]).includes(val) ? (val as T) : undefined
}

/** Validates a positive integer limit with a cap */
export function validLimit(val: unknown, defaultVal: number, max: number): number {
  const n = Number(val)
  if (!Number.isFinite(n) || n <= 0) return defaultVal
  return Math.min(Math.floor(n), max)
}

/** Validates days as positive integer with cap */
export function validDias(val: unknown, max = 365): number | undefined {
  const n = Number(val)
  if (!Number.isFinite(n) || n <= 0 || n > max) return undefined
  return Math.floor(n)
}
