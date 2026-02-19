import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { VendedorDetail } from '@/components/manager/vendedor-detail'
import type { Profile } from '@/lib/types'

export default async function VendedorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: vendedorId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify encargado role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'encargado' && profile.role !== 'admin')) {
    redirect('/app/dashboard')
  }

  // Verify this vendedor is assigned to the manager
  const { data: assignment } = await supabase
    .from('manager_vendedores')
    .select('id')
    .eq('manager_id', user.id)
    .eq('vendedor_id', vendedorId)
    .single()

  if (!assignment && profile.role !== 'admin') {
    redirect('/app/manager/vendedores')
  }

  // Fetch vendedor profile
  const { data: vendedorProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', vendedorId)
    .single()

  if (!vendedorProfile) redirect('/app/manager/vendedores')

  const year = new Date().getFullYear()
  const startOfYear = `${year}-01-01`
  const endOfYear = `${year}-12-31`

  const [cierresRes, captacionesRes, trackeoRes, objetivosRes] = await Promise.all([
    supabase
      .from('cierres')
      .select('*, captacion:captaciones(id, direccion, operacion, moneda)')
      .eq('user_id', vendedorId)
      .gte('fecha', startOfYear)
      .lte('fecha', endOfYear)
      .order('fecha', { ascending: false }),
    supabase
      .from('captaciones')
      .select('*')
      .eq('user_id', vendedorId),
    supabase
      .from('trackeo')
      .select('*')
      .eq('user_id', vendedorId)
      .gte('fecha', startOfYear)
      .lte('fecha', endOfYear)
      .order('fecha', { ascending: false }),
    supabase
      .from('objetivos')
      .select('*')
      .eq('user_id', vendedorId)
      .eq('anio', year)
      .maybeSingle(),
  ])

  return (
    <div className="p-6">
      <VendedorDetail
        vendedor={vendedorProfile as Profile}
        cierres={cierresRes.data || []}
        captaciones={captacionesRes.data || []}
        trackeo={trackeoRes.data || []}
        objetivo={objetivosRes.data}
        year={year}
      />
    </div>
  )
}
