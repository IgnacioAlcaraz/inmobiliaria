import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/app-header'
import { TrackeoContent } from '@/components/trackeo/trackeo-content'

export default async function TrackeoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'

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
