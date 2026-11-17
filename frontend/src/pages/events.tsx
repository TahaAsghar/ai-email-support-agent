import { useEffect, useState } from "react"
import { AlertCircle, Inbox, LoaderCircle } from "lucide-react"
import { StatusBadge } from "@/components/badges"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { api } from "@/lib/api"
import { formatDate, type SupportEvent } from "@/lib/types"

export function EventsPage() {
  const [events, setEvents] = useState<SupportEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [checking, setChecking] = useState(false)

  async function load() {
    setError("")
    try {
      const data = await api<SupportEvent[]>("/events")
      setEvents(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function checkInbox() {
    setChecking(true)
    try {
      await api("/poll", { method: "POST" })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check inbox")
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Events</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Review inbound email processing events and poll for new ones.
          </p>
        </div>
        <Button onClick={checkInbox} disabled={checking}>
          {checking ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <Inbox className="mr-1.5 size-4" />
          )}
          {checking ? "Checking..." : "Check inbox now"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Processing events</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-3 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Inbox className="mb-2 size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No events yet.</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Click "Check inbox now" to pull for new inbound email.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>{event.id}</TableCell>
                    <TableCell>
                      <StatusBadge status={event.status} />
                    </TableCell>
                    <TableCell>{event.attempts}</TableCell>
                    <TableCell className="max-w-xs truncate">{event.error}</TableCell>
                    <TableCell>{formatDate(event.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
