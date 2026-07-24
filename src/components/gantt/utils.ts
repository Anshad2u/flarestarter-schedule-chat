import type { GanttView, TimeHeaderCell } from './types';

/** Number of whole days between two dates (exclusive of end). */
export function getDaysBetween(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

/** Add n days to a date, returning a new Date. */
export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/** Subtract n days from a date, returning a new Date. */
export function subDays(date: Date, n: number): Date {
  return addDays(date, -n);
}

/** Check if two dates represent the same calendar day. */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Check if a date is today. */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/** ISO week number. */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** Month name (short form). */
export function getMonthName(date: Date): string {
  return date.toLocaleString('en-US', { month: 'short' });
}

/** Month name (long form). */
export function getMonthNameLong(date: Date): string {
  return date.toLocaleString('en-US', { month: 'long' });
}

/** Day-of-week short name. */
export function getDayName(date: Date): string {
  return date.toLocaleString('en-US', { weekday: 'short' });
}

/** Start of week (Monday). */
export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday = 1
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Start of month. */
export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** Format a task bar's left offset and width in pixels given the viewport date range. */
export function formatTaskBar(
  taskStart: Date,
  taskEnd: Date,
  viewportStart: Date,
  pxPerDay: number,
): { left: number; width: number } {
  const daysFromStart = getDaysBetween(viewportStart, taskStart);
  const durationDays = Math.max(getDaysBetween(taskStart, taskEnd), 1);
  return {
    left: daysFromStart * pxPerDay,
    width: durationDays * pxPerDay,
  };
}

/** Format duration in human-readable form. */
export function formatDuration(start: Date, end: Date): string {
  const days = getDaysBetween(start, end);
  if (days === 0) return '1d';
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  const remainingDays = days % 7;
  if (remainingDays === 0) return `${weeks}w`;
  return `${weeks}w ${remainingDays}d`;
}

/** Generate timeline header cells based on the view. */
export function generateTimeHeaders(
  view: GanttView,
  startDate: Date,
  endDate: Date,
): TimeHeaderCell[] {
  const cells: TimeHeaderCell[] = [];
  const today = new Date();

  if (view === 'day') {
    let current = new Date(startDate);
    current.setHours(0, 0, 0, 0);
    while (current <= endDate) {
      const weekend = current.getDay() === 0 || current.getDay() === 6;
      cells.push({
        label: `${getDayName(current)} ${current.getDate()}`,
        date: new Date(current),
        isToday: isSameDay(current, today),
        isWeekend: weekend,
      });
      current = addDays(current, 1);
    }
  } else if (view === 'week') {
    let current = startOfWeek(startDate);
    while (current <= endDate) {
      cells.push({
        label: `${getMonthName(current)} ${current.getDate()}`,
        date: new Date(current),
        isToday: isSameDay(current, today) ||
          (today > current && today < addDays(current, 7)),
        subLabel: `W${getWeekNumber(current)}`,
      });
      current = addDays(current, 7);
    }
  } else {
    // month view
    let current = startOfMonth(startDate);
    const endMonth = startOfMonth(endDate);
    endMonth.setMonth(endMonth.getMonth() + 1);
    while (current < endMonth) {
      cells.push({
        label: `${getMonthNameLong(current)} ${current.getFullYear()}`,
        date: new Date(current),
        isToday:
          today.getMonth() === current.getMonth() &&
          today.getFullYear() === current.getFullYear(),
      });
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }
  }

  return cells;
}

/** Number of days each header cell spans. */
export function getCellDays(view: GanttView): number {
  switch (view) {
    case 'day':
      return 1;
    case 'week':
      return 7;
    case 'month':
      return 30;
  }
}

/** Get total days in a given date range. */
export function getTotalDays(start: Date, end: Date): number {
  return Math.max(getDaysBetween(start, end), 1);
}

/** Clamp a value between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Darken a hex color by a percentage. */
export function darkenColor(hex: string, amount: number): string {
  const clean = hex.replace('#', '');
  const r = Math.max(0, parseInt(clean.substring(0, 2), 16) - amount);
  const g = Math.max(0, parseInt(clean.substring(2, 4), 16) - amount);
  const b = Math.max(0, parseInt(clean.substring(4, 6), 16) - amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
