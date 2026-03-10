import { redirect } from 'next/navigation'
import { getCurrentUser, getCurrentProfile } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { ManagerTableroGestion } from '@/components/manager/manager-tablero-gestion'

export default async function Page() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const profile = await getCurrentProfile()
  if (!profile || (profile.role !== 'encargado' && profile.role !== 'admin')) {
    redirect('/app/dashboard')
  }

  const supabase = await createClient()
  const { data: assignments } = await supabase.from('manager_vendedores').select('vendedor_id').eq('manager_id', user.id)
  const vendedorIds = (assignments || []).map((a) => a.vendedor_id)
  if (vendedorIds.length === 0) return <div className="p-6">No tienes vendedores asignados.</div>

  const year = new Date().getFullYear()
  const startOfYear = `${year}-01-01`
  const endOfYear = `${year}-12-31`

  const [vendedoresRes, captBusRes, cierresRes, trackeoDiarioRes] = await Promise.all([
    supabase.from('profiles').select('*').in('id', vendedorIds),
    // Fetch all captaciones (not just current year) to compute cartera activa correctly
    supabase.from('captaciones_busquedas').select('*').in('user_id', vendedorIds).lte('fecha_alta', endOfYear).limit(5000),
    supabase.from('cierres').select('*').in('user_id', vendedorIds).gte('fecha', startOfYear).lte('fecha', endOfYear).limit(500),
    supabase.from('trackeo_diario').select('*').in('user_id', vendedorIds).gte('fecha', startOfYear).lte('fecha', endOfYear).limit(2000),
  ])

  return (
    <div className="p-6">
      <ManagerTableroGestion
        vendedores={vendedoresRes.data || []}
        captacionesBusquedas={captBusRes.data || []}
        cierres={cierresRes.data || []}
        trackeoDiario={trackeoDiarioRes.data || []}
        year={year}
      />
    </div>
  )
}
