import { createFileRoute } from '@tanstack/react-router'
import { useState, useCallback, useEffect, useRef } from 'react'
import { Send, Bot, User, PanelLeftClose, PanelLeft } from 'lucide-react'
import { ClientOnly } from '@/components/client-only'
import { TamboSetupProvider } from '@/components/tambo/tambo-provider'
import { GanttChart } from '@/components/gantt'
import type { GanttTask, GanttGroup, GanttMarker } from '@/components/gantt'
import { addDays, subDays } from '@/components/gantt/utils'
import { createAndAdvance, advanceThread, getLastAssistantText } from '@/lib/tambo'

export const Route = createFileRoute('/{-$locale}/schedule')({
  component: SchedulePage,
})

/* ── Sample data ────────────────────────────────────────────────────── */

const SAMPLE_GROUPS: GanttGroup[] = [
  { id: 'design', title: 'Design Phase', collapsed: false },
  { id: 'dev', title: 'Development', collapsed: false },
  { id: 'qa', title: 'Testing & QA', collapsed: false },
  { id: 'launch', title: 'Launch', collapsed: false },
]

const SAMPLE_TASKS: GanttTask[] = [
  { id: 't1', title: 'Wireframes & Mockups', start: subDays(new Date(), 5), end: addDays(new Date(), 3), progress: 80, color: '#6366f1', groupId: 'design', assignee: 'Ali' },
  { id: 't2', title: 'Design System Setup', start: subDays(new Date(), 2), end: addDays(new Date(), 8), progress: 40, color: '#8b5cf6', groupId: 'design', assignee: 'Sara' },
  { id: 't3', title: 'User Testing', start: addDays(new Date(), 4), end: addDays(new Date(), 10), progress: 0, color: '#a78bfa', groupId: 'design' },
  { id: 't4', title: 'Backend API', start: subDays(new Date(), 3), end: addDays(new Date(), 12), progress: 35, color: '#3b82f6', groupId: 'dev', assignee: 'Omar' },
  { id: 't5', title: 'Frontend Components', start: subDays(new Date(), 1), end: addDays(new Date(), 15), progress: 20, color: '#2563eb', groupId: 'dev', assignee: 'Yusuf' },
  { id: 't6', title: 'Database Schema', start: subDays(new Date(), 5), end: addDays(new Date(), 2), progress: 90, color: '#1d4ed8', groupId: 'dev', assignee: 'Ali' },
  { id: 't7', title: 'Auth Integration', start: addDays(new Date(), 3), end: addDays(new Date(), 10), progress: 0, color: '#60a5fa', groupId: 'dev' },
  { id: 't8', title: 'Unit Tests', start: addDays(new Date(), 8), end: addDays(new Date(), 18), progress: 0, color: '#10b981', groupId: 'qa', assignee: 'Fatima' },
  { id: 't9', title: 'Integration Tests', start: addDays(new Date(), 14), end: addDays(new Date(), 22), progress: 0, color: '#059669', groupId: 'qa' },
  { id: 't10', title: 'Performance Testing', start: addDays(new Date(), 18), end: addDays(new Date(), 25), progress: 0, color: '#34d399', groupId: 'qa' },
  { id: 't11', title: 'Beta Launch', start: addDays(new Date(), 22), end: addDays(new Date(), 28), progress: 0, color: '#f59e0b', groupId: 'launch' },
  { id: 't12', title: 'Production Deploy', start: addDays(new Date(), 28), end: addDays(new Date(), 30), progress: 0, color: '#ef4444', groupId: 'launch' },
]

const SAMPLE_MARKERS: GanttMarker[] = [
  { id: 'm1', date: new Date(), label: 'Today', color: '#ef4444' },
  { id: 'm2', date: addDays(new Date(), 15), label: 'Sprint Review', color: '#f59e0b' },
]

/* ── Tambo system prompt ────────────────────────────────────────────── */

const SYSTEM_PROMPT = `You are a project management assistant that helps manage Gantt charts.
You can help with:
- Adding, removing, or reordering tasks
- Changing task dates, durations, progress, and assignments
- Organizing tasks into groups (phases)
- Scheduling sprints and milestones

Current project has these groups: Design Phase, Development, Testing & QA, Launch.

When the user asks you to make changes, confirm what you understood and describe
the action clearly. Be concise and helpful.`

/* ── Chat message type ──────────────────────────────────────────────── */

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

