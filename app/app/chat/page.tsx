import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ChatContent } from '@/components/chat/chat-content'

export default async function ChatPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch last 50 messages
  const { data: messages } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(50)

  return <ChatContent initialMessages={messages || []} />
}
