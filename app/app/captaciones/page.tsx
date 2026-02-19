import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/app-header'
import { CaptacionesContent } from '@/components/captaciones/captaciones-content'

export default async function CaptacionesPage() {
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
