import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ManagerDashboardContent } from '@/components/manager/manager-dashboard-content'
import type { Profile } from '@/lib/types'

export default async function ManagerDashboardPage() {
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
        <h1 className="text-2xl font-bold text-foreground mb-2">Dashboard Encargado</h1>
        <p className="text-muted-foreground">No tienes vendedores asignados. Contacta al administrador.</p>
      </div>
    )
  }

  // Fetch vendedor profiles
  const { data: vendedorProfiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', vendedorIds)

  const year = new Date().getFullYear()
  const startOfYear = `${year}-01-01`
  const endOfYear = `${year}-12-31`

  // Fetch all data for assigned vendedores
  const [cierresRes, captacionesRes, trackeoRes] = await Promise.all([
    supabase
      .from('cierres')
      .select('*, captacion:captaciones(id, direccion, operacion, moneda)')
      .in('user_id', vendedorIds)
      .gte('fecha', startOfYear)
      .lte('fecha', endOfYear)
      .order('fecha', { ascending: false }),
    supabase
      .from('captaciones')
      .select('*')
      .in('user_id', vendedorIds),
    supabase
      .from('trackeo')
      .select('*')
      .in('user_id', vendedorIds)
      .gte('fecha', startOfYear)
      .lte('fecha', endOfYear)
      .order('fecha', { ascending: false }),
  ])

  return (
    <div className="p-6">
      <ManagerDashboardContent
        vendedores={(vendedorProfiles || []) as Profile[]}
        cierres={cierresRes.data || []}
        captaciones={captacionesRes.data || []}
        trackeo={trackeoRes.data || []}
        year={year}
      />
    </div>
  )
}
