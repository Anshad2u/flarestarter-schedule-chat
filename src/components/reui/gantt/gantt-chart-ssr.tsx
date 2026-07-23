"use client"

import { useState, useCallback } from 'react'
import { Gantt } from '@/components/reui/gantt/gantt'
import { GanttNav } from '@/components/reui/gantt/gantt-nav'
import type { GanttEvent, GanttResource } from '@/components/reui/gantt/gantt-types'
import { GanttView } from '@/components/reui/gantt/gantt-view'

interface GanttChartProps {
  defaultEvents: GanttEvent[]
  resources: GanttResource[]
  defaultScale?: string
  onEventsChange: (events: GanttEvent[]) => void
}

export default function GanttChart({
  defaultEvents,
  resources,
  defaultScale = 'week',
  onEventsChange,
}: GanttChartProps) {
  const [events, setEvents] = useState<GanttEvent[]>(defaultEvents)

  const handleChange = useCallback(
    (newEvents: GanttEvent[]) => {
      setEvents(newEvents)
      onEventsChange(newEvents)
    },
    [onEventsChange],
  )

  return (
    <div className="h-full w-full">
      <Gantt
        defaultEvents={events}
        resources={resources}
        defaultScale={defaultScale as any}
        onEventsChange={handleChange}
        className="h-full w-full"
      >
        <GanttNav />
        <GanttView />
      </Gantt>
    </div>
  )
}
