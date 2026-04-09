"use client";

import { EnvXLogo } from "@/components/envx-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithCode } from "@/lib/services/auth.service";
import { useUserStore } from "@/lib/store/user.store";
import { useMutation } from "@tanstack/react-query";
import Link from "next/dist/client/link";
import { useSearchParams, redirect } from "next/navigation";
import { JSX, Suspense, useState } from "react";
import { toast } from "sonner";

const PasswordlessPageContent = (): JSX.Element | null => {
  const [code, setCode] = useState("");
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const redirectUrl = searchParams.get("redirect");
  const isCli = searchParams.get("cli") === "true";
  const { setAccessToken } = useUserStore();

  const { mutateAsync: _signInWithCode, isPending: loading } = useMutation({
    mutationKey: ["signInWithCode"],
    mutationFn: async () => signInWithCode(email!, code),
    onSuccess: (data) => {
      setAccessToken(data?.accessToken as string);
      toast.success("Sign-in successful", {
        description: "You have successfully signed in to EnvX.",
      });

      if (!redirectUrl && !isCli) {
        redirect("/dashboard");
      } else if (redirectUrl) {
        redirect(decodeURIComponent(redirectUrl));
      } else if (isCli) {
        redirect(`/cli?status=success&canGoToDashboard=true`);
      }
    },
  });

  if (!email) {
    toast.error("Invalid email", {
      description: "Please provide a valid email address.",
    });
    return redirect("/signin");
  }

  const onSubmit = async () => {
    if (!code.trim()) {
      toast.error("Invalid code", {
        description: "Please provide a valid sign-in code.",
      });
      return;
    }
    await _signInWithCode();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <EnvXLogo className="mb-6" />
          <h1 className="text-xl font-semibold tracking-tight">
            Passwordless Sign In to EnvX
          </h1>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-sm">
                Sign In Code
              </Label>
              <Input
                id="code"
                type="number"
                disabled={loading}
                placeholder="Enter your sign in code"
                className="h-10"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <Button
              onClick={() => onSubmit()}
              className="w-full"
              size="lg"
              variant="secondary"
              disabled={loading}
              loading={loading}
            >
              Verify & Sign In
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PasswordlessPage = () => {
  return (
    <Suspense>
      <PasswordlessPageContent />
    </Suspense>
  );
};

export default PasswordlessPage;
