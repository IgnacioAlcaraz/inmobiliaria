import { redirect } from 'next/navigation'
import { getCurrentUser, getCurrentProfile } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { ManagerDashboardContent } from '@/components/manager/manager-dashboard-content'
import type { Profile } from '@/lib/types'

export default async function ManagerDashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const profile = await getCurrentProfile()
  if (!profile || (profile.role !== 'encargado' && profile.role !== 'admin')) {
    redirect('/app/dashboard')
  }

  const supabase = await createClient()

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

  const year = new Date().getFullYear()
  const startOfYear = `${year}-01-01`
  const endOfYear = `${year}-12-31`

  const [
    vendedorProfilesRes,
    cierresRes,
    captacionesRes,
    trackeoRes,
    trackeoDiarioRes,
    captBusRes,
    objetivosRes,
  ] = await Promise.all([
    supabase.from('profiles').select('*').in('id', vendedorIds),
    supabase
      .from('cierres')
      .select('*, captacion:captaciones(id, direccion, operacion, moneda)')
      .in('user_id', vendedorIds)
      .gte('fecha', startOfYear)
      .lte('fecha', endOfYear)
      .order('fecha', { ascending: false })
      .limit(500),
    // captaciones table (legacy)
    supabase.from('captaciones').select('*').in('user_id', vendedorIds).limit(500),
    // trackeo (legacy)
    supabase
      .from('trackeo')
      .select('*')
      .in('user_id', vendedorIds)
      .gte('fecha', startOfYear)
      .lte('fecha', endOfYear)
      .order('fecha', { ascending: false })
      .limit(500),
    // additional: trackeo_diario for monthly aggregates
    supabase
      .from('trackeo_diario')
      .select('*')
      .in('user_id', vendedorIds)
      .gte('fecha', startOfYear)
      .lte('fecha', endOfYear)
      .order('fecha', { ascending: false })
      .limit(2000),
    // captaciones_busquedas (detailed captaciones)
    supabase
      .from('captaciones_busquedas')
      .select('*')
      .in('user_id', vendedorIds)
      .gte('fecha_alta', startOfYear)
      .lte('fecha_alta', endOfYear)
      .limit(2000),
    // objetivos anuales for team
    supabase.from('objetivos_anuales').select('*').in('user_id', vendedorIds).eq('year', year),
  ])
  

  return (
    <div className="p-6">
      <ManagerDashboardContent
        vendedores={(vendedorProfilesRes.data || []) as Profile[]}
        cierres={cierresRes.data || []}
        captaciones={captacionesRes.data || []}
        trackeo={trackeoRes.data || []}
        trackeoDiario={trackeoDiarioRes?.data || []}
        captacionesBusquedas={captBusRes?.data || []}
        objetivos={(objetivosRes?.data || [])}
        year={year}
      />
    </div>
  )
}
