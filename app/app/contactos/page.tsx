import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/app-header'
import { ContactosContent } from '@/components/contactos/contactos-content'

export default async function ContactosPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const [{ data: contactos }, { data: tags }, { data: captaciones }] = await Promise.all([
    supabase
      .from('contactos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('contacto_tags')
      .select('*')
      .eq('user_id', user.id)
      .order('nombre'),
    supabase
      .from('captaciones')
      .select('id, direccion, operacion')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const contactoIds = (contactos || []).map((c) => c.id)
  let tagLinks: { contacto_id: string; tag_id: string }[] = []
  let propiedades: { id: string; contacto_id: string; propiedad_id: string }[] = []

  if (contactoIds.length > 0) {
    const [tagLinksRes, propiedadesRes] = await Promise.all([
      supabase
        .from('contacto_tag_links')
        .select('contacto_id, tag_id')
        .in('contacto_id', contactoIds),
      supabase
        .from('contacto_propiedades')
        .select('id, contacto_id, propiedad_id')
        .in('contacto_id', contactoIds),
    ])
    tagLinks = tagLinksRes.data || []
    propiedades = propiedadesRes.data || []
  }

  const contactosWithRelations = (contactos || []).map((c) => ({
    ...c,
    tags: tagLinks
      .filter((tl) => tl.contacto_id === c.id)
      .map((tl) => (tags || []).find((t) => t.id === tl.tag_id))
      .filter(Boolean),
    propiedades: propiedades.filter((p) => p.contacto_id === c.id),
  }))

  return (
    <>
      <AppHeader title="Contactos" />
      <div className="p-4 lg:p-6">
        <ContactosContent
          contactos={contactosWithRelations}
          tags={tags || []}
          captaciones={captaciones || []}
          userId={user.id}
        />
      </div>
    </>
  )
}
