"use client"

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import {
  Calendar, ChevronRight, Plus, ZoomIn, ZoomOut,
  CheckCircle2, Clock, BarChart3, Circle,
} from 'lucide-react'
import type { GanttTask, GanttView, GanttChartProps } from './types'
import {
  getDaysBetween, addDays, subDays,
  generateTimeHeaders, getCellDays, getTotalDays,
  formatTaskBar, formatDuration, darkenColor,
} from './utils'

/* ── Defaults ───────────────────────────────────────────────────────── */

const ROW_HEIGHT = 44
const HEADER_HEIGHT = 48
const SIDEBAR_WIDTH = 280
const CHECKBOX_COL_WIDTH = 28

const PX_PER_DAY: Record<GanttView, number> = {
  day: 50,
  week: 14,
  month: 4,
}

/* ── Component ──────────────────────────────────────────────────────── */

export function GanttChart({
  tasks,
  groups,
  markers = [],
  view: initialView = 'week',
  onTaskUpdate,
  onTaskClick,
  onAddTask,
  readOnly = false,
  className,
}: GanttChartProps) {
  const [view, setView] = useState<GanttView>(initialView)
  const [pxPerDay, setPxPerDay] = useState(PX_PER_DAY[initialView])
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [checkedTasks, setCheckedTasks] = useState<Set<string>>(new Set())
  const [dragState, setDragState] = useState<{
    taskId: string
    mode: 'move' | 'resize-left' | 'resize-right'
    startX: number
    originalStart: Date
    originalEnd: Date
  } | null>(null)

  const timelineRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)

  /* ── Derived data ──────────────────────────────────────────────── */

  const visibleTasks = useMemo(() => {
    const visible: GanttTask[] = []
    for (const group of groups) {
      if (collapsedGroups.has(group.id)) continue
      for (const task of tasks) {
        if (task.groupId === group.id) visible.push(task)
      }
    }
    return visible
  }, [tasks, groups, collapsedGroups])

  const dateRange = useMemo(() => {
    if (tasks.length === 0) {
      const now = new Date()
      return { start: subDays(now, 7), end: addDays(now, 60) }
    }
    let earliest = tasks[0].start
    let latest = tasks[0].end
    for (const t of tasks) {
      if (t.start < earliest) earliest = t.start
      if (t.end > latest) latest = t.end
    }
    return { start: subDays(earliest, 7), end: addDays(latest, 14) }
  }, [tasks])

  const totalDays = getTotalDays(dateRange.start, dateRange.end)
  const timelineWidth = totalDays * pxPerDay

  const timeHeaders = useMemo(
    () => generateTimeHeaders(view, dateRange.start, dateRange.end),
    [view, dateRange.start, dateRange.end],
  )

  /* ── Toggle group collapse ─────────────────────────────────────── */

  const toggleGroup = useCallback((groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }, [])

  /* ── Toggle task check ─────────────────────────────────────────── */

  const toggleCheck = useCallback((taskId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setCheckedTasks((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      return next
    })
  }, [])

  /* ── View change ───────────────────────────────────────────────── */

  const changeView = useCallback((newView: GanttView) => {
    setView(newView)
    setPxPerDay(PX_PER_DAY[newView])
  }, [])

  /* ── Zoom ──────────────────────────────────────────────────────── */

  const zoomIn = useCallback(() => {
    setPxPerDay((p) => Math.min(p * 1.5, 200))
  }, [])

  const zoomOut = useCallback(() => {
    setPxPerDay((p) => Math.max(p / 1.5, 2))
  }, [])

  /* ── Scroll to today ───────────────────────────────────────────── */

  const scrollToToday = useCallback(() => {
    if (!timelineRef.current) return
    const today = new Date()
    const daysFromStart = getDaysBetween(dateRange.start, today)
    const x = daysFromStart * pxPerDay - timelineRef.current.clientWidth / 2
    timelineRef.current.scrollLeft = Math.max(0, x)
  }, [dateRange.start, pxPerDay])

  /* ── Sync vertical scroll between sidebar and timeline ─────────── */

  const handleTimelineScroll = useCallback(() => {
    if (timelineRef.current && sidebarRef.current) {
      sidebarRef.current.scrollTop = timelineRef.current.scrollTop
    }
  }, [])

  const handleSidebarScroll = useCallback(() => {
    if (timelineRef.current && sidebarRef.current) {
      timelineRef.current.scrollTop = sidebarRef.current.scrollTop
    }
  }, [])

  /* ── Drag handling ─────────────────────────────────────────────── */

  const handleBarMouseDown = useCallback(
    (e: React.MouseEvent, taskId: string, mode: 'move' | 'resize-left' | 'resize-right') => {
      if (readOnly) return
      e.preventDefault()
      e.stopPropagation()
      const task = tasks.find((t) => t.id === taskId)
      if (!task) return
      setDragState({
        taskId,
        mode,
        startX: e.clientX,
        originalStart: new Date(task.start),
        originalEnd: new Date(task.end),
      })
    },
    [readOnly, tasks],
  )

  useEffect(() => {
    if (!dragState) return

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragState.startX
      const daysDelta = Math.round(dx / pxPerDay)

      if (daysDelta === 0) return

      let newStart = new Date(dragState.originalStart)
      let newEnd = new Date(dragState.originalEnd)

      if (dragState.mode === 'move') {
        newStart = addDays(dragState.originalStart, daysDelta)
        newEnd = addDays(dragState.originalEnd, daysDelta)
      } else if (dragState.mode === 'resize-left') {
        newStart = addDays(dragState.originalStart, daysDelta)
        if (newStart >= newEnd) newStart = addDays(newEnd, -1)
      } else {
        newEnd = addDays(dragState.originalEnd, daysDelta)
        if (newEnd <= newStart) newEnd = addDays(newStart, 1)
      }

      onTaskUpdate?.(dragState.taskId, { start: newStart, end: newEnd })
    }

    const handleMouseUp = () => {
      setDragState(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragState, pxPerDay, onTaskUpdate])

  /* ── Stats ─────────────────────────────────────────────────────── */

  const completedCount = tasks.filter((t) => t.progress >= 100).length
  const inProgressCount = tasks.filter((t) => t.progress > 0 && t.progress < 100).length

  /* ── Render ────────────────────────────────────────────────────── */

  return (
    <div className={`flex h-full flex-col bg-background text-sm ${className ?? ''}`}>
      {/* ── Toolbar ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b px-4 py-2">
        {/* View switcher */}
        <div className="flex rounded-md border">
          {(['day', 'week', 'month'] as GanttView[]).map((v) => (
            <button
              key={v}
              onClick={() => changeView(v)}
              className={`px-3 py-1 text-xs font-medium capitalize transition-colors ${
                view === v
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-1">
          <button onClick={zoomOut} className="rounded p-1 hover:bg-muted" title="Zoom out">
            <ZoomOut className="size-4" />
          </button>
          <span className="w-10 text-center text-xs text-muted-foreground tabular-nums">
            {Math.round(pxPerDay)}px
          </span>
          <button onClick={zoomIn} className="rounded p-1 hover:bg-muted" title="Zoom in">
            <ZoomIn className="size-4" />
          </button>
        </div>

        <div className="h-4 w-px bg-border" />

        {/* Today */}
        <button
          onClick={scrollToToday}
          className="flex items-center gap-1.5 rounded-md border px-3 py-1 text-xs font-medium hover:bg-muted"
        >
          <Calendar className="size-3.5" />
          Today
        </button>

        <div className="flex-1" />

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <BarChart3 className="size-3.5" />
            <span>{tasks.length} tasks</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="size-3.5 text-green-600" />
            <span>{completedCount} done</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="size-3.5 text-blue-600" />
            <span>{inProgressCount} in progress</span>
          </div>
        </div>
      </div>

      {/* ── Split panels ─────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left sidebar ───────────────────────────────────────── */}
        <div
          ref={sidebarRef}
          className="flex-shrink-0 overflow-hidden border-r"
          style={{ width: SIDEBAR_WIDTH }}
          onScroll={handleSidebarScroll}
        >
          {/* Header */}
          <div
            className="flex items-center border-b bg-muted/50 px-3 font-medium text-muted-foreground"
            style={{ height: HEADER_HEIGHT }}
          >
            <div style={{ width: CHECKBOX_COL_WIDTH }} />
            <span className="text-xs">Task</span>
            <div className="ml-auto flex items-center gap-3 text-xs">
              <span>Duration</span>
            </div>
          </div>

          {/* Task rows */}
          <div className="overflow-y-auto" style={{ height: `calc(100% - ${HEADER_HEIGHT}px)` }}>
            {groups.map((group) => {
              const isCollapsed = collapsedGroups.has(group.id)
              const groupTasks = tasks.filter((t) => t.groupId === group.id)
              return (
                <div key={group.id}>
                  {/* Group header */}
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="flex w-full items-center gap-2 border-b bg-muted/30 px-3 font-medium hover:bg-muted/50"
                    style={{ height: ROW_HEIGHT }}
                  >
                    <ChevronRight
                      className={`size-3.5 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                    />
                    <span className="truncate text-xs font-semibold">{group.title}</span>
                    <span className="ml-auto rounded bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {groupTasks.length}
                    </span>
                  </button>

                  {/* Tasks (hidden when collapsed) */}
                  {!isCollapsed &&
                    groupTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => {
                          setSelectedTask(task.id)
                          onTaskClick?.(task.id)
                        }}
                        className={`flex cursor-pointer items-center gap-1.5 border-b px-3 transition-colors hover:bg-muted/30 ${
                          selectedTask === task.id ? 'bg-primary/5' : ''
                        }`}
                        style={{ height: ROW_HEIGHT }}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={(e) => toggleCheck(task.id, e)}
                          className={`flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded border transition-colors ${
                            checkedTasks.has(task.id)
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border hover:border-primary/60'
                          }`}
                        >
                          {checkedTasks.has(task.id) ? (
                            <svg
                              className="h-3 w-3"
                              viewBox="0 0 12 12"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="2 6 5 9 10 3" />
                            </svg>
                          ) : (
                            <Circle className="h-3 w-3 text-border" />
                          )}
                        </button>

                        {/* Color dot */}
                        <div
                          className="size-2.5 flex-shrink-0 rounded-full"
                          style={{ backgroundColor: task.color }}
                        />

                        {/* Title */}
                        <span className="min-w-0 flex-1 truncate text-xs leading-tight">
                          {task.title}
                        </span>

                        {/* Duration */}
                        <span className="flex-shrink-0 text-[11px] tabular-nums text-muted-foreground">
                          {formatDuration(task.start, task.end)}
                        </span>

                        {/* Assignee avatar */}
                        {task.assignee && (
                          <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                            {task.assignee.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )
            })}

            {/* Add task button */}
            {onAddTask && (
              <button
                onClick={onAddTask}
                className="flex w-full items-center gap-2 border-b px-3 text-muted-foreground hover:bg-muted/30"
                style={{ height: ROW_HEIGHT }}
              >
                <Plus className="size-3.5" />
                <span className="text-xs">Add task</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Right timeline ─────────────────────────────────────── */}
        <div
          ref={timelineRef}
          className="flex-1 overflow-auto"
          onScroll={handleTimelineScroll}
        >
          <div style={{ width: timelineWidth, minHeight: '100%' }}>
            {/* Timeline header */}
            <div
              className="sticky top-0 z-20 flex border-b bg-muted/50"
              style={{ height: HEADER_HEIGHT }}
            >
              {timeHeaders.map((cell, i) => {
                const cellDays = getCellDays(view)
                const cellWidth = cellDays * pxPerDay
                return (
                  <div
                    key={i}
                    className={`flex flex-shrink-0 flex-col items-center justify-center border-r text-xs ${
                      cell.isToday ? 'bg-primary/10 font-medium' : ''
                    } ${cell.isWeekend ? 'bg-muted/30' : ''}`}
                    style={{ width: cellWidth }}
                  >
                    <span className={cell.isToday ? 'text-primary' : ''}>{cell.label}</span>
                    {cell.subLabel && (
                      <span className="text-[10px] text-muted-foreground">{cell.subLabel}</span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Grid + bars */}
            <div className="relative" style={{ height: visibleTasks.length * ROW_HEIGHT + 200 }}>
              {/* Horizontal grid lines */}
              {visibleTasks.map((_, i) => (
                <div
                  key={i}
                  className="border-b"
                  style={{ height: ROW_HEIGHT, borderColor: 'var(--border)' }}
                />
              ))}

              {/* Vertical grid lines */}
              {timeHeaders.map((cell, i) => {
                const left = getDaysBetween(dateRange.start, cell.date) * pxPerDay
                return (
                  <div
                    key={`v-${i}`}
                    className="absolute top-0 bottom-0 border-r"
                    style={{
                      left,
                      width: 0,
                      borderColor: cell.isToday ? 'transparent' : 'var(--border)',
                    }}
                  />
                )
              })}

              {/* Today line */}
              {(() => {
                const today = new Date()
                const daysFromStart = getDaysBetween(dateRange.start, today)
                if (daysFromStart < 0 || daysFromStart > totalDays) return null
                const left = daysFromStart * pxPerDay
                return (
                  <div
                    className="absolute top-0 bottom-0 z-10 w-px bg-red-500"
                    style={{ left }}
                  >
                    <div className="absolute -left-4 -top-0 rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                      Today
                    </div>
                  </div>
                )
              })()}

              {/* Markers */}
              {markers.map((marker) => {
                const daysFromStart = getDaysBetween(dateRange.start, marker.date)
                if (daysFromStart < 0 || daysFromStart > totalDays) return null
                const left = daysFromStart * pxPerDay
                return (
                  <div
                    key={marker.id}
                    className="absolute top-0 bottom-0 z-5 border-l border-dashed"
                    style={{ left, borderColor: marker.color }}
                  >
                    <div
                      className="absolute -left-8 -top-0 rounded px-1.5 py-0.5 text-[10px] font-medium text-white shadow-sm"
                      style={{ backgroundColor: marker.color }}
                    >
                      {marker.label}
                    </div>
                  </div>
                )
              })}

              {/* Task bars */}
              {visibleTasks.map((task, rowIndex) => {
                const { left, width } = formatTaskBar(task.start, task.end, dateRange.start, pxPerDay)
                const top = rowIndex * ROW_HEIGHT + 8
                const barHeight = ROW_HEIGHT - 16
                const progressWidth = (task.progress / 100) * width

                return (
                  <div
                    key={task.id}
                    className={`absolute rounded-md transition-shadow ${
                      selectedTask === task.id ? 'ring-2 ring-primary ring-offset-1' : ''
                    } ${!readOnly ? 'cursor-grab active:cursor-grabbing' : ''}`}
                    style={{
                      left,
                      top,
                      width: Math.max(width, 20),
                      height: barHeight,
                      backgroundColor: task.color,
                    }}
                    onMouseDown={(e) => handleBarMouseDown(e, task.id, 'move')}
                  >
                    {/* Progress fill */}
                    <div
                      className="absolute inset-y-0 left-0 rounded-l-md opacity-40"
                      style={{
                        width: Math.max(progressWidth, 0),
                        backgroundColor: darkenColor(task.color, 60),
                      }}
                    />

                    {/* Title inside bar */}
                    {width > 60 && (
                      <div className="pointer-events-none absolute inset-0 flex items-center px-2">
                        <span className="truncate text-xs font-medium text-white drop-shadow-sm">
                          {task.title}
                        </span>
                      </div>
                    )}

                    {/* Progress badge */}
                    {width > 40 && task.progress > 0 && (
                      <div className="pointer-events-none absolute bottom-0.5 right-1 text-[9px] font-bold text-white/80 drop-shadow-sm">
                        {task.progress}%
                      </div>
                    )}

                    {/* Resize handles */}
                    {!readOnly && (
                      <>
                        <div
                          className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize"
                          onMouseDown={(e) => handleBarMouseDown(e, task.id, 'resize-left')}
                        />
                        <div
                          className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize"
                          onMouseDown={(e) => handleBarMouseDown(e, task.id, 'resize-right')}
                        />
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
