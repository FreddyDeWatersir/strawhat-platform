/**
 * Minimal markdown renderer for provider how-to-buy notes.
 * Supports: line breaks, **bold**, `code`, and `- ` bullet lists.
 * Server component — no JS shipped.
 */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("**")) {
      parts.push(
        <strong key={`${keyPrefix}-b-${i}`} className="text-foreground">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("`")) {
      parts.push(
        <code
          key={`${keyPrefix}-c-${i}`}
          className="rounded bg-background px-1 py-0.5 text-xs"
        >
          {token.slice(1, -1)}
        </code>,
      );
    }
    lastIndex = match.index + token.length;
    i += 1;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

export function MarkdownLite({ text }: { text: string }) {
  const lines = text.split(/\r?\n/);
  const blocks: React.ReactNode[] = [];
  let listBuffer: string[] = [];

  function flushList() {
    if (listBuffer.length === 0) return;
    blocks.push(
      <ul
        key={`ul-${blocks.length}`}
        className="ml-5 list-disc space-y-0.5 text-sm text-muted"
      >
        {listBuffer.map((item, idx) => (
          <li key={idx}>{renderInline(item, `li-${blocks.length}-${idx}`)}</li>
        ))}
      </ul>,
    );
    listBuffer = [];
  }

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trimEnd();
    if (line.startsWith("- ")) {
      listBuffer.push(line.slice(2));
      return;
    }
    flushList();
    if (line.trim() === "") return;
    blocks.push(
      <p key={`p-${idx}`} className="text-sm text-muted">
        {renderInline(line, `p-${idx}`)}
      </p>,
    );
  });
  flushList();

  return <div className="space-y-2">{blocks}</div>;
}
