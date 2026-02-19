import { NextRequest } from 'next/server'
import { validateManagerRequest, managerSuccess, managerError } from '@/lib/manager-auth'

export async function POST(req: NextRequest) {
  const auth = await validateManagerRequest(req)
  if (!auth.ok) return auth.response

  const { supabase, vendedorIds, body } = auth

  const anio = (body.anio as number) || new Date().getFullYear()
  const startOfYear = `${anio}-01-01`
  const endOfYear = `${anio}-12-31`

  // Fetch all data in parallel
  const [profilesRes, cierresRes, captacionesRes, trackeoRes, objetivosRes] = await Promise.all([
    supabase.from('profiles').select('id, full_name').in('id', vendedorIds),
    supabase.from('cierres').select('*').in('user_id', vendedorIds).gte('fecha', startOfYear).lte('fecha', endOfYear),
    supabase.from('captaciones').select('*').in('user_id', vendedorIds),
    supabase.from('trackeo').select('*').in('user_id', vendedorIds).gte('fecha', startOfYear).lte('fecha', endOfYear),
    supabase.from('objetivos').select('*').in('user_id', vendedorIds).eq('anio', anio),
  ])

  if (cierresRes.error || captacionesRes.error || trackeoRes.error) {
    return managerError('Error fetching data', 500)
  }

  const profiles = profilesRes.data || []
  const cierres = cierresRes.data || []
  const captaciones = captacionesRes.data || []
  const trackeo = trackeoRes.data || []
  const objetivos = objetivosRes.data || []

  // Per-vendedor breakdown
  const vendedorBreakdown = profiles.map((p) => {
    const vc = cierres.filter((c) => c.user_id === p.id)
    const vcap = captaciones.filter((c) => c.user_id === p.id)
    const vt = trackeo.filter((t) => t.user_id === p.id)
    const obj = objetivos.find((o) => o.user_id === p.id)

    const hon = vc.reduce((s, c) => s + (Number(c.valor_cierre) * Number(c.porcentaje_honorarios)) / 100, 0)
    const com = vc.reduce((s, c) => {
      const h = (Number(c.valor_cierre) * Number(c.porcentaje_honorarios)) / 100
      return s + (h * Number(c.porcentaje_agente)) / 100
    }, 0)
    const puntas = vc.reduce((s, c) => s + c.puntas, 0)

    return {
      userId: p.id,
      nombre: p.full_name,
      cierres: vc.length,
      honorarios: Math.round(hon * 100) / 100,
      comisiones: Math.round(com * 100) / 100,
      puntas,
      captaciones_en_cartera: vcap.length,
      llamadas: vt.reduce((s, t) => s + t.llamadas, 0),
      visitas: vt.reduce((s, t) => s + t.visitas, 0),
      captaciones_trackeo: vt.reduce((s, t) => s + t.captaciones, 0),
      dias_trackeados: vt.length,
      objetivo_facturacion: obj?.objetivo_facturacion_total || null,
      objetivo_puntas: obj?.objetivo_puntas || null,
      pct_facturacion: obj?.objetivo_facturacion_total
        ? Math.round((hon / obj.objetivo_facturacion_total) * 10000) / 100
        : null,
      pct_puntas: obj?.objetivo_puntas
        ? Math.round((puntas / obj.objetivo_puntas) * 10000) / 100
        : null,
    }
  })

  // Team totals
  const totalHon = vendedorBreakdown.reduce((s, v) => s + v.honorarios, 0)
  const totalCom = vendedorBreakdown.reduce((s, v) => s + v.comisiones, 0)
  const totalPuntas = vendedorBreakdown.reduce((s, v) => s + v.puntas, 0)

  return managerSuccess(
    {
      anio,
      equipo: {
        vendedores: vendedorBreakdown.length,
        total_cierres: cierres.length,
        total_honorarios: Math.round(totalHon * 100) / 100,
        total_comisiones: Math.round(totalCom * 100) / 100,
        total_puntas: totalPuntas,
        total_captaciones_cartera: captaciones.length,
        total_llamadas: trackeo.reduce((s, t) => s + t.llamadas, 0),
        total_visitas: trackeo.reduce((s, t) => s + t.visitas, 0),
      },
      vendedores: vendedorBreakdown,
    },
    vendedorBreakdown.length
  )
}
