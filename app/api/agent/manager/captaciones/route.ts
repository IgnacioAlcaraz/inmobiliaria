import { NextRequest } from 'next/server'
import { validateManagerRequest, managerSuccess, managerError } from '@/lib/manager-auth'

export async function POST(req: NextRequest) {
  const auth = await validateManagerRequest(req)
  if (!auth.ok) return auth.response

  const { supabase, vendedorIds, body } = auth

  let query = supabase
    .from('captaciones')
    .select('*')
    .in('user_id', vendedorIds)
    .order('fecha_alta', { ascending: false })

  if (body.operacion) query = query.eq('operacion', body.operacion as string)
  if (body.conCierre === true) query = query.not('fecha_cierre', 'is', null)
  if (body.conCierre === false) query = query.is('fecha_cierre', null)

  const { data, error } = await query
  if (error) return managerError(error.message, 500)

  return managerSuccess(data, data?.length || 0)
}
