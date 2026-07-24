"use client"

import { useState, useRef, useCallback, useMemo } from 'react'
import { format, differenceInDays, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'

/* ── Types ──────────────────────────────────────────────────────────── */

export interface GanttTask {
  id: string
  title: string
  start: Date
  end: Date
  progress?: number
  color?: string
  groupId?: string
}

export interface GanttGroup {
  id: string
  title: string
  color?: string
}

/* ── Simple Gantt Chart ─────────────────────────────────────────────── */

interface GanttChartProps {
  tasks: GanttTask[]
  groups?: GanttGroup[]
}

export function GanttChart({ tasks, groups = [] }: GanttChartProps) {
  const [viewStart, setViewStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 0 }))
  const scrollRef = useRef<HTMLDivElement>(null)

  const viewEnd = useMemo(() => addDays(viewStart, 28), [viewStart]) // 4 weeks

  const totalDays = differenceInDays(viewEnd, viewStart)

  const navigate = useCallback((direction: -1 | 1) => {
    setViewStart(prev => addDays(prev, direction * 7))
  }, [])

  const goToday = useCallback(() => {
    setViewStart(startOfWeek(new Date(), { weekStartsOn: 0 }))
  }, [])

  // Group tasks by groupId
  const groupedTasks = useMemo(() => {
    const map = new Map<string, GanttTask[]>()
    for (const task of tasks) {
      const key = task.groupId || '_ungrouped'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(task)
    }
    return map
  }, [tasks])

  // Calculate day columns
  const days = useMemo(() => {
    const result = []
    for (let i = 0; i < totalDays; i++) {
      const date = addDays(viewStart, i)
      const isWeekend = date.getDay() === 0 || date.getDay() === 6
      const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
      result.push({ date, isWeekend, isToday, dayOfMonth: date.getDate() })
    }
    return result
  }, [viewStart, totalDays])

  const dayWidth = 100 / totalDays // percentage

  const getTaskPosition = (task: GanttTask) => {
    const taskStart = Math.max(0, differenceInDays(task.start, viewStart))
    const taskEnd = Math.min(totalDays, differenceInDays(task.end, viewStart) + 1)
    if (taskStart >= totalDays || taskEnd <= 0) return null
    return {
      left: `${(taskStart / totalDays) * 100}%`,
      width: `${((taskEnd - taskStart) / totalDays) * 100}%`,
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b px-4 py-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={goToday} className="gap-1.5">
          <Calendar className="size-3.5" />
          Today
        </Button>
        <Button variant="ghost" size="icon" onClick={() => navigate(1)}>
          <ChevronRight className="size-4" />
        </Button>
        <span className="ml-2 text-sm font-medium text-muted-foreground">
          {format(viewStart, 'MMM d')} — {format(addDays(viewEnd, -1), 'MMM d, yyyy')}
        </span>
      </div>

      {/* Chart area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Task names sidebar */}
        <div className="w-48 shrink-0 border-r overflow-y-auto">
          {/* Header spacer */}
          <div className="h-10 border-b bg-background" />
          {groups.length > 0 ? (
            groups.map(group => (
              <div key={group.id}>
                <div className="h-8 border-b bg-muted/30 px-3 flex items-center text-xs font-semibold text-muted-foreground">
                  {group.title}
                </div>
                {(groupedTasks.get(group.id) || []).map(task => (
                  <div key={task.id} className="h-10 border-b px-3 flex items-center text-sm truncate">
                    {task.title}
                  </div>
                ))}
              </div>
            ))
          ) : (
            tasks.map(task => (
              <div key={task.id} className="h-10 border-b px-3 flex items-center text-sm truncate">
                {task.title}
              </div>
            ))
          )}
        </div>

        {/* Timeline */}
        <div ref={scrollRef} className="flex-1 overflow-auto">
          {/* Day headers */}
          <div className="sticky top-0 z-10 flex border-b bg-background" style={{ minWidth: `${totalDays * 36}px` }}>
            {days.map((day, i) => (
              <div
                key={i}
                className={`h-10 shrink-0 border-r flex flex-col items-center justify-center text-xs ${
                  day.isToday ? 'bg-primary/10 font-bold text-primary' : ''
                } ${day.isWeekend ? 'bg-muted/20' : ''}`}
                style={{ width: '36px' }}
              >
                <span className="text-[10px] text-muted-foreground">{format(day.date, 'EEE')}</span>
                <span>{day.dayOfMonth}</span>
              </div>
            ))}
          </div>

          {/* Task rows */}
          {groups.length > 0 ? (
            groups.map(group => (
              <div key={group.id}>
                {/* Group row */}
                <div className="h-8 border-b bg-muted/30 relative" style={{ minWidth: `${totalDays * 36}px` }}>
                  {days.map((day, i) => (
                    <div key={i} className={`absolute top-0 bottom-0 border-r ${day.isWeekend ? 'bg-muted/10' : ''}`} style={{ left: `${i * 36}px`, width: '36px' }} />
                  ))}
                </div>
                {/* Group tasks */}
                {(groupedTasks.get(group.id) || []).map(task => {
                  const pos = getTaskPosition(task)
                  return (
                    <div key={task.id} className="h-10 border-b relative" style={{ minWidth: `${totalDays * 36}px` }}>
                      {days.map((day, i) => (
                        <div key={i} className={`absolute top-0 bottom-0 border-r ${day.isWeekend ? 'bg-muted/10' : ''} ${day.isToday ? 'bg-primary/5' : ''}`} style={{ left: `${i * 36}px`, width: '36px' }} />
                      ))}
                      {pos && (
                        <div
                          className="absolute top-2 h-6 rounded-md flex items-center px-2 text-xs font-medium text-white overflow-hidden"
                          style={{
                            left: `calc(${pos.left} + 2px)`,
                            width: `calc(${pos.width} - 4px)`,
                            backgroundColor: task.color || 'var(--color-primary)',
                          }}
                        >
                          {task.progress !== undefined && (
                            <div
                              className="absolute left-0 top-0 bottom-0 bg-white/20"
                              style={{ width: `${task.progress}%` }}
                            />
                          )}
                          <span className="relative z-10 truncate">{task.title}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))
          ) : (
            tasks.map(task => {
              const pos = getTaskPosition(task)
              return (
                <div key={task.id} className="h-10 border-b relative" style={{ minWidth: `${totalDays * 36}px` }}>
                  {days.map((day, i) => (
                    <div key={i} className={`absolute top-0 bottom-0 border-r ${day.isWeekend ? 'bg-muted/10' : ''} ${day.isToday ? 'bg-primary/5' : ''}`} style={{ left: `${i * 36}px`, width: '36px' }} />
                  ))}
                  {pos && (
                    <div
                      className="absolute top-2 h-6 rounded-md flex items-center px-2 text-xs font-medium text-white overflow-hidden"
                      style={{
                        left: `calc(${pos.left} + 2px)`,
                        width: `calc(${pos.width} - 4px)`,
                        backgroundColor: task.color || 'var(--color-primary)',
                      }}
                    >
                      {task.progress !== undefined && (
                        <div
                          className="absolute left-0 top-0 bottom-0 bg-white/20"
                          style={{ width: `${task.progress}%` }}
                        />
                      )}
                      <span className="relative z-10 truncate">{task.title}</span>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
