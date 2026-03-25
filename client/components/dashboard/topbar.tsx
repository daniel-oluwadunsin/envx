"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Moon,
  Sun,
  ChevronDown,
  LogOut,
  Settings,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/providers/auth-context";
import { organizations, projects } from "@/lib/data/mock-data";
import { useUserInfo } from "@/lib/hooks/use-user-info";
import { useMutation, useQuery } from "@tanstack/react-query";
import { logOut } from "@/lib/services/auth.service";
import { useUserStore } from "@/lib/store/user.store";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useOrgProjectStore } from "@/lib/store/org-projects.store";
import { getUserOrganizations } from "@/lib/services/org.service";

export function Topbar() {
  const { theme, setTheme } = useTheme();
  const {
    organizations,
    setOrganizations,
    selectedOrg,
    selectedProject,
    setSelectedOrg,
    setSelectedProject,
  } = useOrgProjectStore();
  const { user } = useUserInfo();
  const { clearUser } = useUserStore();

  const { mutateAsync: logOutMutateAsync, isPending: isLoggingOut } =
    useMutation({
      mutationKey: ["logOut"],
      mutationFn: () => logOut(),
      onSuccess() {
        toast.success("Signed out", {
          description: "You have been signed out successfully.",
        });
        clearUser();
        redirect("/signin");
      },
    });

  const { data: queryOrgs, isLoading: loadingOrgs } = useQuery({
    queryKey: ["organizations"],
    queryFn: getUserOrganizations,
    initialData: organizations,
  });

  useEffect(() => {
    if (queryOrgs) {
      setOrganizations(queryOrgs);
      if (!selectedOrg) {
        setSelectedOrg(queryOrgs[0]);
      }
    }
  }, [queryOrgs]);

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-6">
      {loadingOrgs ? (
        <>
          <div className="h-5 w-24 animate-pulse rounded bg-muted" />
        </>
      ) : (
        <>
          <div className="flex items-center gap-3">
            {/* Org switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-sm font-medium"
                >
                  {selectedOrg?.name}
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {organizations.map((org) => (
                  <DropdownMenuItem
                    onSelect={() => setSelectedOrg(org)}
                    key={org.id}
                  >
                    {org.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <span className="text-muted-foreground">/</span>

            {/* Project switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-sm font-medium"
                >
                  {selectedProject?.name}
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {projects.map((prj) => (
                  <DropdownMenuItem key={prj.id}>
                    <Link
                      href={`/project/${prj.id}/environments`}
                      className="w-full"
                    >
                      {prj.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="h-8 w-56 pl-9 text-sm"
              />
            </div>

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-secondary text-xs text-secondary-foreground">
                      {user?.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-2"
                  >
                    <User className="h-3.5 w-3.5" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => isLoggingOut || logOutMutateAsync()}
                  className={cn(
                    "flex items-center gap-2",
                    isLoggingOut && "pointer-events-none animate-pulse",
                  )}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      )}
    </header>
  );
}
