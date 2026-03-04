"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EnvXLogo } from "@/components/envx-logo"
import { CheckCircle2, XCircle, Terminal, Loader2 } from "lucide-react"

type CLIState = "idle" | "loading" | "success" | "error"

export default function CLIAuthPage() {
  const [code, setCode] = useState("")
  const [state, setState] = useState<CLIState>("idle")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return

    setState("loading")
    await new Promise((r) => setTimeout(r, 1500))

    if (code === "error") {
      setState("error")
    } else {
      setState("success")
    }
  }

  const handleReset = () => {
    setCode("")
    setState("idle")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <EnvXLogo className="mb-6" />
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          {state === "success" ? (
            <div className="flex flex-col items-center py-4 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-chart-2/10">
                <CheckCircle2 className="h-6 w-6 text-chart-2" />
              </div>
              <h2 className="text-lg font-semibold">Device Authorized</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Your CLI session has been authenticated. You can close this
                window and return to your terminal.
              </p>
            </div>
          ) : state === "error" ? (
            <div className="flex flex-col items-center py-4 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
              <h2 className="text-lg font-semibold">Invalid or Expired Code</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                The code you entered is invalid or has expired. Please try again
                with a new code from your terminal.
              </p>
              <Button
                variant="outline"
                className="mt-6"
                onClick={handleReset}
              >
                Try Again
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-6 flex flex-col items-center text-center">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
                  <Terminal className="h-5 w-5 text-foreground" />
                </div>
                <h2 className="text-lg font-semibold">Authorize CLI</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Enter the code shown in your terminal to authorize this device.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-sm">
                    User code
                  </Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="XXXX-XXXX"
                    className="h-10 text-center font-mono text-lg tracking-widest"
                    disabled={state === "loading"}
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the code shown in your terminal
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={!code.trim() || state === "loading"}
                >
                  {state === "loading" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Authorizing...
                    </>
                  ) : (
                    "Authorize Device"
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
