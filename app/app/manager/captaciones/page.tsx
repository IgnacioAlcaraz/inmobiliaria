import { redirect } from 'next/navigation'
import { getCurrentUser, getCurrentProfile } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { ManagerCaptacionesVsOperaciones } from '@/components/manager/manager-captaciones-vs-operaciones'
import { AppHeader } from '@/components/app-header'

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

  const [vendedoresRes, captBusRes] = await Promise.all([
    supabase.from('profiles').select('*').in('id', vendedorIds),
    supabase
      .from('captaciones_busquedas')
      .select('*')
      .in('user_id', vendedorIds)
      .order('fecha_alta', { ascending: false })
      .limit(5000),
  ])

  return (
    <>
      <AppHeader title="Trackeo Cartera" />
      <div className="p-4 lg:p-6">
        <ManagerCaptacionesVsOperaciones
          captacionesBusquedas={captBusRes.data || []}
          vendedores={vendedoresRes.data || []}
          year={year}
        />
      </div>
    </>
  )
}
