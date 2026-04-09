import Link from "next/link";
import { PageTemplate } from "./_components/page-template";
import { DOCS_HOME_CARDS } from "./content";

export default function DocsHomePage() {
  return (
    <PageTemplate
      title="Developer Documentation"
      description="Welcome to envx docs. Learn installation, core workflows, CLI reference, dashboard usage, and security architecture."
      related={[
        { title: "Overview", href: "/docs/overview" },
        { title: "Installation", href: "/docs/installation" },
        { title: "Guides and Tutorials", href: "/docs/guides/tutorials" },
      ]}
    >
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight">Start Here</h2>
        <p className="text-muted-foreground">
          New users should begin with Overview, then Installation, and then the
          first tutorial. Command reference pages are grouped by workflow area.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">All Sections</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {DOCS_HOME_CARDS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
            >
              <h3 className="font-medium">{item.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </PageTemplate>
  );
}
