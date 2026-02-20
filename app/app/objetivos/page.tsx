import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/app-header'
import { ObjetivosContent } from '@/components/objetivos/objetivos-content'

export default async function ObjetivosPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const [{ data: objetivos }, { data: cierres }] = await Promise.all([
    supabase
      .from('objetivos')
      .select('*')
      .eq('user_id', user.id)
      .order('anio', { ascending: false }),
    supabase
      .from('cierres')
      .select('id, fecha, valor_cierre, porcentaje_honorarios, porcentaje_agente, puntas')
      .eq('user_id', user.id),
  ])

  return (
    <>
      <AppHeader title="Objetivos" />
      <div className="p-4 lg:p-6">
        <ObjetivosContent
          objetivos={objetivos || []}
          cierres={cierres || []}
          userId={user.id}
        />
      </div>
    </>
  )
}
