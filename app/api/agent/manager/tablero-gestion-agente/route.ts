import { NextRequest } from 'next/server'
import { validateManagerRequest, managerSuccess, managerError } from '@/lib/manager-auth'

/**
 * POST /api/agent/manager/tablero-gestion-agente
 * Body: { managerId, vendedorId, anio? }
 * Returns monthly summary for a single agente (trackeo + captaciones + cierres)
 */
export async function POST(req: NextRequest) {
  const auth = await validateManagerRequest(req)
  if (!auth.ok) return auth.response

  const { supabase, vendedorIds, body } = auth
  const vendedorId = body.vendedorId ? String(body.vendedorId) : null
  if (!vendedorId) return managerError('vendedorId is required', 400)
  if (!vendedorIds.includes(vendedorId)) return managerError('Vendedor not assigned', 403)

  const anio = body.anio ? Number(body.anio) : new Date().getFullYear()

  try {
    // trackeo_diario for vendedor
    const { data: trackeo, error: tErr } = await supabase
      .from('trackeo_diario')
      .select('*')
      .eq('user_id', vendedorId)
      .gte('fecha', `${anio}-01-01`)
      .lte('fecha', `${anio}-12-31`)

    if (tErr) return managerError('Error trackeo: ' + tErr.message, 500)

    // captaciones count and value grouped by month from captaciones_busquedas
    const { data: caps, error: cErr } = await supabase
      .from('captaciones_busquedas')
      .select('fecha_alta, valor_publicado')
      .eq('user_id', vendedorId)
      .gte('fecha_alta', `${anio}-01-01`)
      .lte('fecha_alta', `${anio}-12-31`)

    if (cErr) return managerError('Error captaciones: ' + cErr.message, 500)

    // cierres for vendedor
    const { data: cierres, error: crErr } = await supabase
      .from('cierres')
      .select('fecha, valor_cierre, honorarios_totales')
      .eq('user_id', vendedorId)
      .gte('fecha', `${anio}-01-01`)
      .lte('fecha', `${anio}-12-31`)

    if (crErr) return managerError('Error cierres: ' + crErr.message, 500)

    // assemble monthly summary
    const months = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, llamadas: 0, captaciones: 0, captaciones_valor: 0, reservas_puntas: 0, reservas_valor_oferta: 0, cierres_puntas: 0, cierres_honorarios: 0 }))

    for (const r of trackeo || []) {
      const m = new Date(r.fecha).getMonth()
      months[m].llamadas += Number(r.llamadas || 0)
      months[m].captaciones += Number(r.captaciones || 0)
      months[m].captaciones_valor += Number(r.captaciones_valor || 0)
      months[m].reservas_puntas += Number(r.reservas_puntas || 0)
      months[m].reservas_valor_oferta += Number(r.reservas_valor_oferta || 0)
      months[m].cierres_puntas += Number(r.cierres_operaciones_puntas || 0)
      months[m].cierres_honorarios += Number(r.cierres_honorarios || 0)
    }

    for (const c of caps || []) {
      const m = new Date(c.fecha_alta).getMonth()
      months[m].captaciones += 1
      months[m].captaciones_valor += Number(c.valor_publicado || 0)
    }

    for (const c of cierres || []) {
      const m = new Date(c.fecha).getMonth()
      months[m].cierres_puntas += 1
      months[m].cierres_honorarios += Number(c.honorarios_totales || c.valor_cierre || 0)
    }

    return managerSuccess({ vendedorId, anio, months }, months.length)
  } catch (err) {
    console.error('tablero-gestion-agente error', err)
    return managerError('Error interno', 500)
  }
}
