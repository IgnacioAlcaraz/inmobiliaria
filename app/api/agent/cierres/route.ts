import { NextRequest } from 'next/server'
import { validateAgentRequest, agentSuccess, agentError } from '@/lib/agent-auth'

/**
 * POST /api/agent/cierres
 * Body: { userId, fechaDesde?, fechaHasta?, mes?, anio? }
 * Returns cierres with joined captacion.direccion
 */
export async function POST(req: NextRequest) {
  const auth = await validateAgentRequest(req)
  if (!auth.ok) return auth.response

  const { supabase, userId, body } = auth

  try {
    let query = supabase
      .from('cierres')
      .select('*, captacion:captaciones(direccion, operacion, moneda)')
      .eq('user_id', userId)
      .order('fecha', { ascending: false })
      .limit(200)

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
      const endDate = new Date(anio, mes, 0) // last day of month
      const end = `${anio}-${String(mes).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`
      query = query.gte('fecha', start).lte('fecha', end)
    } else if (anio) {
      query = query.gte('fecha', `${anio}-01-01`).lte('fecha', `${anio}-12-31`)
    }

    const { data, error } = await query

    if (error) return agentError(error.message, 500)

    // Add computed fields
    const enriched = (data || []).map((c) => {
      const honorarios_totales = c.valor_cierre * (c.porcentaje_honorarios / 100)
      const comision_agente = honorarios_totales * (c.porcentaje_agente / 100)
      return {
        ...c,
        honorarios_totales: Math.round(honorarios_totales * 100) / 100,
        comision_agente: Math.round(comision_agente * 100) / 100,
      }
    })

    return agentSuccess(enriched, enriched.length)
  } catch (err) {
    return agentError(err instanceof Error ? err.message : 'Unknown error', 500)
  }
}
