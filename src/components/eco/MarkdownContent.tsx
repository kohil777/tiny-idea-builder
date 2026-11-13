import React from "react";

function renderInline(text: string): React.ReactNode {
  // Bold formatting **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    // Inline code `code`
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-primary">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export function MarkdownContent({ content, className = "" }: { content: string; className?: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let tableBuffer: string[] = [];

  function flushTable() {
    if (tableBuffer.length === 0) return;
    const rows = tableBuffer
      .map((r) => r.trim())
      .filter((r) => r.startsWith("|") && r.endsWith("|"))
      .map((r) =>
        r
          .slice(1, -1)
          .split("|")
          .map((c) => c.trim())
      );

    if (rows.length >= 2) {
      const header = rows[0];
      const dataRows = rows.slice(1).filter((r) => !r.every((c) => /^:?-+:?$/.test(c)));

      elements.push(
        <div key={`table-${elements.length}`} className="my-2.5 overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/60 font-semibold text-foreground">
                {header.map((th, ci) => (
                  <th key={ci} className="px-3 py-2">
                    {renderInline(th)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {dataRows.map((tr, ri) => (
                <tr key={ri} className="hover:bg-muted/30">
                  {tr.map((td, ci) => (
                    <td key={ci} className="px-3 py-1.5">
                      {renderInline(td)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    tableBuffer = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      tableBuffer.push(trimmed);
      continue;
    } else {
      flushTable();
    }

    if (!trimmed) {
      continue;
    }

    if (trimmed.startsWith("### ")) {
      elements.push(
        <h4 key={i} className="mb-1 mt-3 text-sm font-bold text-forest first:mt-0">
          {renderInline(trimmed.replace(/^###\s+/, ""))}
        </h4>
      );
    } else if (trimmed.startsWith("## ")) {
      elements.push(
        <h3 key={i} className="mb-1.5 mt-3.5 text-base font-bold text-forest first:mt-0">
          {renderInline(trimmed.replace(/^##\s+/, ""))}
        </h3>
      );
    } else if (trimmed.startsWith("# ")) {
      elements.push(
        <h2 key={i} className="mb-2 mt-4 text-lg font-extrabold text-forest first:mt-0">
          {renderInline(trimmed.replace(/^#\s+/, ""))}
        </h2>
      );
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      elements.push(
        <li key={i} className="ml-4 list-disc text-xs leading-relaxed text-foreground/90 sm:text-sm">
          {renderInline(trimmed.replace(/^[-*]\s+/, ""))}
        </li>
      );
    } else if (/^\d+\.\s+/.test(trimmed)) {
      elements.push(
        <li key={i} className="ml-4 list-decimal text-xs leading-relaxed text-foreground/90 sm:text-sm">
          {renderInline(trimmed.replace(/^\d+\.\s+/, ""))}
        </li>
      );
    } else {
      elements.push(
        <p key={i} className="my-1.5 text-xs leading-relaxed text-foreground/90 sm:text-sm">
          {renderInline(trimmed)}
        </p>
      );
    }
  }

  flushTable();

  return <div className={`space-y-1 ${className}`}>{elements}</div>;
}

