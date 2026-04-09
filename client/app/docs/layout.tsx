import type { Metadata } from "next";
import { DocsSidebar } from "./_components/docs-sidebar";

export const metadata: Metadata = {
  title: "Developer Docs",
  description: "envx developer documentation for CLI, dashboard, and security",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid max-w-7xl grid-cols-1 md:grid-cols-[280px_1fr]">
        <DocsSidebar />
        <main className="px-6 py-8 md:px-10">{children}</main>
      </div>
    </div>
  );
}
