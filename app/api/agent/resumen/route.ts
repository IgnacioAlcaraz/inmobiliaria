import { NextRequest } from 'next/server'
import { validateAgentRequest, agentSuccess, agentError } from '@/lib/agent-auth'

/**
 * POST /api/agent/resumen
 * Body: { userId, anio? }
 * Returns a consolidated dashboard summary with computed KPIs
 */
export async function POST(req: NextRequest) {
  const auth = await validateAgentRequest(req)
  if (!auth.ok) return auth.response

  const { supabase, userId, body } = auth

  try {
    const anio = (body.anio as number) || new Date().getFullYear()
    const yearStart = `${anio}-01-01`
    const yearEnd = `${anio}-12-31`

    // Fetch all data in parallel
    const [cierresRes, captacionesRes, trackeoRes, objetivosRes] = await Promise.all([
      supabase
        .from('cierres')
        .select('*, captacion:captaciones(direccion, operacion)')
        .eq('user_id', userId)
        .gte('fecha', yearStart)
        .lte('fecha', yearEnd)
        .order('fecha', { ascending: false })
        .limit(500),
      supabase
        .from('captaciones')
        .select('id, operacion, valor_publicado, moneda, fecha_cierre, fecha_baja, honorarios_totales, comision_agente_monto')
        .eq('user_id', userId)
        .limit(500),
      supabase
        .from('trackeo')
        .select('*')
        .eq('user_id', userId)
        .gte('fecha', yearStart)
        .lte('fecha', yearEnd)
        .limit(500),
      supabase
        .from('objetivos')
        .select('*')
        .eq('user_id', userId)
        .eq('anio', anio)
        .limit(1),
    ])

    const cierres = cierresRes.data || []
    const captaciones = captacionesRes.data || []
    const trackeo = trackeoRes.data || []
    const objetivo = objetivosRes.data?.[0] || null

    // Compute KPIs
    const totalCierres = cierres.length
    let totalHonorarios = 0
    let totalComisiones = 0
    let totalPuntas = 0

    for (const c of cierres) {
      const hon = c.valor_cierre * (c.porcentaje_honorarios / 100)
      const com = hon * (c.porcentaje_agente / 100)
      totalHonorarios += hon
      totalComisiones += com
      totalPuntas += c.puntas
    }

    // Captaciones stats
    const captacionesActivas = captaciones.filter((c) => !c.fecha_baja && !c.fecha_cierre).length
    const captacionesCerradas = captaciones.filter((c) => c.fecha_cierre).length
    const captacionesTotales = captaciones.length

    // Trackeo aggregates
    const trackeoTotals = trackeo.reduce(
      (acc, t) => ({
        llamadas: acc.llamadas + t.llamadas,
        visitas: acc.visitas + t.visitas,
        captaciones: acc.captaciones + t.captaciones,
        busquedas: acc.busquedas + t.busquedas,
        consultas: acc.consultas + t.consultas,
        reservas_puntas: acc.reservas_puntas + t.reservas_puntas,
        dias_registrados: acc.dias_registrados + 1,
      }),
      { llamadas: 0, visitas: 0, captaciones: 0, busquedas: 0, consultas: 0, reservas_puntas: 0, dias_registrados: 0 }
    )

    // Monthly breakdown
    const mesesData: Record<number, { honorarios: number; comisiones: number; cierres: number; puntas: number }> = {}
    for (let m = 0; m < 12; m++) mesesData[m] = { honorarios: 0, comisiones: 0, cierres: 0, puntas: 0 }

    for (const c of cierres) {
      const [, mStr] = c.fecha.split('-')
      const m = parseInt(mStr, 10) - 1
      const hon = c.valor_cierre * (c.porcentaje_honorarios / 100)
      const com = hon * (c.porcentaje_agente / 100)
      mesesData[m].honorarios += hon
      mesesData[m].comisiones += com
      mesesData[m].cierres += 1
      mesesData[m].puntas += c.puntas
    }

    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ]
    const desgloseMensual = meses.map((nombre, i) => ({
      mes: nombre,
      ...mesesData[i],
      honorarios: Math.round(mesesData[i].honorarios * 100) / 100,
      comisiones: Math.round(mesesData[i].comisiones * 100) / 100,
    }))

    const resumen = {
      anio,
      kpis: {
        totalCierres,
        totalHonorarios: Math.round(totalHonorarios * 100) / 100,
        totalComisiones: Math.round(totalComisiones * 100) / 100,
        totalPuntas,
        captacionesTotales,
        captacionesActivas,
        captacionesCerradas,
      },
      trackeo: trackeoTotals,
      objetivo,
      desgloseMensual,
    }

    return agentSuccess(resumen, 1)
  } catch (err) {
    return agentError(err instanceof Error ? err.message : 'Unknown error', 500)
  }
}
