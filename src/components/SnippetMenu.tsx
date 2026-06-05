import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Snippet } from '../lib/snippets';
import { getCaretCoordinates } from '../lib/caret';

interface SnippetMenuProps {
  items: Snippet[];
  activeIndex: number;
  /** The textarea the menu is anchored to. */
  textarea: HTMLTextAreaElement | null;
  /** Index of the `/` character, used as the anchor point. */
  anchor: number;
  onPick: (index: number) => void;
  onHover: (index: number) => void;
}

const ROW_HEIGHT = 34; // px, for height estimation when flipping above the caret
const MAX_ROWS = 7;
const MENU_WIDTH = 232;
const GAP = 6;

/**
 * Floating slash-command menu. Positions itself at the caret (just below the
 * `/`), flips above when there's no room, and clamps to the viewport. Mouse
 * interactions use onMouseDown→preventDefault so the textarea keeps focus.
 */
export default function SnippetMenu({
  items,
  activeIndex,
  textarea,
  anchor,
  onPick,
  onHover,
}: SnippetMenuProps) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // Measure before paint so the menu never flashes at the wrong spot.
  useLayoutEffect(() => {
    if (!textarea) return;
    const c = getCaretCoordinates(textarea, anchor);
    const rect = textarea.getBoundingClientRect();
    const caretTop = rect.top + c.top - textarea.scrollTop;
    const caretLeft = rect.left + c.left - textarea.scrollLeft;
    const menuHeight = Math.min(items.length, MAX_ROWS) * ROW_HEIGHT + 8;

    let top = caretTop + c.height + GAP;
    if (top + menuHeight > window.innerHeight - 8) {
      top = caretTop - menuHeight - GAP; // not enough room below → flip above
    }
    let left = caretLeft;
    if (left + MENU_WIDTH > window.innerWidth - 8) {
      left = window.innerWidth - 8 - MENU_WIDTH;
    }
    setPos({ top: Math.max(8, top), left: Math.max(8, left) });
  }, [textarea, anchor, items.length]);

  // Keep the highlighted row visible during keyboard navigation.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!pos || items.length === 0) return null;

  return createPortal(
    <ul
      role="listbox"
      aria-label="Markdown 片段"
      onMouseDown={(e) => e.preventDefault()}
      style={{
        top: pos.top,
        left: pos.left,
        width: MENU_WIDTH,
        maxHeight: MAX_ROWS * ROW_HEIGHT + 8,
      }}
      className="fixed z-50 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-800"
    >
      {items.map((s, i) => (
        <li key={s.label} role="option" aria-selected={i === activeIndex}>
          <button
            ref={i === activeIndex ? activeRef : undefined}
            type="button"
            onClick={() => onPick(i)}
            onMouseEnter={() => onHover(i)}
            className={`flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-sm transition-colors ${
              i === activeIndex
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
                : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/50'
            }`}
          >
            <span className="truncate">{s.label}</span>
            <span className="shrink-0 font-mono text-xs text-slate-400 dark:text-slate-500">
              {s.hint}
            </span>
          </button>
        </li>
      ))}
    </ul>,
    document.body,
  );
}
