import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { VendedoresList } from '@/components/manager/vendedores-list'
import type { Profile } from '@/lib/types'

export default async function ManagerVendedoresPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'encargado' && profile.role !== 'admin')) {
    redirect('/app/dashboard')
  }

  // Get assigned vendedores
  const { data: assignments } = await supabase
    .from('manager_vendedores')
    .select('vendedor_id')
    .eq('manager_id', user.id)

  const vendedorIds = (assignments || []).map((a) => a.vendedor_id)

  if (vendedorIds.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Vendedores</h1>
        <p className="text-muted-foreground">No tienes vendedores asignados.</p>
      </div>
    )
  }

  const { data: vendedorProfiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', vendedorIds)

  const year = new Date().getFullYear()
  const startOfYear = `${year}-01-01`
  const endOfYear = `${year}-12-31`

  const [cierresRes, captacionesRes, trackeoRes] = await Promise.all([
    supabase
      .from('cierres')
      .select('*')
      .in('user_id', vendedorIds)
      .gte('fecha', startOfYear)
      .lte('fecha', endOfYear),
    supabase
      .from('captaciones')
      .select('*')
      .in('user_id', vendedorIds),
    supabase
      .from('trackeo')
      .select('*')
      .in('user_id', vendedorIds)
      .gte('fecha', startOfYear)
      .lte('fecha', endOfYear),
  ])

  return (
    <div className="p-6">
      <VendedoresList
        vendedores={(vendedorProfiles || []) as Profile[]}
        cierres={cierresRes.data || []}
        captaciones={captacionesRes.data || []}
        trackeo={trackeoRes.data || []}
        year={year}
      />
    </div>
  )
}
