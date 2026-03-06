import { NextRequest } from 'next/server'
import { validateManagerRequest, managerSuccess, managerError } from '@/lib/manager-auth'
import { validAnio } from '@/lib/agent-validate'

export async function POST(req: NextRequest) {
  const auth = await validateManagerRequest(req)
  if (!auth.ok) return auth.response

  const { supabase, vendedorIds, body } = auth

  let query = supabase
    .from('objetivos')
    .select('*')
    .in('user_id', vendedorIds)

  const anio = validAnio(body.anio)
  if (anio) query = query.eq('anio', anio)

  const { data, error } = await query
  if (error) return managerError('Error al obtener objetivos', 500)

  return managerSuccess(data, data?.length || 0)
}
