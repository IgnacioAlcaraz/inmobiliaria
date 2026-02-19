import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/app-header'
import { ContactosContent } from '@/components/contactos/contactos-content'

export default async function ContactosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch contactos with joined propiedades and tags
  const { data: contactos } = await supabase
    .from('contactos')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch all tags for this user
  const { data: tags } = await supabase
    .from('contacto_tags')
    .select('*')
    .eq('user_id', user.id)
    .order('nombre')

  // Fetch tag links for all contactos
  const contactoIds = (contactos || []).map((c) => c.id)
  let tagLinks: { contacto_id: string; tag_id: string }[] = []
  if (contactoIds.length > 0) {
    const { data } = await supabase
      .from('contacto_tag_links')
      .select('contacto_id, tag_id')
      .in('contacto_id', contactoIds)
    tagLinks = data || []
  }

  // Fetch propiedades for all contactos
  let propiedades: { id: string; contacto_id: string; propiedad_id: string }[] = []
  if (contactoIds.length > 0) {
    const { data } = await supabase
      .from('contacto_propiedades')
      .select('id, contacto_id, propiedad_id')
      .in('contacto_id', contactoIds)
    propiedades = data || []
  }

  // Fetch captaciones for property linking
  const { data: captaciones } = await supabase
    .from('captaciones')
    .select('id, direccion, operacion')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Merge tags and propiedades into contactos
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
