"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EnvXLogo } from "@/components/envx-logo";
import { Badge } from "@/components/ui/badge";
import { Building2, CheckCircle } from "lucide-react";
import { organizations } from "@/lib/data/mock-data";
import { toast } from "sonner";

export default function InvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgId = searchParams.get("org");
  const inviteToken = searchParams.get("token");

  const [isAccepting, setIsAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const org = organizations.find((o) => o.id === orgId);

  const handleAccept = async () => {
    setIsAccepting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsAccepting(false);
    setAccepted(true);
    toast.success("Invitation accepted!", {
      description: "You've been added to the organization.",
    });
    // Redirect after a brief moment
    setTimeout(() => {
      router.push("/dashboard");
    }, 2000);
  };

  const handleDecline = () => {
    toast.info("Invitation declined");
    router.push("/dashboard");
  };

  if (!org || !inviteToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm">
          <div className="rounded-lg border border-border bg-card p-6 text-center">
            <p className="text-muted-foreground">Invalid invitation link</p>
            <Link href="/dashboard" className="mt-4 inline-block">
              <Button variant="outline">Go to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <EnvXLogo className="mb-6" />
          <h1 className="text-xl font-semibold tracking-tight">
            {accepted ? "Welcome!" : "You're invited!"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {accepted
              ? "You've successfully joined the organization"
              : "Join a team to start managing environments together"}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          {accepted ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <div className="text-center">
                <h2 className="font-semibold">{org.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  You're now a member of this organization
                </p>
              </div>
              <Button className="w-full" onClick={() => router.push("/dashboard")}>
                Go to Dashboard
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-lg bg-secondary/50 p-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary flex-shrink-0">
                    <Building2 className="h-6 w-6 text-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{org.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {org.slug}
                    </p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                      <span>{org.members} members</span>
                      <span className="text-border">•</span>
                      <span>{org.projects} projects</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Once you accept, you'll have access to:
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                    All team environments and projects
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                    Environment variable management
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                    Activity logs and version history
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <Button
                  className="w-full"
                  onClick={handleAccept}
                  disabled={isAccepting}
                  loading={isAccepting}
                >
                  Accept Invitation
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleDecline}
                  disabled={isAccepting}
                >
                  Decline
                </Button>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                By accepting, you agree to the organization's terms and
                policies
              </p>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Need help?{" "}
          <Link href="#" className="underline hover:text-foreground">
            Contact support
          </Link>
        </p>
      </div>
    </div>
  );
}
