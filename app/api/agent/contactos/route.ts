import { NextRequest } from 'next/server'
import { validateAgentRequest, agentSuccess, agentError } from '@/lib/agent-auth'
import { validEnum, validLimit } from '@/lib/agent-validate'

/**
 * POST /api/agent/contactos
 * Body: { userId, estado?, tipo_cliente?, prioridad?, pendientes?, vencidos?, limit? }
 * Returns contactos for the user, with follow-up filtering
 */
export async function POST(req: NextRequest) {
  const auth = await validateAgentRequest(req)
  if (!auth.ok) return auth.response

  const { supabase, userId, body } = auth

  try {
    const lim = validLimit(body.limit, 100, 200)
    const estado = validEnum(body.estado, ['Nuevo', 'Contactado', 'En reunion', 'Negociacion', 'Cerrado', 'Perdido'] as const)
    const tipo_cliente = validEnum(body.tipo_cliente, ['Comprador', 'Vendedor', 'Inversor', 'Alquiler', 'Tasacion', 'Permuta'] as const)
    const prioridad = validEnum(body.prioridad, ['Baja', 'Media', 'Alta'] as const)
    const clasificacion = validEnum(body.clasificacion, ['A+','A','B','C','D'] as const)
    const instancia = validEnum(body.instancia, ['contacto','llamado','prelisting','reunion','venta'] as const)

    let query = supabase
      .from('contactos')
      .select('id, nombre, apellido, telefono, email, estado, clasificacion, instancia, tipo_cliente, forma_pago, motivacion, notas, seguimiento_fecha, seguimiento_prioridad, seguimiento_hecho, created_at, updated_at')
      .eq('user_id', userId)
      .order('seguimiento_fecha', { ascending: true, nullsFirst: false })
      .limit(lim)

    if (estado) query = query.eq('estado', estado)
    if (tipo_cliente) query = query.eq('tipo_cliente', tipo_cliente)
    if (prioridad) query = query.eq('seguimiento_prioridad', prioridad)
    if (clasificacion) query = query.eq('clasificacion', clasificacion)
    if (instancia) query = query.eq('instancia', instancia)

    if (body.pendientes === true) query = query.eq('seguimiento_hecho', false)

    if (body.vencidos === true) {
      const hoy = new Date().toISOString().split('T')[0]
      query = query.eq('seguimiento_hecho', false).lte('seguimiento_fecha', hoy)
    }

    const { data, error } = await query

    if (error) return agentError('Error al obtener contactos', 500)

    return agentSuccess(data || [], (data || []).length)
  } catch (err) {
    console.error('contactos route error', err)
    return agentError('Error interno', 500)
  }
}
