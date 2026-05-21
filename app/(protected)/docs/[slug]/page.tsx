import Link from "next/link";
import { readFile } from "fs/promises";
import { join } from "path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const DOC_SLUGS: Record<string, string> = {
  "supply-strategy": "SUPPLY_STRATEGY.md",
  "tcg-operators-research": "TCG_OPERATORS_RESEARCH.md",
  handoff: "HANDOFF.md",
};

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function DocPage({ params }: PageProps) {
  const { slug } = await params;
  const filename = DOC_SLUGS[slug];
  if (!filename) notFound();

  const filePath = join(process.cwd(), "docs", filename);
  let content: string;
  try {
    content = await readFile(filePath, "utf8");
  } catch {
    notFound();
  }

  const titles: Record<string, string> = {
    "supply-strategy": "Supply strategy",
    "tcg-operators-research": "TCG operators research",
    handoff: "Platform handoff",
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/sources" className="text-sm text-gold hover:underline">
          ← Sources
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-gold">
          {titles[slug] ?? slug}
        </h1>
      </div>

      <article className="doc-markdown space-y-4 text-sm leading-relaxed text-muted [&_a]:text-gold [&_a]:underline [&_h1]:mb-2 [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:text-gold [&_h2]:mb-2 [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:mt-4 [&_h3]:font-medium [&_h3]:text-foreground [&_li]:ml-5 [&_ol]:list-decimal [&_p]:text-muted [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-card-border [&_td]:p-2 [&_th]:border [&_th]:border-card-border [&_th]:bg-card [&_th]:p-2 [&_th]:text-left [&_ul]:list-disc">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </article>
    </div>
  );
}
