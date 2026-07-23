import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef, useCallback, useMemo } from 'react'
import { Gantt } from '@/components/reui/gantt/gantt'
import { GanttNav, GanttToolbar } from '@/components/reui/gantt/gantt-nav'
import type { GanttEvent, GanttResource } from '@/components/reui/gantt/gantt-types'
import { GanttView } from '@/components/reui/gantt/gantt-view'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Send, Sparkles, MessageSquare } from 'lucide-react'

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
      {id: 'marketing', title: 'Marketing push' },
    ],
  },
]

const initialEvents: GanttEvent[] = [
  // Planning
  { id: 'e1', title: 'Market research', start: new Date('2026-07-21'), end: new Date('2026-07-25'), allDay: true, resourceId: 'research', color: 'var(--color-blue-500)', progress: 80 },
  { id: 'e2', title: 'Gather requirements', start: new Date('2026-07-24'), end: new Date('2026-07-28'), allDay: true, resourceId: 'requirements', color: 'var(--color-blue-500)', progress: 40 },
  { id: 'e3', title: 'Define timeline', start: new Date('2026-07-28'), end: new Date('2026-07-30'), allDay: true, resourceId: 'timeline', color: 'var(--color-blue-500)', progress: 0 },
  // Design
  { id: 'e4', title: 'Wireframes', start: new Date('2026-07-28'), end: new Date('2026-08-01'), allDay: true, resourceId: 'wireframes', color: 'var(--color-purple-500)', progress: 20 },
  { id: 'e5', title: 'UI mockups', start: new Date('2026-08-01'), end: new Date('2026-08-06'), allDay: true, resourceId: 'mockups', color: 'var(--color-purple-500)', progress: 0 },
  { id: 'e6', title: 'Prototype', start: new Date('2026-08-05'), end: new Date('2026-08-08'), allDay: true, resourceId: 'prototype', color: 'var(--color-purple-500)', progress: 0 },
  // Development
  { id: 'e7', title: 'Frontend build', start: new Date('2026-08-04'), end: new Date('2026-08-15'), allDay: true, resourceId: 'frontend', color: 'var(--color-green-500)', progress: 0 },
  { id: 'e8', title: 'Backend API', start: new Date('2026-08-04'), end: new Date('2026-08-14'), allDay: true, resourceId: 'backend', color: 'var(--color-green-500)', progress: 0 },
  { id: 'e9', title: 'AI integration', start: new Date('2026-08-12'), end: new Date('2026-08-18'), allDay: true, resourceId: 'integration', color: 'var(--color-green-500)', progress: 0 },
  // Launch
  { id: 'e10', title: 'QA testing', start: new Date('2026-08-16'), end: new Date('2026-08-20'), allDay: true, resourceId: 'testing', color: 'var(--color-orange-500)', progress: 0 },
  { id: 'e11', title: 'Deployment', start: new Date('2026-08-20'), end: new Date('2026-08-21'), allDay: true, resourceId: 'deploy', color: 'var(--color-red-500)', progress: 0 },
  { id: 'e12', title: 'Marketing push', start: new Date('2026-08-21'), end: new Date('2026-08-28'), allDay: true, resourceId: 'marketing', color: 'var(--color-orange-500)', progress: 0 },
]

/* ── Chat messages type ──────────────────────────────────────────────── */

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

/* ── Main page ───────────────────────────────────────────────────────── */

function SchedulePage() {
  const [events, setEvents] = useState<GanttEvent[]>(initialEvents)
  const [resources] = useState<GanttResource[]>(initialResources)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "👋 Hi! I'm your schedule assistant. Tell me what you need to plan, and I'll build your Gantt chart.\n\nTry something like:\n• \"Add a new task called Review after Wireframes\"\n• \"Move the deployment to August 25\"\n• \"Create a 2-week content calendar\"",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

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

    // Placeholder AI response — will be replaced with real AI later
    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `I received your request: "${userMsg.content}"\n\n🚧 AI integration coming soon! For now, this is a demo of the Gantt chart. Try dragging the bars to reschedule tasks!`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMsg])
      setIsTyping(false)
      scrollToBottom()
    }, 1000)
  }, [input, scrollToBottom])

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

      {/* Main content: Gantt + Chat side by side */}
      <div className="flex flex-1 overflow-hidden">
        {/* Gantt chart — takes remaining space */}
        <div className="flex-1 overflow-auto p-4">
          <Card className="h-full py-0">
            <CardContent className="h-full p-0">
              <Gantt
                defaultEvents={events}
                resources={resources}
                defaultScale="week"
                onEventsChange={setEvents}
                className="h-full w-full"
              >
                <GanttNav />
                <GanttView />
              </Gantt>
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
            <div ref={chatEndRef} />
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
