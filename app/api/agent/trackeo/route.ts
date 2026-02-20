import { NextRequest } from 'next/server'
import { validateAgentRequest, agentSuccess, agentError } from '@/lib/agent-auth'

/**
 * POST /api/agent/trackeo
 * Body: { userId, fechaDesde?, fechaHasta?, mes?, anio? }
 * Returns daily tracking records for the user
 */
export async function POST(req: NextRequest) {
  const auth = await validateAgentRequest(req)
  if (!auth.ok) return auth.response

  const { supabase, userId, body } = auth

  try {
    let query = supabase
      .from('trackeo')
      .select('*')
      .eq('user_id', userId)
      .order('fecha', { ascending: false })
      .limit(500)

    // Filter by date range
    const fechaDesde = body.fechaDesde as string | undefined
    const fechaHasta = body.fechaHasta as string | undefined
    if (fechaDesde) query = query.gte('fecha', fechaDesde)
    if (fechaHasta) query = query.lte('fecha', fechaHasta)

    // Filter by month/year
    const mes = body.mes as number | undefined
    const anio = body.anio as number | undefined
    if (anio && mes) {
      const start = `${anio}-${String(mes).padStart(2, '0')}-01`
      const endDate = new Date(anio, mes, 0)
      const end = `${anio}-${String(mes).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`
      query = query.gte('fecha', start).lte('fecha', end)
    } else if (anio) {
      query = query.gte('fecha', `${anio}-01-01`).lte('fecha', `${anio}-12-31`)
    }

    const { data, error } = await query

    if (error) return agentError(error.message, 500)

    return agentSuccess(data || [], (data || []).length)
  } catch (err) {
    return agentError(err instanceof Error ? err.message : 'Unknown error', 500)
  }
}
