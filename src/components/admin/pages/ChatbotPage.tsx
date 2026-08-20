'use client'

import { useEffect, useRef, useState } from 'react'
import { api } from '@/lib/client-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { Bot, Send, Trash2, Loader2, AlertTriangle, User, Sparkles } from 'lucide-react'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  error?: string
}

interface ChatLogsResponse {
  items: { id: string; role: 'user' | 'assistant'; content: string; createdAt: string }[]
}

interface ChatResponse {
  reply: string
  provider: string
  model: string
  error?: string
  enabled: boolean
}

interface LlmSettingsResponse {
  settings: {
    provider: string
    model: string
    enabled: boolean
  } | null
}

const SUGGESTED_PROMPTS = [
  'How many companies in Data Science?',
  'How many female founders?',
  'What are the total monthly revenues?',
  'List the top 3 companies by revenue',
]

let _idSeq = 0
const tmpId = () => `tmp-${Date.now()}-${++_idSeq}`

export default function ChatbotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [provider, setProvider] = useState<string | null>(null)
  const [model, setModel] = useState<string | null>(null)
  const [disabled, setDisabled] = useState(false)
  const { toast } = useToast()

  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load chat history + LLM info on mount
  useEffect(() => {
    void load()
  }, [])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, sending])

  async function load() {
    setLoading(true)
    try {
      const [logsRes, settingsRes] = await Promise.all([
        api<ChatLogsResponse>('/api/admin/chat/logs').catch(() => ({ items: [] })),
        api<LlmSettingsResponse>('/api/admin/llm-settings').catch(() => ({ settings: null })),
      ])
      // API returns most-recent-first; reverse so oldest is at top
      const reversed = [...logsRes.items].reverse()
      setMessages(
        reversed.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
        }))
      )
      if (settingsRes.settings) {
        setProvider(settingsRes.settings.provider)
        setModel(settingsRes.settings.model)
        setDisabled(!settingsRes.settings.enabled)
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  async function send(text?: string) {
    const message = (text ?? input).trim()
    if (!message || sending) return

    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    const userMsg: ChatMessage = {
      id: tmpId(),
      role: 'user',
      content: message,
      createdAt: new Date().toISOString(),
    }
    const typingId = tmpId()
    const typingMsg: ChatMessage = {
      id: typingId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    }

    setMessages((s) => [...s, userMsg, typingMsg])
    setSending(true)

    try {
      const res = await api<ChatResponse>('/api/admin/chat', {
        method: 'POST',
        body: { message },
      })

      setProvider(res.provider)
      setModel(res.model)
      setDisabled(res.enabled === false)

      setMessages((s) =>
        s.map((m) =>
          m.id === typingId
            ? {
                id: `asst-${typingId}`,
                role: 'assistant',
                content: res.reply,
                createdAt: new Date().toISOString(),
                error: res.error,
              }
            : m
        )
      )
    } catch (e: any) {
      setMessages((s) =>
        s.map((m) =>
          m.id === typingId
            ? {
                id: `asst-err-${typingId}`,
                role: 'assistant',
                content: 'Sorry, something went wrong while reaching the assistant.',
                createdAt: new Date().toISOString(),
                error: e.message,
              }
            : m
        )
      )
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send()
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    // simple auto-grow
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  async function clearHistory() {
    setConfirmClear(false)
    setClearing(true)
    try {
      await api('/api/admin/chat/logs', { method: 'DELETE' })
      setMessages([])
      toast({ title: 'Cleared', description: 'Conversation history removed.' })
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setClearing(false)
    }
  }

  const showEmptyState = !loading && messages.length === 0

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-semibold">AI Assistant</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Ask questions about your companies, founders and revenue.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {provider && (
            <Badge variant="outline" className="text-xs">
              Provider: <span className="text-foreground ml-1">{provider}</span>
              {model && (
                <>
                  <span className="text-muted-foreground mx-1">·</span>
                  Model: <span className="text-foreground ml-1">{model}</span>
                </>
              )}
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmClear(true)}
            disabled={clearing || messages.length === 0}
          >
            {clearing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
            Clear history
          </Button>
        </div>
      </div>

      {/* Disabled warning */}
      {disabled && (
        <Alert variant="default" className="mb-3 border-amber-200 bg-amber-50 text-amber-900 [&>svg]:text-amber-600">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Assistant disabled</AlertTitle>
          <AlertDescription>
            The AI assistant is currently disabled. Enable it in LLM Settings.
          </AlertDescription>
        </Alert>
      )}

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto rounded-lg border bg-card/40 p-4 space-y-4"
      >
        {loading ? (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading conversation…
          </div>
        ) : showEmptyState ? (
          <EmptyState onPick={(p) => void send(p)} />
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} />)
        )}
      </div>

      {/* Suggested chips (only show when there is at least one message and input empty) */}
      {!showEmptyState && messages.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 mb-2">
          {SUGGESTED_PROMPTS.map((p) => (
            <Button
              key={p}
              variant="outline"
              size="sm"
              className="text-xs h-7"
              disabled={sending}
              onClick={() => void send(p)}
            >
              <Sparkles className="h-3 w-3 mr-1.5 text-muted-foreground" />
              {p}
            </Button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="mt-2 flex items-end gap-2">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={onInputChange}
          onKeyDown={onKeyDown}
          placeholder="Ask the assistant…  (Enter to send · Shift+Enter for newline)"
          rows={1}
          disabled={loading}
          className="min-h-[64px] max-h-40 resize-none"
        />
        <Button onClick={() => void send()} disabled={!input.trim() || sending || loading} className="h-[64px] px-4">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          <span className="sr-only sm:not-sr-only sm:ml-1.5">Send</span>
        </Button>
      </div>

      {/* Clear history confirmation */}
      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear conversation history?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes all chat history from the database. The AI assistant will lose context from previous messages. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void clearHistory()}
            >
              Clear history
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${isUser ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground'}`}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className={`flex flex-col gap-1 max-w-[85%] sm:max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={
            isUser
              ? 'rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-3.5 py-2 text-sm whitespace-pre-wrap break-words'
              : 'rounded-2xl rounded-tl-sm bg-muted text-foreground px-3.5 py-2 text-sm whitespace-pre-wrap break-words'
          }
        >
          {message.content || (isUser ? '' : <TypingDots />)}
        </div>
        {message.error && (
          <div className="text-xs text-amber-600 flex items-center gap-1 px-1">
            <AlertTriangle className="h-3 w-3" />
            <span>provider error: {message.error}</span>
          </div>
        )}
        {message.createdAt && (
          <span className="text-[10px] text-muted-foreground px-1">
            {new Date(message.createdAt).toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  )
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1">
      <span className="h-2 w-2 rounded-full bg-muted-foreground/70 animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="h-2 w-2 rounded-full bg-muted-foreground/70 animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="h-2 w-2 rounded-full bg-muted-foreground/70 animate-bounce" style={{ animationDelay: '300ms' }} />
    </span>
  )
}

function EmptyState({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="h-full flex items-center justify-center">
      <Card className="max-w-md w-full">
        <CardContent className="p-6 text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Ask the SEECS assistant</h3>
            <p className="text-sm text-muted-foreground mt-1">
              The assistant answers grounded in a live snapshot of your companies, founders and revenue data. Try one of these prompts to get started.
            </p>
          </div>
          <div className="grid gap-2 text-left">
            {SUGGESTED_PROMPTS.map((p) => (
              <Button
                key={p}
                variant="outline"
                size="sm"
                className="justify-start h-auto py-2 text-left whitespace-normal"
                onClick={() => onPick(p)}
              >
                <Sparkles className="h-3.5 w-3.5 mr-2 shrink-0 text-muted-foreground" />
                <span>{p}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
