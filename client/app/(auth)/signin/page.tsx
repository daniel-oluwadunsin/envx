"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  redirect,
  useParams,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { EnvXLogo } from "@/components/envx-logo";
import { useMutation } from "@tanstack/react-query";
import { signIn } from "@/lib/services/auth.service";
import { toast } from "sonner";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const cliCode = searchParams.get("cliCode");

  const onEmailChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setEmail(e.target.value);

  const onSubmit = () => {
    if (!email.trim()) {
      toast.error("Email is required", {
        description: "Please provide a valid email address.",
      });
      return;
    }
    signInMutateAsync();
  };

  const signUpLink = useMemo(() => {
    let link = "/signup?";

    if (redirect) {
      link += `redirect=${encodeURIComponent(redirect as string)}&`;
    }

    if (cliCode) {
      link += `cliCode=${cliCode}`;
    }

    return link;
  }, [redirect, cliCode]);

  const getPasswordlessLink = (email: string) => {
    if (redirect) {
      return `/passwordless?email=${email}&redirect=${encodeURIComponent(redirect as string)}`;
    } else if (cliCode) {
      return `/passwordless?email=${email}&cli=true&cliCode=${cliCode}`;
    } else {
      return `/passwordless?email=${email}`;
    }
  };

  const { mutateAsync: signInMutateAsync, isPending: loading } = useMutation({
    mutationKey: ["signIn"],
    mutationFn: () => signIn(email),
    onSuccess() {
      toast.success("Email sent", {
        description: "A sign-in code has been sent to your email address.",
      });
      router.push(getPasswordlessLink(email));
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <EnvXLogo className="mb-6" />
          <h1 className="text-xl font-semibold tracking-tight">
            Sign in to EnvX
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage your environments securely
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="h-10"
                value={email}
                onChange={onEmailChange}
                disabled={loading}
              />
            </div>
            <Button
              loading={loading}
              disabled={loading}
              className="w-full"
              size="lg"
              variant="secondary"
              onClick={onSubmit}
            >
              Sign In
            </Button>
          </div>
        </div>

        <p className="text-white text-sm text-center mt-4">
          Do not have an account?{" "}
          <Link href={signUpLink} className="underline hover:text-foreground">
            Sign up
          </Link>
        </p>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing, you agree to our{" "}
          <Link href="#" className="underline hover:text-foreground">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="#" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
