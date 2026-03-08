import { NextRequest } from 'next/server'
import { validateManagerRequest, managerSuccess, managerError } from '@/lib/manager-auth'

/**
 * POST /api/agent/manager/trackeo-reservas-vs-cierres
 * Body: { managerId, anio? }
 * Returns aggregated monthly reservas, captaciones, cierres for manager's team
 */
export async function POST(req: NextRequest) {
  const auth = await validateManagerRequest(req)
  if (!auth.ok) return auth.response

  const { supabase, vendedorIds, body } = auth
  const anio = body.anio ? Number(body.anio) : new Date().getFullYear()

  try {
    // Aggregate trackeo_diario by month for the vendedores
    const q = supabase
      .from('trackeo_diario')
      .select('fecha, llamadas, captaciones, captaciones_valor, reservas_puntas, reservas_valor_oferta, cierres_operaciones_puntas, cierres_honorarios')
      .in('user_id', vendedorIds)
      .gte('fecha', `${anio}-01-01`)
      .lte('fecha', `${anio}-12-31`)

    const { data, error } = await q
    if (error) return managerError('Error al consultar trackeo: ' + error.message, 500)

    // reduce by month
    const months: Record<string, any> = {}
    for (const r of data || []) {
      const m = new Date(r.fecha).getMonth() + 1
      const key = String(m)
      if (!months[key]) months[key] = { llamadas: 0, captaciones: 0, captaciones_valor: 0, reservas_puntas: 0, reservas_valor_oferta: 0, cierres_operaciones_puntas: 0, cierres_honorarios: 0 }
      months[key].llamadas += Number(r.llamadas || 0)
      months[key].captaciones += Number(r.captaciones || 0)
      months[key].captaciones_valor += Number(r.captaciones_valor || 0)
      months[key].reservas_puntas += Number(r.reservas_puntas || 0)
      months[key].reservas_valor_oferta += Number(r.reservas_valor_oferta || 0)
      months[key].cierres_operaciones_puntas += Number(r.cierres_operaciones_puntas || 0)
      months[key].cierres_honorarios += Number(r.cierres_honorarios || 0)
    }

    // prepare arrays for 1..12
    const reservas_by_month = [] as any[]
    const cierres_by_month = [] as any[]
    const captaciones_by_month = [] as any[]
    for (let i = 1; i <= 12; i++) {
      const k = String(i)
      const v = months[k] || { llamadas: 0, captaciones: 0, captaciones_valor: 0, reservas_puntas: 0, reservas_valor_oferta: 0, cierres_operaciones_puntas: 0, cierres_honorarios: 0 }
      reservas_by_month.push({ month: i, reservas_puntas: v.reservas_puntas, reservas_valor_oferta: v.reservas_valor_oferta })
      cierres_by_month.push({ month: i, cierres_puntas: v.cierres_operaciones_puntas, cierres_honorarios: v.cierres_honorarios })
      captaciones_by_month.push({ month: i, captaciones: v.captaciones, captaciones_valor: v.captaciones_valor })
    }

    return managerSuccess({ reservas_by_month, cierres_by_month, captaciones_by_month }, 3)
  } catch (err) {
    console.error('trackeo-reservas-vs-cierres error', err)
    return managerError('Error interno', 500)
  }
}
