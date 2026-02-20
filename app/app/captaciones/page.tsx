import { redirect } from 'next/navigation'
import { getCurrentUser, getCurrentProfile } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/app-header'
import { CaptacionesContent } from '@/components/captaciones/captaciones-content'

export default async function CaptacionesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const profile = await getCurrentProfile()
  const isAdmin = profile?.role === 'admin'

  const supabase = await createClient()
  let query = supabase
    .from('captaciones')
    .select('*')
    .order('fecha_alta', { ascending: false })

  if (!isAdmin) {
    query = query.eq('user_id', user.id)
  }

  const { data: captaciones } = await query

  return (
    <>
      <AppHeader title="Captaciones y Busquedas" />
      <div className="p-4 lg:p-6">
        <CaptacionesContent
          captaciones={captaciones || []}
          userId={user.id}
          isAdmin={isAdmin}
        />
      </div>
    </>
  )
}