/* ── Main page ──────────────────────────────────────────────────────── */

export default function SchedulePage() {
  const [tasks, setTasks] = useState<GanttTask[]>(SAMPLE_TASKS)
  const [groups] = useState<GanttGroup[]>(SAMPLE_GROUPS)
  const [markers] = useState<GanttMarker[]>(SAMPLE_MARKERS)
  const [chatOpen, setChatOpen] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "👋 Hi! I'm your project assistant. Describe changes in natural language and I'll update the Gantt chart.\n\nTry: \"Add a new task called 'Code Review' in Development, starting next Monday for 3 days\"\n\nOr: \"Move 'Backend API' to finish by Friday\"",
    },
  ])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const threadIdRef = useRef<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  /* ── Task update handler ────────────────────────────────────────── */

  const handleTaskUpdate = useCallback(
    (taskId: string, updates: Partial<Pick<GanttTask, 'start' | 'end' | 'progress'>>) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
      )
    },
    [],
  )

  /* ── Chat send ──────────────────────────────────────────────────── */

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text) return

    const apiKey = import.meta.env.VITE_TAMBO_API_KEY as string | undefined
    if (!apiKey) {
      const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: text }
      setMessages((prev) => [...prev, userMsg, {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: '⚠️ Tambo API key not configured. Set VITE_TAMBO_API_KEY environment variable.',
      }])
      setInput('')
      return
    }

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsProcessing(true)

    try {
      let assistantText: string

      if (threadIdRef.current) {
        // Continue existing thread
        const msgs = await advanceThread(apiKey, threadIdRef.current, text)
        assistantText = getLastAssistantText(msgs) || 'No response from assistant.'
      } else {
        // First message — create thread with system context
        const fullMessage = `${SYSTEM_PROMPT}\n\n---\n\nUser: ${text}`
        const { threadId, msgs } = await createAndAdvance(apiKey, fullMessage)
        threadIdRef.current = threadId
        assistantText = getLastAssistantText(msgs) || 'No response from assistant.'
      }

      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: 'assistant', content: assistantText },
      ])
    } catch (err) {
      console.error('Tambo API error:', err)
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: `❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        },
      ])
    } finally {
      setIsProcessing(false)
    }
  }, [input])

  /* ── Render ──────────────────────────────────────────────────────── */

  return (
    <TamboSetupProvider>
    <div className="flex h-[calc(100dvh-4rem)] flex-col overflow-hidden">
      {/* ── Gantt area ────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        <div className={`flex-1 overflow-hidden transition-all ${chatOpen ? 'mr-0' : ''}`}>
          <ClientOnly
            fallback={
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Loading Gantt chart...
              </div>
            }
          >
            {() => (
              <GanttChart
                tasks={tasks}
                groups={groups}
                markers={markers}
                view="week"
                onTaskUpdate={handleTaskUpdate}
                onTaskClick={(id) => console.log('clicked', id)}
              />
            )}
          </ClientOnly>
        </div>

        {/* ── Chat panel ──────────────────────────────────────────── */}
        {chatOpen && (
          <div className="flex w-96 flex-col border-l bg-background">
            {/* Chat header */}
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <Bot className="size-5 text-primary" />
              <span className="font-medium">Project Assistant</span>
              <button
                onClick={() => setChatOpen(false)}
                className="ml-auto rounded p-1 hover:bg-muted"
              >
                <PanelLeftClose className="size-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex size-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Bot className="size-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                  {msg.role === 'user' && (
                    <div className="flex size-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <User className="size-4" />
                    </div>
                  )}
                </div>
              ))}
              {isProcessing && (
                <div className="flex gap-2">
                  <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Bot className="size-4" />
                  </div>
                  <div className="rounded-xl bg-muted px-3 py-2 text-sm">
                    <div className="flex gap-1">
                      <span className="animate-pulse">●</span>
                      <span className="animate-pulse [animation-delay:0.2s]">●</span>
                      <span className="animate-pulse [animation-delay:0.4s]">●</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t p-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  sendMessage()
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe changes in natural language..."
                  className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                  disabled={isProcessing}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isProcessing}
                  className="rounded-lg bg-primary px-3 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  <Send className="size-4" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Toggle chat FAB when closed */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-lg hover:bg-primary/90"
        >
          <PanelLeft className="size-4" />
          <span className="text-sm font-medium">Chat</span>
        </button>
      )}
    </div>
    </TamboSetupProvider>
  )
}
