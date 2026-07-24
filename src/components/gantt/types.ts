export interface GanttTask {
  id: string;
  title: string;
  start: Date;
  end: Date;
  progress: number; // 0-100
  color: string;
  groupId: string;
  assignee?: string;
  dependencies?: string[];
}

export interface GanttGroup {
  id: string;
  title: string;
  collapsed: boolean;
}

export type GanttView = 'day' | 'week' | 'month';

export interface GanttMarker {
  id: string;
  date: Date;
  label: string;
  color: string;
}

export interface TimeHeaderCell {
  label: string;
  date: Date;
  isToday: boolean;
  isWeekend?: boolean;
  subLabel?: string;
}

export interface GanttChartProps {
  tasks: GanttTask[];
  groups: GanttGroup[];
  markers?: GanttMarker[];
  view?: GanttView;
  onTaskUpdate?: (taskId: string, updates: Partial<Pick<GanttTask, 'start' | 'end' | 'progress'>>) => void;
  onTaskClick?: (taskId: string) => void;
  onAddTask?: () => void;
  readOnly?: boolean;
  className?: string;
}
