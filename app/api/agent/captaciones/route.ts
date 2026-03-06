import { NextRequest } from 'next/server'
import { validateAgentRequest, agentSuccess, agentError } from '@/lib/agent-auth'
import { validEnum, validLimit, validDias } from '@/lib/agent-validate'

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
    const lim = validLimit(body.limit, 200, 500)
    const operacion = validEnum(body.operacion, ['Venta', 'Alquiler', 'Temporario'] as const)
    const dias = validDias(body.diasHastaVencimiento)

    let query = supabase
      .from('captaciones')
      .select('*')
      .eq('user_id', userId)
      .order('fecha_alta', { ascending: false })
      .limit(lim)

    if (operacion) query = query.eq('operacion', operacion)
    if (body.conCierre === true) query = query.not('fecha_cierre', 'is', null)
    if (body.sinCierre === true) query = query.is('fecha_cierre', null)

    if (dias) {
      const hasta = new Date()
      hasta.setDate(hasta.getDate() + dias)
      query = query.not('vence', 'is', null).lte('vence', hasta.toISOString().split('T')[0])
    }

    const { data, error } = await query

    if (error) return agentError('Error al obtener captaciones', 500)

    return agentSuccess(data || [], (data || []).length)
  } catch {
    return agentError('Error interno', 500)
  }
}
