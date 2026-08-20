'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/client-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Settings, Bot, KeyRound, Eye, EyeOff, Save, Loader2, Check, Info, ShieldCheck, Send } from 'lucide-react'

type Provider = 'zai' | 'openai' | 'anthropic' | 'custom'

interface LlmSettings {
  provider: Provider
  apiKeyMasked: string | null
  hasApiKey: boolean
  baseUrl: string | null
  model: string
  systemPrompt: string | null
  temperature: number
  enabled: boolean
}

interface LlmSettingsResponse {
  settings: LlmSettings | null
}

interface ChatResponse {
  reply: string
  provider: string
  model: string
  error?: string
  enabled: boolean
}

const PROVIDER_LABELS: Record<Provider, string> = {
  zai: 'Z.ai (built-in)',
  openai: 'OpenAI',
  anthropic: 'Anthropic Claude',
  custom: 'Custom OpenAI-compatible',
}

const BASE_URL_PLACEHOLDERS: Record<Provider, string> = {
  zai: 'https://api.z.ai/api/paas/v4',
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
  custom: 'https://your-endpoint/v1',
}

const MODEL_PLACEHOLDERS: Record<Provider, string> = {
  zai: 'glm-4.6',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-sonnet-20241022',
  custom: 'model-id',
}

// Snapshot of original values so we only send what changed
interface Snapshot {
  provider: Provider
  baseUrl: string
  model: string
  systemPrompt: string
  temperature: number
  enabled: boolean
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null)

  const [provider, setProvider] = useState<Provider>('zai')
  const [apiKey, setApiKey] = useState('')
  const [apiKeyMasked, setApiKeyMasked] = useState<string | null>(null)
  const [hasApiKey, setHasApiKey] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [baseUrl, setBaseUrl] = useState('')
  const [model, setModel] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [temperature, setTemperature] = useState(0.4)
  const [enabled, setEnabled] = useState(true)
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)

  const { toast } = useToast()

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await api<LlmSettingsResponse>('/api/admin/llm-settings')
      const s = res.settings
      if (s) {
        setProvider(s.provider as Provider)
        setApiKeyMasked(s.apiKeyMasked)
        setHasApiKey(s.hasApiKey)
        setBaseUrl(s.baseUrl || '')
        setModel(s.model || '')
        setSystemPrompt(s.systemPrompt || '')
        setTemperature(typeof s.temperature === 'number' ? s.temperature : 0.4)
        setEnabled(s.enabled)
        setSnapshot({
          provider: s.provider as Provider,
          baseUrl: s.baseUrl || '',
          model: s.model || '',
          systemPrompt: s.systemPrompt || '',
          temperature: typeof s.temperature === 'number' ? s.temperature : 0.4,
          enabled: s.enabled,
        })
      } else {
        setSnapshot({
          provider: 'zai',
          baseUrl: '',
          model: '',
          systemPrompt: '',
          temperature: 0.4,
          enabled: true,
        })
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const isZai = provider === 'zai'

  async function save() {
    if (!snapshot) return
    setSaving(true)
    try {
      const body: Record<string, any> = {}
      if (provider !== snapshot.provider) body.provider = provider
      // Always include apiKey only if the user typed a new one
      if (apiKey.trim()) body.apiKey = apiKey.trim()
      if (baseUrl !== snapshot.baseUrl) body.baseUrl = baseUrl.trim() || null
      if (model !== snapshot.model) body.model = model.trim()
      if (systemPrompt !== snapshot.systemPrompt) body.systemPrompt = systemPrompt.trim() || null
      if (temperature !== snapshot.temperature) body.temperature = temperature
      if (enabled !== snapshot.enabled) body.enabled = enabled

      const res = await api<LlmSettingsResponse>('/api/admin/llm-settings', {
        method: 'PUT',
        body,
      })
      const s = res.settings
      if (s) {
        setApiKeyMasked(s.apiKeyMasked)
        setHasApiKey(s.hasApiKey)
        setApiKey('')
        setSnapshot({
          provider: s.provider as Provider,
          baseUrl: s.baseUrl || '',
          model: s.model || '',
          systemPrompt: s.systemPrompt || '',
          temperature: typeof s.temperature === 'number' ? s.temperature : 0.4,
          enabled: s.enabled,
        })
      }
      toast({
        title: 'Settings saved',
        description: 'The AI assistant will use the new configuration.',
      })
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function testConnection() {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await api<ChatResponse>('/api/admin/chat', {
        method: 'POST',
        body: { message: 'ping' },
      })
      if (res.error) {
        setTestResult({ ok: false, text: res.error })
      } else {
        setTestResult({ ok: true, text: res.reply })
      }
    } catch (e: any) {
      setTestResult({ ok: false, text: e.message })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-semibold">LLM Settings</h1>
      </div>
      <p className="text-sm text-muted-foreground -mt-2">
        Connect your own LLM provider. The AI assistant uses these settings to answer the database manager's questions.
      </p>

      {loading ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground flex items-center">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading settings…
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="h-4 w-4" /> Provider configuration
            </CardTitle>
            <CardDescription>
              Choose a provider and supply credentials. Changes apply immediately to the chatbot.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Status row */}
            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Assistant status</span>
                <Badge
                  variant={enabled ? 'secondary' : 'destructive'}
                  className={enabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}
                >
                  {enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="enabled-switch" className="text-xs text-muted-foreground">
                  {enabled ? 'On' : 'Off'}
                </Label>
                <Switch id="enabled-switch" checked={enabled} onCheckedChange={setEnabled} />
              </div>
            </div>

            {/* Provider select */}
            <div className="space-y-1.5">
              <Label>Provider</Label>
              <Select value={provider} onValueChange={(v) => setProvider(v as Provider)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PROVIDER_LABELS) as Provider[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      {PROVIDER_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The built-in <code className="font-mono">zai</code> provider works out of the box with no extra configuration.
              </p>
            </div>

            {/* Z.ai info alert */}
            {isZai && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>No configuration needed</AlertTitle>
                <AlertDescription>
                  The Z.ai provider works out of the box with no extra configuration. The built-in SDK is used.
                </AlertDescription>
              </Alert>
            )}

            {/* API key + base URL for non-zai providers */}
            {!isZai && (
              <div className="space-y-4 rounded-md border p-3 bg-muted/30">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-1.5">
                      <KeyRound className="h-3.5 w-3.5" /> API Key
                    </Label>
                    <Badge
                      variant="outline"
                      className={hasApiKey ? 'text-emerald-700 border-emerald-200 bg-emerald-50' : 'text-muted-foreground'}
                    >
                      {hasApiKey ? (
                        <><Check className="h-3 w-3 mr-1" /> Key set</>
                      ) : (
                        'No key set'
                      )}
                    </Badge>
                  </div>
                  <div className="relative">
                    <Input
                      type={showKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={apiKeyMasked || 'Paste your API key…'}
                      autoComplete="off"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setShowKey((s) => !s)}
                    >
                      {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Leave blank to keep the current key. {apiKeyMasked && <>Currently: <code className="font-mono">{apiKeyMasked}</code></>}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label>Base URL</Label>
                  <Input
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder={BASE_URL_PLACEHOLDERS[provider]}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Model</Label>
                  <Input
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder={MODEL_PLACEHOLDERS[provider]}
                  />
                </div>
              </div>
            )}

            {/* System prompt */}
            <div className="space-y-1.5">
              <Label>System prompt (optional)</Label>
              <Textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={4}
                placeholder="Override the built-in system prompt. Leave blank to use the default SEECS assistant prompt."
              />
              <p className="text-xs text-muted-foreground">
                Override the built-in system prompt. Leave blank to use the default SEECS assistant prompt.
              </p>
            </div>

            {/* Temperature */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Temperature</Label>
                <Badge variant="outline" className="font-mono">{temperature.toFixed(1)}</Badge>
              </div>
              <Slider
                value={[temperature]}
                onValueChange={(v) => setTemperature(v[0])}
                min={0}
                max={1}
                step={0.1}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Precise (0.0)</span>
                <span>Balanced (0.5)</span>
                <span>Creative (1.0)</span>
              </div>
            </div>

            <Separator />

            {/* Save + Test */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={save} disabled={saving} className="flex-1">
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save settings
              </Button>
              <Button variant="outline" onClick={testConnection} disabled={testing || !enabled}>
                {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Test connection
              </Button>
            </div>

            {testResult && (
              <div className={`rounded-md border p-3 text-sm ${testResult.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-rose-200 bg-rose-50 text-rose-900'}`}>
                <div className="flex items-center gap-1.5 font-medium mb-1">
                  {testResult.ok ? <Check className="h-3.5 w-3.5" /> : <Info className="h-3.5 w-3.5" />}
                  {testResult.ok ? 'Connection OK · reply' : 'Connection failed'}
                </div>
                <div className="whitespace-pre-wrap text-xs">{testResult.text}</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* How this works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-primary" /> How this works
          </CardTitle>
          <CardDescription>
            A quick note on what the assistant can and cannot see.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              The chatbot runs inside the admin console only. It is not exposed to public visitors.
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              Each message is grounded in a live snapshot of your companies, founders and revenue data — the assistant never sees or generates raw SQL.
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              The database schema, connection string and API keys are never sent to the LLM provider.
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              Companies in their self-service portal do <strong className="text-foreground">not</strong> have access to the chatbot.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
