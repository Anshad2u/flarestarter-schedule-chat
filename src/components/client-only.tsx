"use client"

import { type ReactNode, useState, useEffect } from 'react'

/**
 * Renders children only on the client side (after hydration).
 * During SSR, renders the fallback instead.
 */
export function ClientOnly({
  children,
  fallback,
}: {
  children: () => ReactNode
  fallback?: ReactNode
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted ? <>{children()}</> : <>{fallback ?? null}</>
}
