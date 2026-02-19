import { NextRequest } from 'next/server'
import { validateManagerRequest, managerSuccess, managerError } from '@/lib/manager-auth'

export async function POST(req: NextRequest) {
  const auth = await validateManagerRequest(req)
  if (!auth.ok) return auth.response

  const { supabase, vendedorIds, body } = auth

  let query = supabase
    .from('objetivos')
    .select('*')
    .in('user_id', vendedorIds)

  if (body.anio) query = query.eq('anio', body.anio as number)

  const { data, error } = await query
  if (error) return managerError(error.message, 500)

  return managerSuccess(data, data?.length || 0)
}
