import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/app-header'
import { DashboardContent } from '@/components/dashboard/dashboard-content'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'

  // Fetch ALL data for the current year (not just current month)
  const year = new Date().getFullYear()
  const startOfYear = `${year}-01-01`
  const endOfYear = `${year}-12-31`

  let cierresQuery = supabase
    .from('cierres')
    .select('*, captacion:captaciones(id, direccion, operacion, moneda)')
    .gte('fecha', startOfYear)
    .lte('fecha', endOfYear)
    .order('fecha', { ascending: true })

  let captacionesQuery = supabase
    .from('captaciones')
    .select('*')

  let trackeoQuery = supabase
    .from('trackeo')
    .select('*')
    .gte('fecha', startOfYear)
    .lte('fecha', endOfYear)
    .order('fecha', { ascending: true })

  if (!isAdmin) {
    cierresQuery = cierresQuery.eq('user_id', user.id)
    captacionesQuery = captacionesQuery.eq('user_id', user.id)
    trackeoQuery = trackeoQuery.eq('user_id', user.id)
  }

  const [
    { data: cierres },
    { data: captaciones },
    { data: trackeo },
  ] = await Promise.all([
    cierresQuery,
    captacionesQuery,
    trackeoQuery,
  ])

  return (
    <>
      <AppHeader title="Dashboard" />
      <div className="p-4 lg:p-6">
        <DashboardContent
          cierres={cierres || []}
          captaciones={captaciones || []}
          trackeo={trackeo || []}
          isAdmin={isAdmin}
          year={year}
        />
      </div>
    </>
  )
}
