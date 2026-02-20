import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { ChatContent } from '@/components/chat/chat-content'

export default async function ChatPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = await createClient()
  const { data: messages } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(50)

  return <ChatContent initialMessages={messages || []} />
}
