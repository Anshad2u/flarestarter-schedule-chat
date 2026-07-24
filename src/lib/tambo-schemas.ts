import { z } from 'zod'

/* ── Tambo Gantt Schema ─────────────────────────────────────────────── */

const ganttTaskSchema = z.object({
  id: z.string().describe('Unique task identifier'),
  title: z.string().describe('Task name'),
  start: z.string().describe('Start date as ISO string (YYYY-MM-DD)'),
  end: z.string().describe('End date as ISO string (YYYY-MM-DD)'),
  progress: z.number().min(0).max(100).describe('Completion percentage 0-100'),
  color: z.string().describe('CSS hex color for the bar (e.g. #3b82f6)'),
  groupId: z.string().describe('ID of the group this task belongs to'),
  assignee: z.string().optional().describe('Person assigned to this task'),
})

const ganttGroupSchema = z.object({
  id: z.string().describe('Unique group identifier'),
  title: z.string().describe('Group name'),
  collapsed: z.boolean().describe('Whether the group is collapsed'),
})

export const ganttChartPropsSchema = z.object({
  title: z.string().describe('Title of the Gantt chart (e.g. "Q3 Product Roadmap")'),
  tasks: z.array(ganttTaskSchema).describe('List of tasks to display'),
  groups: z.array(ganttGroupSchema).describe('Task groups for organization'),
})

export type GanttChartProps = z.infer<typeof ganttChartPropsSchema>
export type GanttTaskInput = z.infer<typeof ganttTaskSchema>
export type GanttGroupInput = z.infer<typeof ganttGroupSchema>
