import { redirect } from 'next/navigation'
import { getCurrentUser, getCurrentProfile } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/app-header'
import { TrackeoContent } from '@/components/trackeo/trackeo-content'

export default async function TrackeoPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const profile = await getCurrentProfile()
  const isAdmin = profile?.role === 'admin'

  const supabase = await createClient()
  let query = supabase
    .from('trackeo')
    .select('*')
    .order('fecha', { ascending: false })

  if (!isAdmin) {
    query = query.eq('user_id', user.id)
  }

  const { data: trackeo } = await query

  return (
    <>
      <AppHeader title="Trackeo Diario" />
      <div className="p-4 lg:p-6">
        <TrackeoContent
          trackeo={trackeo || []}
          userId={user.id}
          isAdmin={isAdmin}
        />
      </div>
    </>
  )
}
