"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EnvXLogo } from "@/components/envx-logo";
import {
  Shield,
  Layers,
  Users,
  Terminal,
  History,
  Lock,
  FileText,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { useUserInfo } from "@/lib/hooks/use-user-info";

const features = [
  {
    icon: Shield,
    title: "Secure Secret Storage",
    description:
      "End-to-end encrypted storage for all your environment variables. Secrets never leave your infrastructure unencrypted.",
  },
  {
    icon: Layers,
    title: "Multi-Environment Support",
    description:
      "Manage development, staging, and production environments in one place with clear separation and access controls.",
  },
  {
    icon: Users,
    title: "Team Access Control",
    description:
      "Granular role-based permissions let you control who can read, write, or manage environment configurations.",
  },
  {
    icon: Terminal,
    title: "CLI-First Workflow",
    description:
      "Pull and push environment variables directly from your terminal. Integrates seamlessly into your existing workflow.",
  },
  {
    icon: History,
    title: "Version History",
    description:
      "Track every change to your environment configs. Roll back to any previous version with a single command.",
  },
];

const devFeatures = [
  {
    icon: FileText,
    title: "Works with .env files",
    description:
      "Drop-in replacement for your existing .env workflow. Import, export, and sync standard .env file formats.",
  },
  {
    icon: Terminal,
    title: "CLI Integration",
    description:
      "Install the CLI, authenticate once, and pull secrets into any project with a single command.",
  },
  {
    icon: Lock,
    title: "Zero-Trust Encryption",
    description:
      "Secrets are encrypted at rest and in transit. Only authorized team members and services can decrypt them.",
  },
];

export default function LandingPage() {
  const { user, isLoadingUser } = useUserInfo();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <EnvXLogo />
          <div className="flex items-center gap-6">
            <Link
              href="#features"
              className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground md:inline-block"
            >
              Features
            </Link>
            <Link
              href="#developers"
              className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground md:inline-block"
            >
              Developers
            </Link>

            {isLoadingUser ? (
              <div className="h-5 w-24 animate-pulse rounded bg-muted" />
            ) : user ? (
              <>
                <Link href="/dashboard">
                  <Button size="sm">Dashboard</Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/signin">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">
                    Get Started
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto flex max-w-6xl flex-col items-center px-6 pb-24 pt-24 text-center md:pt-32">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-chart-2" />
            Now in public beta
          </div>
          <h1 className="max-w-3xl text-balance text-4xl font-bold tracking-tight md:text-6xl">
            Secure environment management for modern teams
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            Stop sharing .env files over Slack. EnvX lets your team sync
            environment configurations across machines with end-to-end
            encryption and fine-grained access control.
          </p>
          <div className="mt-10 flex items-center gap-4">
            <Link href="/signup">
              <Button size="lg">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/docs">
              <Button variant="outline" size="lg">
                View Docs
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Code snippet preview */}
          <div className="mt-16 w-full max-w-2xl overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
              <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
              <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
              <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
              <span className="ml-2 text-xs text-muted-foreground">
                Terminal
              </span>
            </div>
            <div className="p-5 text-left font-mono text-sm leading-relaxed">
              <p className="text-muted-foreground">
                <span className="text-chart-2">$</span> npm install -g
                envxtool-cli
              </p>
              <p className="mt-2 text-muted-foreground">
                <span className="text-chart-2">$</span> envx login
              </p>
              <p className="text-muted-foreground/60">
                {"  "}Authenticated as alex@envx.dev
              </p>
              <p className="mt-2 text-muted-foreground">
                <span className="text-chart-2">$</span> envx pull -e production
              </p>
              <p className="text-muted-foreground/60">
                {"  "}Pulled 24 variables to .env.production
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          className="border-t border-border bg-secondary/50 py-24"
        >
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight">
                Everything you need to manage secrets
              </h2>
              <p className="mt-4 text-muted-foreground">
                Built for teams that take security seriously without sacrificing
                developer experience.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-lg border border-border bg-card p-6 transition-colors hover:border-foreground/10"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
                    <feature.icon className="h-5 w-5 text-foreground" />
                  </div>
                  <h3 className="mb-2 font-semibold">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Developer section */}
        <section id="developers" className="py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight">
                Built for developers
              </h2>
              <p className="mt-4 text-muted-foreground">
                Designed to fit into your existing workflow with minimal
                friction.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {devFeatures.map((feature) => (
                <div key={feature.title} className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
                    <feature.icon className="h-6 w-6 text-foreground" />
                  </div>
                  <h3 className="mb-2 font-semibold">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border bg-secondary/50 py-24">
          <div className="mx-auto max-w-6xl px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Ready to secure your environment configs?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Get started for free. No credit card required.
            </p>
            <Link href="/signup" className="mt-8 inline-block">
              <Button size="lg">
                Start for free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
          <EnvXLogo />
          <div className="flex items-center gap-6">
            <Link
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Docs
            </Link>
            <Link
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              GitHub
            </Link>
            <Link
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Privacy
            </Link>
            <Link
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Terms
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; 2026 EnvX. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
