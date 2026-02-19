import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/app-header'
import { CierresContent } from '@/components/cierres/cierres-content'

export default async function CierresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'

  // Fetch cierres with joined captacion data (ascending for acumulado calc)
  let cierresQuery = supabase
    .from('cierres')
    .select('*, captacion:captaciones(id, direccion, operacion, moneda)')
    .order('fecha', { ascending: true })

  if (!isAdmin) {
    cierresQuery = cierresQuery.eq('user_id', user.id)
  }

  const { data: cierres } = await cierresQuery

  // Fetch captaciones for the dropdown in the form
  let captQuery = supabase
    .from('captaciones')
    .select('id, direccion, operacion, moneda, valor_publicado')
    .order('fecha_alta', { ascending: false })

  if (!isAdmin) {
    captQuery = captQuery.eq('user_id', user.id)
  }

  const { data: captaciones } = await captQuery

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
