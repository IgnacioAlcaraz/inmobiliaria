import { NextRequest } from 'next/server'
import { validateManagerRequest, managerSuccess, managerError } from '@/lib/manager-auth'

export async function POST(req: NextRequest) {
  const auth = await validateManagerRequest(req)
  if (!auth.ok) return auth.response

  const { supabase, vendedorIds } = auth

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, created_at')
    .in('id', vendedorIds)

  if (error) return managerError(error.message, 500)

  return managerSuccess(data, data?.length || 0)
}
