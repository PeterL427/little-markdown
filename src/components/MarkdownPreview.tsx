import { useCallback, useMemo, useState } from 'react';
import ReactMarkdown, {
  type Components,
  defaultUrlTransform,
} from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  oneLight,
  oneDark,
} from 'react-syntax-highlighter/dist/esm/styles/prism';
import { SyntaxHighlighter, normalizeLanguage } from '../lib/syntax';
import type { Theme } from '../hooks/useTheme';
import Lightbox from './Lightbox';

const remarkPlugins = [remarkGfm];

const monoFont =
  'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';

// Allow embedded image data URLs (used by the image-upload feature); defer to
// react-markdown's safe default for everything else.
function urlTransform(url: string): string {
  return url.startsWith('data:image/') ? url : defaultUrlTransform(url);
}

function makeComponents(
  isDark: boolean,
  onImageClick: (src: string, alt: string) => void,
): Components {
  return {
    // Tailwind Typography styles the default `pre`; make it a transparent
    // pass-through so the highlighter below isn't double-wrapped.
    pre({ children }) {
      return <>{children}</>;
    },

    code(props) {
      const { className, children } = props;
      const text = String(children ?? '');
      const match = /language-(\w+)/.exec(className ?? '');
      // react-markdown v9 dropped the `inline` flag, so infer block-ness from a
      // language hint or a line break (inline code has neither).
      const isBlock = Boolean(match) || text.includes('\n');

      if (!isBlock) {
        return <code className={className}>{children}</code>;
      }

      return (
        <SyntaxHighlighter
          className="not-prose"
          language={match ? normalizeLanguage(match[1]) : 'text'}
          style={isDark ? oneDark : oneLight}
          PreTag="div"
          customStyle={{
            margin: '1.25em 0',
            padding: '1rem',
            borderRadius: '0.5rem',
            border: isDark
              ? '1px solid rgb(51 65 85)'
              : '1px solid rgb(226 232 240)',
            background: isDark ? 'rgb(30 41 59)' : 'rgb(250 250 250)',
            fontSize: '0.85em',
            overflow: 'auto',
          }}
          codeTagProps={{ style: { fontFamily: monoFont } }}
        >
          {text.replace(/\n$/, '')}
        </SyntaxHighlighter>
      );
    },

    // Click to zoom; lazy-load; styled border that adapts to the theme.
    img({ src, alt, title }) {
      if (typeof src !== 'string') return null;
      const label = alt ?? '';
      return (
        <img
          src={src}
          alt={label}
          title={title}
          loading="lazy"
          onClick={() => onImageClick(src, label)}
          className="mx-auto h-auto max-w-full cursor-zoom-in rounded-lg border border-slate-200 transition-opacity hover:opacity-90 dark:border-slate-700"
        />
      );
    },

    // Open links in a new tab so previewing never navigates away from the app.
    a({ href, children }) {
      return (
        <a href={href} target="_blank" rel="noreferrer noopener">
          {children}
        </a>
      );
    },
  };
}

interface MarkdownPreviewProps {
  content: string;
  theme: Theme;
}

/** Renders Markdown (GFM) with code highlighting and click-to-zoom images. */
export default function MarkdownPreview({
  content,
  theme,
}: MarkdownPreviewProps) {
  const [zoom, setZoom] = useState<{ src: string; alt: string } | null>(null);
  const handleImageClick = useCallback(
    (src: string, alt: string) => setZoom({ src, alt }),
    [],
  );
  const components = useMemo(
    () => makeComponents(theme === 'dark', handleImageClick),
    [theme, handleImageClick],
  );

  if (!content.trim()) {
    return (
      <p className="text-slate-400 italic select-none dark:text-slate-500">
        还没有内容可预览 —— 在左侧开始输入吧。
      </p>
    );
  }

  return (
    <>
      <article className="prose prose-slate max-w-none dark:prose-invert prose-pre:bg-transparent prose-pre:p-0">
        <ReactMarkdown
          remarkPlugins={remarkPlugins}
          urlTransform={urlTransform}
          components={components}
        >
          {content}
        </ReactMarkdown>
      </article>
      {zoom && (
        <Lightbox src={zoom.src} alt={zoom.alt} onClose={() => setZoom(null)} />
      )}
    </>
  );
}
