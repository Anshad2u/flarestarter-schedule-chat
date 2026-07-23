import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/{-$locale}/schedule')({
  component: SchedulePage,
})

function SchedulePage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background p-8">
      <h1 className="text-2xl font-bold">ScheduleChat</h1>
      <p className="mt-2 text-muted-foreground">Gantt chart coming soon…</p>
      <div className="mt-6 rounded-lg border p-4">
        <p>✅ This page loads successfully!</p>
      </div>
    </div>
  )
}
