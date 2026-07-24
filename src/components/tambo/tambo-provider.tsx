"use client"

import { TamboProvider } from "@tambo-ai/react"
import type { ReactNode } from "react"

/* ── Tambo config ───────────────────────────────────────────────────── */

const TAMBO_API_KEY = import.meta.env.VITE_TAMBO_API_KEY || ""

interface TamboSetupProviderProps {
  children: ReactNode
  userKey?: string
}

export function TamboSetupProvider({ children, userKey = "user-1" }: TamboSetupProviderProps) {
  if (!TAMBO_API_KEY) {
    // Tambo not configured — render children without provider
    // The Gantt will work standalone, chat will use local mock
    return <>{children}</>
  }

  return (
    <TamboProvider
      apiKey={TAMBO_API_KEY}
      userKey={userKey}
    >
      {children}
    </TamboProvider>
  )
}
