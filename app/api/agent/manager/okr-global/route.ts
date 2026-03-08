import { NextRequest } from 'next/server'
import { validateManagerRequest, managerSuccess, managerError } from '@/lib/manager-auth'

/**
 * POST /api/agent/manager/okr-global
 * Body: { managerId, anio?, periodo? } periodo: 'Q1'|'Q2'|'Q3'|'Q4'|'year'
 * Returns aggregated objective vs achieved for trimesters or full year
 */
export async function POST(req: NextRequest) {
  const auth = await validateManagerRequest(req)
  if (!auth.ok) return auth.response

  const { supabase, vendedorIds, body } = auth
  const anio = body.anio ? Number(body.anio) : new Date().getFullYear()
  const periodo = body.periodo || 'year'

  try {
    // fetch objetivos_anuales for vendedores
    const { data: objetivos, error: oErr } = await supabase
      .from('objetivos_anuales')
      .select('*')
      .in('user_id', vendedorIds)
      .eq('year', anio)

    if (oErr) return managerError('Error objetivos: ' + oErr.message, 500)

    // compute objective sums
    const sumObj = (objetivos || []).reduce((acc: any, o: any) => {
      acc.objetivo_comisiones_brutas = (acc.objetivo_comisiones_brutas || 0) + Number(o.objetivo_comisiones_brutas || 0)
      acc.objetivo_facturacion_total = (acc.objetivo_facturacion_total || 0) + Number(o.objetivo_facturacion_total || 0)
      return acc
    }, {})

    // compute achieved honorarios and ingresos (from cierres)
    const where = supabase.from('cierres').select('fecha, honorarios_totales, valor_cierre').in('user_id', vendedorIds)
    const { data: cierres, error: crErr } = await where.gte('fecha', `${anio}-01-01`).lte('fecha', `${anio}-12-31`)
    if (crErr) return managerError('Error cierres: ' + crErr.message, 500)

    // helper to filter by quarter
    const quarterRanges: Record<string, [string, string]> = {
      Q1: [`${anio}-01-01`, `${anio}-03-31`],
      Q2: [`${anio}-04-01`, `${anio}-06-30`],
      Q3: [`${anio}-07-01`, `${anio}-09-30`],
      Q4: [`${anio}-10-01`, `${anio}-12-31`],
    }

    const computeForPeriod = (p: string) => {
      let filtered = cierres || []
      if (p !== 'year') {
        const [s, e] = quarterRanges[p]
        filtered = (cierres || []).filter((c: any) => c.fecha >= s && c.fecha <= e)
      }
      const honorarios_brutos = (filtered || []).reduce((s: number, c: any) => s + Number(c.honorarios_totales || 0), 0)
      const ingresos_netos = (filtered || []).reduce((s: number, c: any) => s + Number(c.valor_cierre || 0), 0)
      return { honorarios_brutos, ingresos_netos }
    }

    if (periodo === 'year') {
      const yearVals = computeForPeriod('year')
      return managerSuccess({ anio, objetivo: sumObj, achieved: yearVals }, 1)
    }

    // return per-quarter values
    const quarters = ['Q1','Q2','Q3','Q4'].map((q) => ({ q, ...computeForPeriod(q) }))
    return managerSuccess({ anio, objetivo: sumObj, quarters }, quarters.length)
  } catch (err) {
    console.error('okr-global error', err)
    return managerError('Error interno', 500)
  }
}
