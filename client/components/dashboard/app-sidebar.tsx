"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  Layers,
  Activity,
  Settings,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EnvXLogo, EnvXLogoIcon } from "@/components/envx-logo";
import { useAuth } from "@/lib/providers/auth-context";
import { useUserInfo } from "@/lib/hooks/use-user-info";
import { useOrgProjectStore } from "@/lib/store/org-projects.store";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/org", label: "Organizations", icon: Building2 },
  { href: "/project", label: "Projects", icon: FolderKanban },
  { is_environments: true, href: "", label: "Environments", icon: Layers },
  { href: "/dashboard/activity", label: "Activity Logs", icon: Activity },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const { user } = useUserInfo();
  const { selectedProject } = useOrgProjectStore();

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-border bg-sidebar transition-all duration-200",
        collapsed ? "w-16" : "w-60",
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-border px-4">
        {collapsed ? <EnvXLogoIcon /> : <EnvXLogo />}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <div className="space-y-1">
          {navItems.map((item) => {
            if (item.is_environments) {
              item.href = selectedProject
                ? `/project/${selectedProject.id}/environments`
                : "/project/";
            }

            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" &&
                pathname.startsWith(item.href!) &&
                !navItems.some(
                  (i) => i.href !== item.href && pathname.startsWith(i.href!),
                ));

            const link = (
              <Link
                key={item.href}
                href={item.href!}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href} delayDuration={0}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return link;
          })}
        </div>
      </nav>

      {/* Collapse toggle */}
      <div className="px-2 py-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center text-muted-foreground"
          onClick={onToggle}
        >
          {collapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronsLeft className="h-4 w-4 mr-2" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </Button>
      </div>

      {/* User section */}
      <div className="border-t border-border p-3">
        <div
          className={cn(
            "flex items-center",
            collapsed ? "justify-center" : "gap-3",
          )}
        >
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-secondary text-xs font-medium text-secondary-foreground">
              {user?.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {user?.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user?.email}
              </p>
            </div>
          )}
          {!collapsed && (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={signOut}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="sr-only">Sign out</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Sign out
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </aside>
  );
}
