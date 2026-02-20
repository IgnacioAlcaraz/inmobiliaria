import { redirect } from 'next/navigation'
import { getCurrentUser, getCurrentProfile } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { ManagerChatContent } from '@/components/manager/manager-chat-content'
import type { Profile, ChatMessage } from '@/lib/types'

export default async function ManagerChatPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const profile = await getCurrentProfile()
  if (!profile || (profile.role !== 'encargado' && profile.role !== 'admin')) {
    redirect('/app/dashboard')
  }

  const supabase = await createClient()

  const { data: assignments } = await supabase
    .from('manager_vendedores')
    .select('vendedor_id')
    .eq('manager_id', user.id)

  const vendedorIds = (assignments || []).map((a) => a.vendedor_id)

  const [messagesRes, vendedorProfilesRes] = await Promise.all([
    supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(100),
    vendedorIds.length > 0
      ? supabase.from('profiles').select('*').in('id', vendedorIds)
      : Promise.resolve({ data: [] }),
  ])

  return (
    <ManagerChatContent
      initialMessages={(messagesRes.data || []) as ChatMessage[]}
      vendedores={(vendedorProfilesRes.data || []) as Profile[]}
    />
  )
}
