import React from 'react';

/**
 * Lightweight Markdown typography parser for chatbot messages.
 * Formats **bold**, *italic*, `inline code`, bullet lists, and paragraphs
 * without pulling in heavy external dependencies.
 */
export default function FormattedChatText({ text = '' }) {
  if (!text) return null;

  // Split text by lines
  const lines = text.split('\n');

  const parseInline = (line, lineKey) => {
    // Regex matching **bold**, *italic*, `code`, or plain text
    const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
    const parts = line.split(regex);

    return parts.map((part, index) => {
      const key = `${lineKey}-${index}`;

      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        const content = part.slice(2, -2);
        return (
          <strong key={key} className="font-bold text-white dark:text-white light:text-slate-900">
            {content}
          </strong>
        );
      }

      if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
        const content = part.slice(1, -1);
        return (
          <em key={key} className="italic text-indigo-200 dark:text-indigo-200 light:text-indigo-800">
            {content}
          </em>
        );
      }

      if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
        const content = part.slice(1, -1);
        return (
          <code
            key={key}
            className="px-1.5 py-0.5 rounded font-mono text-[11px] bg-slate-950/80 text-emerald-400 border border-slate-800"
          >
            {content}
          </code>
        );
      }

      return <span key={key}>{part}</span>;
    });
  };

  return (
    <div className="space-y-1">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Empty line
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Bullet point
        if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const bulletContent = trimmed.slice(2);
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 my-0.5">
              <span className="text-indigo-400 font-bold shrink-0 leading-relaxed">•</span>
              <div className="flex-1 leading-relaxed">
                {parseInline(bulletContent, `bullet-${idx}`)}
              </div>
            </div>
          );
        }

        // Standard paragraph line
        return (
          <div key={idx} className="leading-relaxed">
            {parseInline(line, `line-${idx}`)}
          </div>
        );
      })}
    </div>
  );
}
