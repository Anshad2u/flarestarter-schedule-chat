/**
 * Tambo AI REST API client — zero dependencies, just fetch.
 *
 * Endpoints:
 *   POST /threads              → create a thread
 *   POST /threads/{id}/advance → send a message, get AI response
 */

const TAMBO_BASE = 'https://api.tambo.co'

interface TamboContentPart {
  type: 'text'
  text: string
}

interface TamboMessage {
  role: 'user' | 'assistant' | 'system'
  content: TamboContentPart[]
}

interface TamboThread {
  id: string
  projectId: string
  createdAt: string
  // ... other fields
}

interface TamboAdvanceResponse {
  thread: TamboThread
  messages: TamboMessage[]
  generationStage?: string
  // May also contain component data
}

/**
 * Create a new thread and send the first message.
 * Returns the thread ID + assistant response messages.
 */
export async function createAndAdvance(
  apiKey: string,
  userMessage: string,
): Promise<{ threadId: string; messages: TamboMessage[] }> {
  const res = await fetch(`${TAMBO_BASE}/threads/advance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      message: {
        role: 'user',
        content: [{ type: 'text', text: userMessage }],
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Tambo create+advance failed (${res.status}): ${err}`)
  }

  const data: TamboAdvanceResponse = await res.json()
  return { threadId: data.thread.id, messages: data.messages }
}

/**
 * Advance an existing thread with a new user message.
 */
export async function advanceThread(
  apiKey: string,
  threadId: string,
  userMessage: string,
): Promise<TamboMessage[]> {
  const res = await fetch(`${TAMBO_BASE}/threads/${threadId}/advance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      messageToAppend: {
        role: 'user',
        content: [{ type: 'text', text: userMessage }],
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Tambo advance failed (${res.status}): ${err}`)
  }

  const data: TamboAdvanceResponse = await res.json()
  return data.messages
}

/**
 * Extract the latest assistant text from a messages array.
 */
export function getLastAssistantText(messages: TamboMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'assistant') {
      return messages[i].content
        .filter((c) => c.type === 'text')
        .map((c) => c.text)
        .join('')
    }
  }
  return ''
}
