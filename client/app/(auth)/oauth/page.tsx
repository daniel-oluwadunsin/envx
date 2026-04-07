"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EnvXLogo } from "@/components/envx-logo";
import { useUserInfo } from "@/lib/hooks/use-user-info";
import { CheckCircle2, XCircle, ShieldCheck } from "lucide-react";

type OAuthState = "success" | "error";

export default function OAuthRedirectPage() {
  const router = useRouter();
  usePathname();
  const searchParams = useSearchParams();
  const oauthStatus = searchParams.get("oauth_status");
  const { user } = useUserInfo();

  const [state, setState] = useState<OAuthState>("error");

  const goToSignIn = () => {
    router.push("/signin");
  };

  const handlePrimaryAction = () => {
    if (user) {
      router.push("/dashboard");
      return;
    }

    goToSignIn();
  };

  useEffect(() => {
    if (oauthStatus === "success") {
      setState("success");
    } else {
      setState("error");
    }
  }, [oauthStatus]);

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
              <h2 className="text-lg font-semibold">OAuth Authorized</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Authentication succeeded. Continue to complete your sign in
                flow.
              </p>

              <Button
                className="mt-6 w-full"
                size="lg"
                onClick={handlePrimaryAction}
              >
                {user ? "Go to Dashboard" : "Continue to Sign In"}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center py-4 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
              <h2 className="text-lg font-semibold">Invalid OAuth Redirect</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Missing or invalid callback parameters. Please restart
                authentication with GitHub or GitLab.
              </p>

              <div className="mt-6 flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
                <ShieldCheck className="h-5 w-5 text-foreground" />
              </div>

              <Button
                variant="outline"
                className="mt-6"
                onClick={handlePrimaryAction}
              >
                {user ? "Go to Dashboard" : "Back to Sign In"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
