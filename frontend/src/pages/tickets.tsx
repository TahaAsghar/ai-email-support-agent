import { useEffect, useState } from "react"
import { AlertCircle, LoaderCircle, MessagesSquare } from "lucide-react"
import { StatusBadge } from "@/components/badges"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { api } from "@/lib/api"
import { formatDate, type Message, type Ticket } from "@/lib/types"

export function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selected, setSelected] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)

  async function load() {
    setError("")
    try {
      const data = await api<Ticket[]>("/tickets")
      setTickets(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tickets")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function open(ticket: Ticket) {
    setSelected(ticket)
    setMessagesLoading(true)
    try {
      const data = await api<Message[]>(`/tickets/${ticket.id}/messages`)
      setMessages(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load messages")
      setMessages([])
    } finally {
      setMessagesLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Tickets</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Review customer support tickets and their message threads.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Support tickets</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-3 text-sm text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                {error}
              </div>
            ) : tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessagesSquare className="mb-2 size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No tickets yet.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow
                      key={ticket.id}
                      onClick={() => open(ticket)}
                      data-state={ticket.id === selected?.id ? "selected" : undefined}
                      className="cursor-pointer"
                    >
                      <TableCell className="max-w-48 truncate">{ticket.subject}</TableCell>
                      <TableCell>{ticket.customer_email}</TableCell>
                      <TableCell>{ticket.category}</TableCell>
                      <TableCell>
                        <StatusBadge status={ticket.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>
              {selected ? selected.subject : "Ticket conversation"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {selected ? (
              messagesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No messages in this ticket yet.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {selected.proposed_action && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Proposed action:</span> {selected.proposed_action}
                    </p>
                  )}
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={
                        message.direction === "out"
                          ? "ml-10 rounded-lg bg-primary p-3 text-primary-foreground"
                          : "mr-10 rounded-lg border p-3"
                      }
                    >
                      <p className="mb-1 text-xs opacity-70">
                        {message.from_address}, {formatDate(message.created_at)}
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessagesSquare className="mb-2 size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Select a ticket to read the conversation.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
