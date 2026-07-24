import { createFileRoute } from '@tanstack/react-router'
import { useState, useCallback, useMemo } from 'react'
import { ClientOnly } from '@/components/client-only'
import { Gantt } from '@/components/reui/gantt/gantt'
import { GanttNav, GanttToolbar } from '@/components/reui/gantt/gantt-nav'
import type { GanttEvent, GanttResource } from '@/components/reui/gantt/gantt-types'
import type { GanttColumn } from '@/components/reui/gantt/gantt'
import { GanttView } from '@/components/reui/gantt/gantt-view'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Send, Sparkles, Clock, Users, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'

export const Route = createFileRoute('/{-$locale}/schedule')({
  component: SchedulePage,
})

/* ── Sample data ─────────────────────────────────────────────────────── */

const initialResources: GanttResource[] = [
  {
    id: 'planning',
    title: '📋 Planning',
    children: [
      { id: 'research', title: 'Market research' },
      { id: 'requirements', title: 'Gather requirements' },
      { id: 'timeline', title: 'Define timeline' },
    ],
  },
  {
    id: 'design',
    title: '🎨 Design',
    children: [
      { id: 'wireframes', title: 'Wireframes' },
      { id: 'mockups', title: 'UI mockups' },
      { id: 'prototype', title: 'Prototype' },
    ],
  },
  {
    id: 'development',
    title: '💻 Development',
    children: [
      { id: 'frontend', title: 'Frontend build' },
      { id: 'backend', title: 'Backend API' },
      { id: 'integration', title: 'AI integration' },
    ],
  },
  {
    id: 'launch',
    title: '🚀 Launch',
    children: [
      { id: 'testing', title: 'QA testing' },
      { id: 'deploy', title: 'Deployment' },
      { id: 'marketing', title: 'Marketing push' },
    ],
  },
]

const initialEvents: GanttEvent[] = [
  // Planning
  { id: 'e1', title: 'Market research', start: new Date('2026-07-21'), end: new Date('2026-07-25'), allDay: true, resourceId: 'research', color: '#3b82f6', progress: 80 },
  { id: 'e2', title: 'Gather requirements', start: new Date('2026-07-24'), end: new Date('2026-07-28'), allDay: true, resourceId: 'requirements', color: '#3b82f6', progress: 40 },
  { id: 'e3', title: 'Define timeline', start: new Date('2026-07-28'), end: new Date('2026-07-30'), allDay: true, resourceId: 'timeline', color: '#3b82f6', progress: 0 },
  // Design
  { id: 'e4', title: 'Wireframes', start: new Date('2026-07-28'), end: new Date('2026-08-01'), allDay: true, resourceId: 'wireframes', color: '#a855f7', progress: 20 },
  { id: 'e5', title: 'UI mockups', start: new Date('2026-08-01'), end: new Date('2026-08-06'), allDay: true, resourceId: 'mockups', color: '#a855f7', progress: 0 },
  { id: 'e6', title: 'Prototype', start: new Date('2026-08-05'), end: new Date('2026-08-08'), allDay: true, resourceId: 'prototype', color: '#a855f7', progress: 0 },
  // Development
  { id: 'e7', title: 'Frontend build', start: new Date('2026-08-04'), end: new Date('2026-08-15'), allDay: true, resourceId: 'frontend', color: '#22c55e', progress: 0 },
  { id: 'e8', title: 'Backend API', start: new Date('2026-08-04'), end: new Date('2026-08-14'), allDay: true, resourceId: 'backend', color: '#22c55e', progress: 0 },
  { id: 'e9', title: 'AI integration', start: new Date('2026-08-12'), end: new Date('2026-08-18'), allDay: true, resourceId: 'integration', color: '#22c55e', progress: 0 },
  // Launch
  { id: 'e10', title: 'QA testing', start: new Date('2026-08-16'), end: new Date('2026-08-20'), allDay: true, resourceId: 'testing', color: '#f97316', progress: 0 },
  { id: 'e11', title: 'Deployment', start: new Date('2026-08-20'), end: new Date('2026-08-21'), allDay: true, resourceId: 'deploy', color: '#ef4444', progress: 0 },
  { id: 'e12', title: 'Marketing push', start: new Date('2026-08-21'), end: new Date('2026-08-28'), allDay: true, resourceId: 'marketing', color: '#f97316', progress: 0 },
]

/* ── Tree columns ────────────────────────────────────────────────────── */

const treeColumns: GanttColumn[] = []

/* ── Chat messages type ──────────────────────────────────────────────── */

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

/* ── Stats sidebar ───────────────────────────────────────────────────── */

