import { useEffect, useState } from "react"
import { AlertCircle, BookOpen, LoaderCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api"
import type { Entry } from "@/lib/types"

export function KnowledgeBasePage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function load() {
    setError("")
    try {
      const data = await api<Entry[]>("/knowledge-base")
      setEntries(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load knowledge base")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const sections = [...new Set(entries.map((entry) => entry.section))]

  function select(entry: Entry) {
    setSelectedId(entry.id)
    setTitle(entry.title)
    setContent(entry.content)
    setSaved(false)
  }

  async function save() {
    setSaving(true)
    setSaved(false)
    try {
      const updated = await api<Entry>(`/knowledge-base/${selectedId}`, {
        method: "PUT",
        body: JSON.stringify({ title, content }),
      })
      setEntries(entries.map((entry) => (entry.id === updated.id ? updated : entry)))
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Knowledge base</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Curate the reference entries the support agent draws answers from.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-xl border py-24">
          <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border py-24 text-center">
          <BookOpen className="mb-2 size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No knowledge base entries yet.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Entries</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {sections.map((section) => (
                <div key={section}>
                  <p className="mb-1 text-xs font-medium text-muted-foreground uppercase">
                    {section}
                  </p>
                  {entries
                    .filter((entry) => entry.section === section)
                    .map((entry) => (
                      <button
                        key={entry.id}
                        onClick={() => select(entry)}
                        className={`block w-full rounded px-2 py-1 text-left text-sm hover:bg-muted ${
                          entry.id === selectedId ? "bg-muted font-medium" : ""
                        }`}
                      >
                        {entry.title}
                      </button>
                    ))}
                </div>
              ))}
            </CardContent>
          </Card>

          {selectedId === null ? (
            <div className="flex flex-col items-center justify-center rounded-xl border py-24 text-center">
              <BookOpen className="mb-2 size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Select an entry to edit it.</p>
            </div>
          ) : (
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle>Edit entry</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="kb-title">Title</Label>
                  <Input
                    id="kb-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <Label htmlFor="kb-content">Content</Label>
                  <Textarea
                    id="kb-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-96 flex-1 font-mono text-sm"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Button onClick={save} disabled={saving}>
                    {saving && <LoaderCircle className="animate-spin" />}
                    {saving ? "Saving..." : "Save"}
                  </Button>
                  {saved && (
                    <span className="text-sm text-muted-foreground">Saved</span>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
