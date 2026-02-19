import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { message, scope, targetUserId } = await req.json()

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Mensaje vacio' }, { status: 400 })
    }

    const trimmed = message.trim()

    // Get user role to determine context
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isManager = profile?.role === 'encargado'

    // Determine scope and target
    const chatScope = scope || 'personal'
    const chatTargetUserId = targetUserId || null

    // Build history query with proper filtering
    let historyQuery = supabase
      .from('chat_messages')
      .select('role, content, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    // For managers, filter by scope and target
    if (isManager) {
      historyQuery = historyQuery.eq('scope', chatScope)
      if (chatScope === 'vendedor' && chatTargetUserId) {
        historyQuery = historyQuery.eq('target_user_id', chatTargetUserId)
      } else if (chatScope === 'equipo') {
        historyQuery = historyQuery.is('target_user_id', null)
      }
    } else {
      // Vendedores only see personal scope
      historyQuery = historyQuery.eq('scope', 'personal')
    }

    const { data: history } = await historyQuery

    const chatHistory = (history || []).reverse()

    // Save user message
    const { error: saveUserError } = await supabase.from('chat_messages').insert({
      user_id: user.id,
      role: 'user',
      content: trimmed,
      scope: chatScope,
      target_user_id: chatTargetUserId,
    })

    if (saveUserError) {
      console.error('Error saving user message:', saveUserError)
    }

    // Prepare webhook URL
    const webhookUrl = isManager 
      ? process.env.N8N_MANAGER_WEBHOOK_URL 
      : process.env.N8N_WEBHOOK_URL
    const secret = process.env.N8N_CHAT_SECRET

    if (!webhookUrl) {
      return NextResponse.json({ error: 'Webhook URL no configurado' }, { status: 500 })
    }

    // Build payload for n8n
    const payload = isManager
      ? JSON.stringify({
          message: trimmed,
          managerId: user.id,
          managerName: user.user_metadata?.full_name || 'Encargado',
          scope: chatScope,
          vendedorId: chatScope === 'vendedor' ? chatTargetUserId : null,
          chatHistory,
        })
      : JSON.stringify({
          message: trimmed,
          userId: user.id,
          userName: user.user_metadata?.full_name || 'Usuario',
          chatHistory,
        })

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (secret) {
      headers['x-n8n-secret'] = secret
    }

    // Call n8n webhook
    let n8nResponse: Response
    try {
      n8nResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: payload,
        // @ts-expect-error -- Node 18+ undici option to skip TLS verification for self-signed certs
        dispatcher: new (await import('undici')).Agent({
          connect: { rejectUnauthorized: false },
        }),
      })
    } catch (fetchErr) {
      return NextResponse.json(
        { error: `Error de conexion con n8n: ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)}` },
        { status: 502 }
      )
    }

    if (!n8nResponse.ok) {
      return NextResponse.json(
        { error: 'Error al contactar al agente IA' },
        { status: 502 }
      )
    }

    // Parse response
    let assistantReply: string
    const contentType = n8nResponse.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      const data = await n8nResponse.json()
      assistantReply = data.output || data.message || JSON.stringify(data)
    } else {
      assistantReply = await n8nResponse.text()
    }

    // Save assistant message
    const { error: saveAssistantError } = await supabase.from('chat_messages').insert({
      user_id: user.id,
      role: 'assistant',
      content: assistantReply,
      scope: chatScope,
      target_user_id: chatTargetUserId,
    })

    if (saveAssistantError) {
      console.error('Error saving assistant message:', saveAssistantError)
    }

    return NextResponse.json({ reply: assistantReply })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
