import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ManagerChatContent } from '@/components/manager/manager-chat-content'
import type { Profile, ChatMessage } from '@/lib/types'

export default async function ManagerChatPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'encargado' && profile.role !== 'admin')) {
    redirect('/app/dashboard')
  }

  // Get assigned vendedores
  const { data: assignments } = await supabase
    .from('manager_vendedores')
    .select('vendedor_id')
    .eq('manager_id', user.id)

  const vendedorIds = (assignments || []).map((a) => a.vendedor_id)

  let vendedorProfiles: Profile[] = []
  if (vendedorIds.length > 0) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .in('id', vendedorIds)
    vendedorProfiles = (data || []) as Profile[]
  }

  // Load chat history
  const { data: messages } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(100)

  return (
    <ManagerChatContent
      initialMessages={(messages || []) as ChatMessage[]}
      vendedores={vendedorProfiles}
    />
  )
}
