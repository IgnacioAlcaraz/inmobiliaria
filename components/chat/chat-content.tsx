'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import type { ChatMessage } from '@/lib/types'
import { Send, Trash2, Bot, User, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ChatContentProps {
  initialMessages: ChatMessage[]
}

export function ChatContent({ initialMessages }: ChatContentProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMsg = input.trim()
    setInput('')
    setIsLoading(true)

    // Optimistically add user message
    const tempUserMsg: ChatMessage = {
      id: crypto.randomUUID(),
      user_id: '',
      role: 'user',
      content: userMsg,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUserMsg])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Error al enviar mensaje')
      }

      const { reply } = await res.json()

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        user_id: '',
        role: 'assistant',
        content: reply,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error de conexion')
      // Remove the optimistic user message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id))
      setInput(userMsg) // Restore input
    } finally {
      setIsLoading(false)
      textareaRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClearHistory = async () => {
    if (!confirm('Borrar todo el historial de chat?')) return

    const supabase = createClient()
    const { error } = await supabase.from('chat_messages').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    if (error) {
      toast.error('Error al borrar historial')
      return
    }

    setMessages([])
    toast.success('Historial borrado')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h1 className="text-xl font-bold text-foreground">Chat IA</h1>
          <p className="text-sm text-muted-foreground">
            Agente inmobiliario inteligente conectado a n8n
          </p>
        </div>
        {messages.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearHistory}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Borrar historial
          </Button>
        )}
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <div className="rounded-full bg-primary/10 p-4">
              <Bot className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Asistente IA</h2>
              <p className="text-sm text-muted-foreground max-w-md mt-1">
                Preguntame lo que necesites sobre tus propiedades, cierres, captaciones o cualquier consulta inmobiliaria.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 max-w-3xl mx-auto">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-3 items-start',
                  msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                <div
                  className={cn(
                    'flex-shrink-0 rounded-full p-2',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {msg.role === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                <Card
                  className={cn(
                    'px-4 py-3 max-w-[80%]',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-card-foreground'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </p>
                </Card>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 items-start">
                <div className="flex-shrink-0 rounded-full p-2 bg-muted text-muted-foreground">
                  <Bot className="h-4 w-4" />
                </div>
                <Card className="px-4 py-3 bg-card text-card-foreground">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Pensando...
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-border px-6 py-4">
        <div className="flex gap-3 max-w-3xl mx-auto">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu mensaje... (Enter para enviar, Shift+Enter para nueva linea)"
            className="min-h-[48px] max-h-[120px] resize-none"
            disabled={isLoading}
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-12 w-12 flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
