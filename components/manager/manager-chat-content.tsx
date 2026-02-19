'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Send, Trash2, Bot, User } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { ChatMessage, Profile } from '@/lib/types'

interface ManagerChatContentProps {
  initialMessages: ChatMessage[]
  vendedores: Profile[]
}

export function ManagerChatContent({ initialMessages, vendedores }: ManagerChatContentProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedVendedor, setSelectedVendedor] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Reload messages when vendedor changes
  useEffect(() => {
    const loadMessages = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Determine scope and target based on selection
      const scope = selectedVendedor ? 'vendedor' : 'equipo'
      const targetUserId = selectedVendedor || null

      let query = supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .eq('scope', scope)
        .order('created_at', { ascending: true })

      if (scope === 'vendedor' && targetUserId) {
        query = query.eq('target_user_id', targetUserId)
      } else if (scope === 'equipo') {
        query = query.is('target_user_id', null)
      }

      const { data } = await query
      setMessages(data || [])
    }

    loadMessages()
  }, [selectedVendedor])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setLoading(true)

    // Determine scope and target
    const scope = selectedVendedor ? 'vendedor' : 'equipo'
    const targetUserId = selectedVendedor || null

    // Optimistic update
    const tempUserMsg: ChatMessage = {
      id: 'temp-user',
      user_id: 'current',
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
      scope,
      target_user_id: targetUserId,
    }
    setMessages((prev) => [...prev, tempUserMsg])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          scope,
          targetUserId,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al enviar mensaje')
      }

      const { reply } = await res.json()

      // Remove temp message and add real messages
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== 'temp-user')
        return [
          ...withoutTemp,
          {
            id: Date.now().toString(),
            user_id: 'current',
            role: 'user',
            content: userMessage,
            created_at: new Date().toISOString(),
            scope,
            target_user_id: targetUserId,
          },
          {
            id: (Date.now() + 1).toString(),
            user_id: 'current',
            role: 'assistant',
            content: reply,
            created_at: new Date().toISOString(),
            scope,
            target_user_id: targetUserId,
          },
        ]
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al enviar mensaje')
      setMessages((prev) => prev.filter((m) => m.id !== 'temp-user'))
      setInput(userMessage)
    } finally {
      setLoading(false)
      textareaRef.current?.focus()
    }
  }

  const handleClearHistory = async () => {
    if (!confirm('¿Seguro que quieres borrar el historial de este chat?')) return

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const scope = selectedVendedor ? 'vendedor' : 'equipo'
    const targetUserId = selectedVendedor || null

    let deleteQuery = supabase
      .from('chat_messages')
      .delete()
      .eq('user_id', user.id)
      .eq('scope', scope)

    if (scope === 'vendedor' && targetUserId) {
      deleteQuery = deleteQuery.eq('target_user_id', targetUserId)
    } else if (scope === 'equipo') {
      deleteQuery = deleteQuery.is('target_user_id', null)
    }

    const { error } = await deleteQuery

    if (error) {
      toast.error('Error al borrar historial')
    } else {
      setMessages([])
      toast.success('Historial borrado')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const selectedVendedorName = vendedores.find((v) => v.id === selectedVendedor)?.full_name || 'Equipo completo'

  return (
    <div className="flex flex-col h-full">
      {/* Vendedor selector */}
      <div className="border-b p-4 flex items-center justify-between gap-4">
        <div className="flex-1">
          <Select value={selectedVendedor || 'equipo'} onValueChange={(val) => setSelectedVendedor(val === 'equipo' ? null : val)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="equipo">Equipo completo</SelectItem>
              {vendedores.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.full_name || 'Sin nombre'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={handleClearHistory}>
          <Trash2 className="h-4 w-4 mr-2" />
          Borrar historial
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <div className="rounded-full bg-primary/10 p-4">
              <Bot className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Chat IA - {selectedVendedorName}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Pregunta sobre el rendimiento, cierres, objetivos y más
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={cn('flex gap-3 items-start', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
              <div className={cn('flex-shrink-0 rounded-full p-2', msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <Card className={cn('px-4 py-3 max-w-[80%]', msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card')}>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </Card>
            </div>
          ))
        )}
        {loading && (
          <div className="flex gap-3 items-start">
            <div className="flex-shrink-0 rounded-full p-2 bg-muted">
              <Bot className="h-4 w-4" />
            </div>
            <Card className="px-4 py-3 bg-card">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Pensando...
              </div>
            </Card>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Pregunta sobre ${selectedVendedorName}...`}
            className="min-h-[60px] resize-none"
            disabled={loading}
          />
          <Button type="submit" disabled={!input.trim() || loading} size="icon" className="self-end">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Enter para enviar, Shift+Enter para nueva línea</p>
      </form>
    </div>
  )
}
