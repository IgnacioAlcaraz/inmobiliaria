import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runVendedorAgent, runManagerAgent } from '@/lib/ai/agent'

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

    const MAX_MESSAGE_LENGTH = 4000
    if (message.trim().length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ error: 'Mensaje demasiado largo' }, { status: 400 })
    }

    const trimmed = message.trim()

    // Get user role to determine context
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isManager = profile?.role === 'encargado' || profile?.role === 'admin'

    // Whitelist scope values — never trust client-supplied scope directly
    const ALLOWED_SCOPES = ['personal', 'equipo', 'vendedor'] as const
    type ChatScope = typeof ALLOWED_SCOPES[number]
    const chatScope: ChatScope = ALLOWED_SCOPES.includes(scope) ? scope : 'personal'

    // Validate targetUserId format if provided
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const rawTargetUserId = targetUserId && typeof targetUserId === 'string' && uuidRegex.test(targetUserId)
      ? targetUserId
      : null
    const chatTargetUserId = rawTargetUserId

    // Managers: verify targetUserId belongs to one of their assigned vendedores
    if (isManager && chatScope === 'vendedor' && chatTargetUserId) {
      const { data: assignment } = await supabase
        .from('manager_vendedores')
        .select('id')
        .eq('manager_id', user.id)
        .eq('vendedor_id', chatTargetUserId)
        .maybeSingle()

      if (!assignment) {
        return NextResponse.json({ error: 'Vendedor no asignado' }, { status: 403 })
      }
    }

    // Rate limiting: max 30 mensajes por hora por usuario
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count: recentCount } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('role', 'user')
      .gte('created_at', oneHourAgo)

    if ((recentCount ?? 0) >= 30) {
      return NextResponse.json(
        { error: 'Límite de mensajes alcanzado. Intenta de nuevo en una hora.' },
        { status: 429 }
      )
    }

    // Build history query with proper filtering
    let historyQuery = supabase
      .from('chat_messages')
      .select('role, content, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

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

    const chatHistory = (history || []).reverse() as { role: 'user' | 'assistant'; content: string }[]

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

    // Run local LangGraph agent
    const assistantReply = isManager
      ? await runManagerAgent(
          user.id,
          trimmed,
          chatScope,
          chatScope === 'vendedor' ? chatTargetUserId : null,
          chatHistory
        )
      : await runVendedorAgent(user.id, trimmed, chatHistory)

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
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Chat error:', msg)
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'development' ? msg : 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
