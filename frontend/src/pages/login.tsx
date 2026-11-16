import { useState } from "react"
import { Eye, EyeOff, LoaderCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api, saveToken } from "@/lib/api"

interface TokenResponse {
  access_token: string
  token_type: string
}

export function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setSubmitting(true)

    try {
      const response = await api<TokenResponse>(isRegister ? "/auth/register" : "/auth/login", {
        method: "POST",
        body: JSON.stringify(
          isRegister ? { name: name.trim(), email, password } : { email, password },
        ),
      })
      saveToken(response.access_token)
      onLogin()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.")
    } finally {
      setSubmitting(false)
    }
  }

  function switchMode() {
    setIsRegister((current) => !current)
    setError("")
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-foreground px-12 py-14 text-background lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, oklch(1 0 0 / 0.18), transparent 42%), radial-gradient(circle at 80% 70%, oklch(1 0 0 / 0.08), transparent 36%)",
          }}
        />
        <div className="relative">
          <BrandMark inverse />
        </div>
        <div className="relative max-w-md">
          <h1 className="text-4xl leading-tight font-semibold tracking-tight">
            The inbox, with a human still in charge.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-background/70">
            Review what the agent answered, step in on escalations, and keep the knowledge base
            accurate.
          </p>
        </div>
        <p className="relative text-sm text-background/50">Harbor &amp; Pine support</p>
      </aside>

      <main className="flex items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 lg:hidden">
            <BrandMark />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight">
              {isRegister ? "Create your account" : "Welcome back"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {isRegister
                ? "Use this account to open the support dashboard."
                : "Sign in to events, tickets, and the knowledge base."}
            </p>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-5" noValidate={false}>
            {isRegister && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Alex Morgan"
                  className="h-10"
                  required
                  disabled={submitting}
                />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                className="h-10"
                required
                disabled={submitting}
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-3">
                <Label htmlFor="password">Password</Label>
                {isRegister && (
                  <span className="text-xs text-muted-foreground">At least 8 characters</span>
                )}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={isRegister ? "Create a password" : "Enter your password"}
                  className="h-10 pr-10"
                  minLength={isRegister ? 8 : 1}
                  maxLength={72}
                  required
                  disabled={submitting}
                />
                <button
                  type="button"
                  className="absolute top-0 right-0 flex h-10 w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={submitting}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg bg-destructive/10 px-3 py-2 text-sm leading-relaxed text-destructive"
              >
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="mt-1 h-10 w-full" disabled={submitting}>
              {submitting && <LoaderCircle className="animate-spin" />}
              {submitting
                ? isRegister
                  ? "Creating account..."
                  : "Signing in..."
                : isRegister
                  ? "Create account"
                  : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isRegister ? "Already have an account?" : "Need an account?"}{" "}
            <button
              type="button"
              onClick={switchMode}
              className="font-medium text-foreground underline-offset-4 hover:underline disabled:opacity-50"
              disabled={submitting}
            >
              {isRegister ? "Sign in" : "Create one"}
            </button>
          </p>
        </div>
      </main>
    </div>
  )
}

function BrandMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={
          inverse
            ? "flex size-9 items-center justify-center rounded-lg bg-background text-sm font-semibold text-foreground"
            : "flex size-9 items-center justify-center rounded-lg bg-foreground text-sm font-semibold text-background"
        }
      >
        HP
      </span>
      <span className={inverse ? "text-sm font-medium text-background" : "text-sm font-medium"}>
        Harbor &amp; Pine
      </span>
    </div>
  )
}
