import { NextRequest } from 'next/server'
import { validateManagerRequest, managerSuccess, managerError } from '@/lib/manager-auth'
import { validEnum, validDias } from '@/lib/agent-validate'

export async function POST(req: NextRequest) {
  const auth = await validateManagerRequest(req)
  if (!auth.ok) return auth.response

  const { supabase, vendedorIds, body } = auth

  const rawVendedorId = body.vendedorId as string | undefined
  const filteredIds = rawVendedorId && vendedorIds.includes(rawVendedorId)
    ? [rawVendedorId]
    : vendedorIds

  let query = supabase
    .from('captaciones')
    .select('*')
    .in('user_id', filteredIds)
    .order('fecha_alta', { ascending: false })

  const operacion = validEnum(body.operacion, ['Venta', 'Alquiler', 'Temporario'] as const)
  const dias = validDias(body.diasHastaVencimiento)

  if (operacion) query = query.eq('operacion', operacion)
  if (body.conCierre === true) query = query.not('fecha_cierre', 'is', null)
  if (body.conCierre === false) query = query.is('fecha_cierre', null)

  if (dias) {
    const hasta = new Date()
    hasta.setDate(hasta.getDate() + dias)
    query = query.not('vence', 'is', null).lte('vence', hasta.toISOString().split('T')[0])
  }

  const { data, error } = await query
  if (error) return managerError('Error al obtener captaciones', 500)

  return managerSuccess(data, data?.length || 0)
}
