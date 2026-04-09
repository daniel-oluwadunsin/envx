import { notFound } from "next/navigation";
import { PageTemplate } from "../_components/page-template";
import { allDocPages, findDocBySlug } from "../content";

export function generateStaticParams() {
  return allDocPages.map((page) => ({ slug: page.slug }));
}

export default async function DynamicDocPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const page = findDocBySlug(slug);

  if (!page) {
    notFound();
  }

  return (
    <PageTemplate
      title={page.title}
      description={page.description}
      related={page.related}
    >
      {page.content}
    </PageTemplate>
  );
}
