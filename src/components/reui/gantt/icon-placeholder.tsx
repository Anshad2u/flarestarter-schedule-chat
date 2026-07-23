import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  type LucideIcon,
} from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  ChevronLeftIcon: ChevronLeft,
  ChevronRightIcon: ChevronRight,
  ChevronDownIcon: ChevronDown,
  CalendarIcon: Calendar,
}

interface IconPlaceholderProps {
  lucide?: string
  className?: string
  ['aria-hidden']?: boolean
}

export function IconPlaceholder({ lucide, className, ...props }: IconPlaceholderProps) {
  const Icon = lucide ? iconMap[lucide] : null
  if (!Icon) return null
  return <Icon className={className} {...props} />
}
