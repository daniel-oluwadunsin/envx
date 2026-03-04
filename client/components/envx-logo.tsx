import { cn } from "@/lib/utils";

export function EnvXLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground">
        <span className="text-sm font-bold text-background">E</span>
      </div>
      <span className="text-lg font-semibold tracking-tight text-foreground">
        EnvX
      </span>
    </div>
  );
}

export function EnvXLogoIcon({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-md bg-foreground",
        className,
      )}
    >
      <span className="text-sm font-bold text-background">E</span>
    </div>
  );
}
