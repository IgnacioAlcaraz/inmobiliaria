import { NextRequest } from 'next/server'
import { validateManagerRequest, managerSuccess, managerError } from '@/lib/manager-auth'
import { validEnum, validLimit } from '@/lib/agent-validate'

/**
 * POST /api/agent/manager/contactos
 * Body: { managerId, vendedorId?, estado?, tipo_cliente?, prioridad?, pendientes?, vencidos?, limit? }
 * Returns contactos for vendedores assigned to the manager
 */
export async function POST(req: NextRequest) {
  const auth = await validateManagerRequest(req)
  if (!auth.ok) return auth.response

  const { supabase, vendedorIds, body } = auth

  try {
    const lim = validLimit(body.limit, 100, 200)
    const estado = validEnum(body.estado, ['Nuevo', 'Contactado', 'En reunion', 'Negociacion', 'Cerrado', 'Perdido'] as const)
    const tipo_cliente = validEnum(body.tipo_cliente, ['Comprador', 'Vendedor', 'Inversor', 'Alquiler', 'Tasacion', 'Permuta'] as const)
    const prioridad = validEnum(body.prioridad, ['Baja', 'Media', 'Alta'] as const)

    let query = supabase
      .from('contactos')
      .select('id, nombre, apellido, telefono, email, estado, tipo_cliente, forma_pago, motivacion, notas, seguimiento_fecha, seguimiento_prioridad, seguimiento_hecho, created_at, user_id')
      .in('user_id', vendedorIds)
      .order('seguimiento_fecha', { ascending: true, nullsFirst: false })
      .limit(lim)

    if (estado) query = query.eq('estado', estado)
    if (tipo_cliente) query = query.eq('tipo_cliente', tipo_cliente)
    if (prioridad) query = query.eq('seguimiento_prioridad', prioridad)
    if (body.pendientes === true) query = query.eq('seguimiento_hecho', false)

    if (body.vencidos === true) {
      const hoy = new Date().toISOString().split('T')[0]
      query = query.eq('seguimiento_hecho', false).lte('seguimiento_fecha', hoy)
    }

    const { data, error } = await query
    if (error) return managerError('Error al obtener contactos', 500)

    return managerSuccess(data || [], (data || []).length)
  } catch (err) {
    return managerError(err instanceof Error ? err.message : 'Unknown error', 500)
  }
}
