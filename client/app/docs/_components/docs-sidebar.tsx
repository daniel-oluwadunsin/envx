"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { docsNavGroups } from "../content";

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 h-screen overflow-y-auto border-r bg-background">
      <div className="space-y-6 p-5">
        <div>
          <Link href="/docs" className="text-lg font-semibold tracking-tight">
            Developer Docs
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">
            CLI and dashboard documentation
          </p>
        </div>

        <nav className="space-y-5">
          {docsNavGroups.map((group) => (
            <section key={group.title} className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.title}
              </h2>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={[
                          "block rounded-md px-2 py-1.5 text-sm transition-colors",
                          isActive
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                        ].join(" ")}
                      >
                        {item.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </nav>
      </div>
    </aside>
  );
}
