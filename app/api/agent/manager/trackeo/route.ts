import { NextRequest } from 'next/server'
import { validateManagerRequest, managerSuccess, managerError } from '@/lib/manager-auth'
import { validDate, validAnio, validMes } from '@/lib/agent-validate'

export async function POST(req: NextRequest) {
  const auth = await validateManagerRequest(req)
  if (!auth.ok) return auth.response

  const { supabase, vendedorIds, body } = auth

  const rawVendedorId = body.vendedorId as string | undefined
  const filteredIds = rawVendedorId && vendedorIds.includes(rawVendedorId)
    ? [rawVendedorId]
    : vendedorIds

  let query = supabase
    .from('trackeo')
    .select('*')
    .in('user_id', filteredIds)
    .order('fecha', { ascending: false })

  const desde = validDate(body.desde)
  const hasta = validDate(body.hasta)
  const anio = validAnio(body.anio)
  const mes = validMes(body.mes)

  if (desde) query = query.gte('fecha', desde)
  if (hasta) query = query.lte('fecha', hasta)
  if (anio && mes) {
    const m = String(mes).padStart(2, '0')
    const endDate = new Date(anio, mes, 0)
    query = query.gte('fecha', `${anio}-${m}-01`).lte('fecha', `${anio}-${m}-${String(endDate.getDate()).padStart(2, '0')}`)
  } else if (anio) {
    query = query.gte('fecha', `${anio}-01-01`).lte('fecha', `${anio}-12-31`)
  }

  const { data, error } = await query
  if (error) return managerError('Error al obtener trackeo', 500)

  return managerSuccess(data, data?.length || 0)
}
