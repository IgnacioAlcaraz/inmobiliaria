import { redirect } from 'next/navigation'
import { getCurrentUser, getCurrentProfile } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/app-header'
import { AdminContent } from '@/components/admin/admin-content'

export default async function AdminPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const profile = await getCurrentProfile()
  if (profile?.role !== 'admin') redirect('/app/dashboard')

  const supabase = await createClient()

  const [profilesRes, cierresRes, captacionesRes, assignmentsRes] = await Promise.all([
    supabase.from('profiles').select('*').order('full_name'),
    supabase.from('cierres').select('*').order('fecha', { ascending: false }),
    supabase.from('captaciones').select('*'),
    supabase.from('manager_vendedores').select('*'),
  ])

  return (
    <>
      <AppHeader title="Administracion" />
      <div className="p-4 lg:p-6">
        <AdminContent
          profiles={profilesRes.data || []}
          cierres={cierresRes.data || []}
          captaciones={captacionesRes.data || []}
          assignments={assignmentsRes.data || []}
        />
      </div>
    </>
  )
}
