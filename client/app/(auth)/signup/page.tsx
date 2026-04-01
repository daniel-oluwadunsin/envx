"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { EnvXLogo } from "@/components/envx-logo";
import { Controller, useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { signUp } from "@/lib/services/auth.service";
import { toast } from "sonner";

type Inputs = {
  email: string;
  name: string;
  cliCode?: string;
};

export default function SignUpPage() {
  const router = useRouter();
  const { handleSubmit, control, watch, setValue } = useForm<Inputs>();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const cliCode = searchParams.get("cliCode");

  const email = watch("email");

  const { mutateAsync, isPending: loading } = useMutation({
    mutationKey: ["signUp"],
    mutationFn: signUp,
    onSuccess() {
      toast.success("Account created", {
        description:
          "Your account has been created successfully. Check your email for the login code.",
      });
      router.push(getPasswordlessLink(email));
    },
  });

  const onSubmit = (data: Inputs) => {
    mutateAsync(data);
  };

  const signInLink = useMemo(() => {
    let link = "/signin?";

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

  useEffect(() => {
    if (cliCode) {
      setValue("cliCode", cliCode);
    }
  }, [cliCode]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <EnvXLogo className="mb-6" />
          <h1 className="text-xl font-semibold tracking-tight">Register</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage your environments securely
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <div className="space-y-4">
            <Controller
              rules={{
                required: {
                  value: true,
                  message: "Name is required",
                },
              }}
              control={control}
              name="name"
              render={({ field: { onBlur, onChange, value }, fieldState }) => {
                return (
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm">
                      Name
                    </Label>
                    <Input
                      value={value ?? ""}
                      onChange={onChange}
                      onBlur={onBlur}
                      id="name"
                      type="text"
                      placeholder="Your Name"
                      className="h-10"
                      disabled={loading}
                      helperText={fieldState.error?.message}
                    />
                  </div>
                );
              }}
            />

            <Controller
              rules={{
                required: {
                  value: true,
                  message: "Email is required",
                },
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Invalid email address",
                },
              }}
              control={control}
              name="email"
              render={({ field: { onBlur, onChange, value }, fieldState }) => {
                return (
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm">
                      Email address
                    </Label>
                    <Input
                      value={value ?? ""}
                      onChange={onChange}
                      onBlur={onBlur}
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      className="h-10"
                      disabled={loading}
                      helperText={fieldState.error?.message}
                    />
                  </div>
                );
              }}
            />

            <Button
              onClick={handleSubmit(onSubmit)}
              className="w-full"
              size="lg"
              variant="secondary"
              disabled={loading}
              loading={loading}
            >
              Create Account
            </Button>
          </div>
        </div>

        <p className="text-white text-sm text-center mt-4">
          Already have an account?{" "}
          <Link href={signInLink} className="underline hover:text-foreground">
            Sign in
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
