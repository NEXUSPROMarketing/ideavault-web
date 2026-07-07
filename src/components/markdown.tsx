import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const components: Components = {
  h1: ({ node: _node, ...props }) => (
    <h2 className="mt-8 font-display text-2xl font-semibold leading-snug text-ink first:mt-0" {...props} />
  ),
  h2: ({ node: _node, ...props }) => (
    <h2 className="mt-8 font-display text-[22px] font-semibold leading-snug text-ink first:mt-0" {...props} />
  ),
  h3: ({ node: _node, ...props }) => (
    <h3 className="mt-6 font-display text-lg font-semibold text-ink first:mt-0" {...props} />
  ),
  h4: ({ node: _node, ...props }) => (
    <h4 className="mt-5 text-[15px] font-bold text-ink first:mt-0" {...props} />
  ),
  p: ({ node: _node, ...props }) => (
    <p className="mt-3 text-[15px] leading-relaxed text-ink-soft first:mt-0" {...props} />
  ),
  ul: ({ node: _node, ...props }) => (
    <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-ink-soft" {...props} />
  ),
  ol: ({ node: _node, ...props }) => (
    <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[15px] leading-relaxed text-ink-soft" {...props} />
  ),
  li: ({ node: _node, ...props }) => <li className="pl-1" {...props} />,
  strong: ({ node: _node, ...props }) => <strong className="font-semibold text-ink" {...props} />,
  a: ({ node: _node, href, ...props }) => {
    const external = typeof href === "string" && href.startsWith("http");
    return (
      <a
        href={href}
        className="font-medium text-terracotta underline underline-offset-2 hover:text-terracotta-deep"
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...props}
      />
    );
  },
  blockquote: ({ node: _node, ...props }) => (
    <blockquote className="my-4 border-l-2 border-terracotta pl-4 italic text-ink-soft" {...props} />
  ),
  code: ({ node: _node, ...props }) => (
    <code className="rounded bg-line/50 px-1 py-0.5 text-[13px]" {...props} />
  ),
  hr: ({ node: _node, ...props }) => <hr className="my-8 border-line" {...props} />,
  table: ({ node: _node, ...props }) => (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  th: ({ node: _node, ...props }) => (
    <th className="border-b-2 border-line py-2 pr-4 text-left font-semibold text-ink" {...props} />
  ),
  td: ({ node: _node, ...props }) => (
    <td className="border-b border-line/70 py-2 pr-4 align-top text-ink-soft" {...props} />
  ),
};

/** Styled markdown for deep dives and verdicts. */
export function Markdown({ children }: { children: string }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{children}</ReactMarkdown>;
}
