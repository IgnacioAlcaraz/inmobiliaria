import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/app-header'
import { ObjetivosContent } from '@/components/objetivos/objetivos-content'

export default async function ObjetivosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: objetivos } = await supabase
    .from('objetivos')
    .select('*')
    .eq('user_id', user.id)
    .order('anio', { ascending: false })

  // Get cierres to calculate actual progress
  const { data: cierres } = await supabase
    .from('cierres')
    .select('id, fecha, valor_cierre, porcentaje_honorarios, porcentaje_agente, puntas')
    .eq('user_id', user.id)

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
