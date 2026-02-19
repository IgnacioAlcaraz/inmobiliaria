import { NextRequest } from 'next/server'
import { validateManagerRequest, managerSuccess, managerError } from '@/lib/manager-auth'

export async function POST(req: NextRequest) {
  const auth = await validateManagerRequest(req)
  if (!auth.ok) return auth.response

  const { supabase, vendedorIds, body } = auth

  let query = supabase
    .from('trackeo')
    .select('*')
    .in('user_id', vendedorIds)
    .order('fecha', { ascending: false })

  if (body.desde) query = query.gte('fecha', body.desde as string)
  if (body.hasta) query = query.lte('fecha', body.hasta as string)
  if (body.mes && body.anio) {
    const m = String(body.mes).padStart(2, '0')
    query = query.gte('fecha', `${body.anio}-${m}-01`).lte('fecha', `${body.anio}-${m}-31`)
  } else if (body.anio) {
    query = query.gte('fecha', `${body.anio}-01-01`).lte('fecha', `${body.anio}-12-31`)
  }

  const { data, error } = await query
  if (error) return managerError(error.message, 500)

  return managerSuccess(data, data?.length || 0)
}
