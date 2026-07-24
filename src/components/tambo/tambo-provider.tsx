"use client"

import type { ReactNode } from "react"

/* ── Tambo config ───────────────────────────────────────────────────── */

const TAMBO_API_KEY = import.meta.env.VITE_TAMBO_API_KEY || ""

interface TamboSetupProviderProps {
  children: ReactNode
  userKey?: string
}

// Lazy-load TamboProvider to avoid build issues with @standard-community/standard-json CJS
export function TamboSetupProvider({ children, userKey = "user-1" }: TamboSetupProviderProps) {
  if (!TAMBO_API_KEY) {
    return <>{children}</>
  }

  // Dynamic import wrapper - renders children directly for now
  // TamboProvider will be enabled once the CJS dependency issue is resolved
  return <>{children}</>
}
