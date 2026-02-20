import { redirect } from 'next/navigation'
import { getCurrentUser, getCurrentProfile } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/app-header'
import { CierresContent } from '@/components/cierres/cierres-content'

export default async function CierresPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const profile = await getCurrentProfile()
  const isAdmin = profile?.role === 'admin'

  const supabase = await createClient()

  let cierresQuery = supabase
    .from('cierres')
    .select('*, captacion:captaciones(id, direccion, operacion, moneda)')
    .order('fecha', { ascending: true })

  let captQuery = supabase
    .from('captaciones')
    .select('id, direccion, operacion, moneda, valor_publicado')
    .order('fecha_alta', { ascending: false })

  if (!isAdmin) {
    cierresQuery = cierresQuery.eq('user_id', user.id)
    captQuery = captQuery.eq('user_id', user.id)
  }

  const [{ data: cierres }, { data: captaciones }] = await Promise.all([
    cierresQuery,
    captQuery,
  ])

  return (
    <>
      <AppHeader title="Cierres" />
      <div className="p-4 lg:p-6">
        <CierresContent
          cierres={cierres || []}
          captaciones={captaciones || []}
          userId={user.id}
          isAdmin={isAdmin}
        />
      </div>
    </>
  )
}
