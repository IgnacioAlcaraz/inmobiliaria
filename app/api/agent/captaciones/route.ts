import { NextRequest } from 'next/server'
import { validateAgentRequest, agentSuccess, agentError } from '@/lib/agent-auth'

/**
 * POST /api/agent/captaciones
 * Body: { userId, operacion?, conCierre?, sinCierre?, limit? }
 * Returns captaciones for the user
 */
export async function POST(req: NextRequest) {
  const auth = await validateAgentRequest(req)
  if (!auth.ok) return auth.response

  const { supabase, userId, body } = auth

  try {
    const lim = Math.min(Number(body.limit) || 200, 500)

    let query = supabase
      .from('captaciones')
      .select('*')
      .eq('user_id', userId)
      .order('fecha_alta', { ascending: false })
      .limit(lim)

    // Filter by operacion type
    const operacion = body.operacion as string | undefined
    if (operacion && ['Venta', 'Alquiler', 'Temporario'].includes(operacion)) {
      query = query.eq('operacion', operacion)
    }

    // Filter by whether it has a cierre date or not
    if (body.conCierre === true) {
      query = query.not('fecha_cierre', 'is', null)
    }
    if (body.sinCierre === true) {
      query = query.is('fecha_cierre', null)
    }

    const { data, error } = await query

    if (error) return agentError(error.message, 500)

    return agentSuccess(data || [], (data || []).length)
  } catch (err) {
    return agentError(err instanceof Error ? err.message : 'Unknown error', 500)
  }
}
