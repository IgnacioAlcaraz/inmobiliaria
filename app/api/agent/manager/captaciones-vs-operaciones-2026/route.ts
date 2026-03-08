import { NextRequest } from 'next/server'
import { validateManagerRequest, managerSuccess, managerError } from '@/lib/manager-auth'

/**
 * POST /api/agent/manager/captaciones-vs-operaciones-2026
 * Body: { managerId, anio? }
 * Returns captaciones and operaciones cerradas for the given year across vendedores
 */
export async function POST(req: NextRequest) {
  const auth = await validateManagerRequest(req)
  if (!auth.ok) return auth.response

  const { supabase, vendedorIds, body } = auth
  const anio = body.anio ? Number(body.anio) : 2026

  try {
    // captaciones in year
    const { data: caps, error: cErr } = await supabase
      .from('captaciones_busquedas')
      .select('id, fecha_alta, direccion, barrio, ciudad, operacion, valor_publicado, moneda, fecha_reserva, fecha_cierre, honorarios_totales')
      .in('user_id', vendedorIds)
      .gte('fecha_alta', `${anio}-01-01`)
      .lte('fecha_alta', `${anio}-12-31`)

    if (cErr) return managerError('Error captaciones: ' + cErr.message, 500)

    // cierres in year
    const { data: cierres, error: crErr } = await supabase
      .from('cierres')
      .select('id, fecha, id_direccion, valor_cierre, honorarios_totales, comision_agente')
      .in('user_id', vendedorIds)
      .gte('fecha', `${anio}-01-01`)
      .lte('fecha', `${anio}-12-31`)

    if (crErr) return managerError('Error cierres: ' + crErr.message, 500)

    return managerSuccess({ captaciones: caps || [], cierres: cierres || [] }, (caps || []).length + (cierres || []).length)
  } catch (err) {
    console.error('captaciones-vs-operaciones-2026 error', err)
    return managerError('Error interno', 500)
  }
}