function StatsPanel({ events }: { events: GanttEvent[] }) {
  const totalTasks = events.length
  const completed = events.filter(e => (e.progress ?? 0) >= 100).length
  const inProgress = events.filter(e => (e.progress ?? 0) > 0 && (e.progress ?? 0) < 100).length
  const avgProgress = totalTasks > 0 ? Math.round(events.reduce((sum, e) => sum + (e.progress ?? 0), 0) / totalTasks) : 0

  return (
    <div className="flex gap-4 border-b px-4 py-2 text-xs">
      <div className="flex items-center gap-1.5">
        <Users className="size-3.5 text-muted-foreground" />
        <span className="text-muted-foreground">Tasks:</span>
        <span className="font-medium">{totalTasks}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Clock className="size-3.5 text-muted-foreground" />
        <span className="text-muted-foreground">In progress:</span>
        <span className="font-medium">{inProgress}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <CheckCircle2 className="size-3.5 text-muted-foreground" />
        <span className="text-muted-foreground">Done:</span>
        <span className="font-medium">{completed}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground">Avg progress:</span>
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary" style={{ width: `${avgProgress}%` }} />
        </div>
        <span className="font-medium">{avgProgress}%</span>
      </div>
    </div>
  )
}

/* ── Main page ───────────────────────────────────────────────────────── */

function SchedulePage() {
  const [events, setEvents] = useState<GanttEvent[]>(initialEvents)
  const [resources] = useState<GanttResource[]>(initialResources)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "👋 Hi! I'm your schedule assistant. Tell me what you need to plan, and I'll build your Gantt chart.\n\nTry something like:\n• \"Add a new task called Review after Wireframes\"\n• \"Move the deployment to August 25\"\n• \"Create a 2-week content calendar\"\n\n💡 You can drag bars to reschedule, resize from edges, and zoom with the control.",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const handleSend = useCallback(async () => {
    if (!input.trim()) return

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `I received your request: "${userMsg.content}"\n\n🚧 AI integration coming soon! For now, try:\n• Dragging bars to reschedule\n• Resizing from edges\n• Zooming with the floating control\n• Clicking scale buttons (Day/Week/Month/Quarter/Year)`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMsg])
      setIsTyping(false)
    }, 1000)
  }, [input])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  const quickActions = useMemo(
    () => [
      'Add a task called "Review" after "Wireframes"',
      'Move deployment to Aug 25',
      'Create a 2-week content plan',
      'Show me the critical path',
    ],
    [],
  )

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <Sparkles className="size-5 text-primary" />
        <h1 className="text-lg font-semibold">ScheduleChat</h1>
        <span className="text-sm text-muted-foreground">— Chat with your schedule</span>
      </header>

      {/* Stats bar */}
      <ClientOnly fallback={null}>
        {() => <StatsPanel events={events} />}
      </ClientOnly>

      {/* Main content: Gantt + Chat side by side */}
      <div className="flex flex-1 overflow-hidden">
        {/* Gantt chart — takes remaining space */}
        <div className="flex-1 overflow-hidden p-4">
          <Card className="h-full py-0">
            <CardContent className="h-full p-0">
              <ClientOnly
                fallback={
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <div className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                      <p className="text-sm text-muted-foreground">Loading Gantt chart…</p>
                    </div>
                  </div>
                }
              >
                {() => (
                  <Gantt
                    defaultEvents={events}
                    resources={resources}
                    defaultScale="week"
                    scrollbars="native"
                    onEventsChange={setEvents}
                    rowCheckboxes={true}
                    zoomControl={true}
                    offscreenIndicators={true}
                    infiniteScroll={true}
                    summaryBars={true}
                    barLabel="auto"
                    nowIndicator={true}
                    className="h-full w-full"
                  >
                    <GanttNav />
                    <GanttToolbar />
                    <GanttView />
                  </Gantt>
                )}
              </ClientOnly>
            </CardContent>
          </Card>
        </div>

        {/* Chat panel — fixed width on the right */}
        <div className="flex w-[380px] flex-col border-l">
          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {msg.content.split('\n').map((line, i) => (
                    <span key={i}>
                      {line}
                      {i < msg.content.split('\n').length - 1 && <br />}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-muted px-4 py-3 text-sm">
                  <span className="animate-pulse">Thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="border-t px-4 py-2">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {quickActions.map((action) => (
                <button
                  key={action}
                  onClick={() => setInput(action)}
                  className="whitespace-nowrap rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your schedule..."
                className="flex-1"
              />
              <Button onClick={handleSend} disabled={!input.trim() || isTyping} size="icon">
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
