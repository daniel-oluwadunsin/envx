import Link from "next/link";

type RelatedLink = {
  title: string;
  href: string;
};

type PageTemplateProps = {
  title: string;
  description: string;
  related?: RelatedLink[];
  children: React.ReactNode;
};

export function PageTemplate({
  title,
  description,
  related,
  children,
}: PageTemplateProps) {
  return (
    <article className="mx-auto w-full max-w-4xl space-y-8 pb-20">
      <header className="space-y-3 border-b pb-6">
        <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
        <p className="max-w-3xl text-base text-muted-foreground">
          {description}
        </p>
        {related && related.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-2">
            {related.map((item) => (
              <Link
                key={`${item.href}-${item.title}`}
                href={item.href}
                className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {item.title}
              </Link>
            ))}
          </div>
        ) : null}
      </header>
      {children}
    </article>
  );
}
