"use client"

import type { LucideIcon } from "lucide-react"

interface IconPlaceholderProps {
  icon?: LucideIcon | null
  className?: string
}

export function IconPlaceholder({ icon: Icon, className }: IconPlaceholderProps) {
  if (Icon) {
    return <Icon className={className} />
  }
  return null
}
