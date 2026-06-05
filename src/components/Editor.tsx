import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react';
import type { Note, NotePatch } from '../types';
import { formatTimestamp } from '../lib/format';
import { imageFilesToMarkdown } from '../lib/image';
import { downloadNoteAsMarkdown } from '../lib/export';
import { detectSlashTrigger, filterSnippets } from '../lib/snippets';
import SnippetMenu from './SnippetMenu';
import { DownloadIcon, ImageIcon, TrashIcon } from './icons';

interface EditorProps {
  note: Note;
  onChange: (patch: NotePatch) => void;
  onDelete: () => void;
}

interface MenuState {
  /** Index of the triggering `/` in the content. */
  start: number;
  /** Text typed after the `/`. */
  query: string;
  /** Highlighted item within the filtered list. */
  index: number;
}

/**
 * Title + body editor. Markdown snippets can be inserted via a slash (`/`)
 * command menu; images via the toolbar button or paste (dragging files onto
 * the window is handled globally in App).
 */
export default function Editor({ note, onChange, onDelete }: EditorProps) {
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setProcessing] = useState(false);
  const [menu, setMenu] = useState<MenuState | null>(null);

  const menuItems = menu ? filterSnippets(menu.query) : [];

  // Focus the title when switching to a brand-new (empty) note so the user can
  // start typing immediately, without stealing focus when revisiting old ones.
  useEffect(() => {
    if (!note.title && !note.content) {
      titleRef.current?.focus();
    }
  }, [note.id, note.title, note.content]);

  // Close the menu whenever the open note changes out from under us.
  useEffect(() => {
    setMenu(null);
  }, [note.id]);

  // Insert text at the caret (or replace the selection), then restore focus.
  const insertAtCursor = useCallback(
    (snippet: string) => {
      const ta = contentRef.current;
      if (!ta) {
        onChange({ content: note.content + snippet });
        return;
      }
      const { value, selectionStart: start, selectionEnd: end } = ta;
      onChange({ content: value.slice(0, start) + snippet + value.slice(end) });
      const caret = start + snippet.length;
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(caret, caret);
      });
    },
    [note.content, onChange],
  );

  // Process image files and insert them as Markdown at the caret.
  const handleFiles = useCallback(
    async (files: FileList | File[] | null) => {
      if (!files) return;
      setProcessing(true);
      try {
        const md = await imageFilesToMarkdown(Array.from(files));
        if (md) insertAtCursor(`\n${md}\n`);
      } catch (err) {
        window.alert(err instanceof Error ? err.message : '图片处理失败');
      } finally {
        setProcessing(false);
      }
    },
    [insertAtCursor],
  );

  // Re-evaluate the slash trigger after every content change / caret move.
  function refreshMenu(value: string, caret: number) {
    const trigger = detectSlashTrigger(value, caret);
    if (trigger && filterSnippets(trigger.query).length > 0) {
      setMenu({ start: trigger.start, query: trigger.query, index: 0 });
    } else {
      setMenu(null);
    }
  }

  function handleContentChange(e: ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    onChange({ content: value });
    refreshMenu(value, e.target.selectionStart);
  }

  // Replace the `/query` with the chosen snippet and drop the caret at its
  // placeholder offset.
  function insertSnippet(index: number) {
    const snippet = menuItems[index];
    const ta = contentRef.current;
    if (!menu || !snippet || !ta) return;
    const value = ta.value;
    const from = menu.start;
    const to = from + 1 + menu.query.length;
    onChange({ content: value.slice(0, from) + snippet.body + value.slice(to) });
    const caret = from + snippet.caret;
    setMenu(null);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(caret, caret);
    });
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (!menu || menuItems.length === 0) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setMenu({ ...menu, index: (menu.index + 1) % menuItems.length });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setMenu({
          ...menu,
          index: (menu.index - 1 + menuItems.length) % menuItems.length,
        });
        break;
      case 'Enter':
      case 'Tab':
        e.preventDefault();
        insertSnippet(menu.index);
        break;
      case 'Escape':
        e.preventDefault();
        setMenu(null);
        break;
    }
  }

  return (
    <section className="flex h-full min-w-0 flex-col bg-white dark:bg-slate-900">
      <header className="border-b border-slate-200 px-6 pt-5 pb-3 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <input
            ref={titleRef}
            type="text"
            value={note.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="无标题笔记"
            className="min-w-0 flex-1 bg-transparent text-2xl font-semibold text-slate-800 placeholder:text-slate-300 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-600"
          />
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="插入图片(也可粘贴,或拖拽到窗口)"
              aria-label="插入图片"
              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <ImageIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => downloadNoteAsMarkdown(note)}
              title="导出为 .md 文件"
              aria-label="导出为 Markdown 文件"
              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <DownloadIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              title="删除笔记"
              aria-label="删除笔记"
              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          编辑于 {formatTimestamp(note.updatedAt)}
        </p>
      </header>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = '';
        }}
      />

      <textarea
        ref={contentRef}
        value={note.content}
        onChange={handleContentChange}
        onKeyDown={handleKeyDown}
        onBlur={() => setMenu(null)}
        onPaste={(e) => {
          const files = e.clipboardData?.files;
          if (
            files &&
            Array.from(files).some((f) => f.type.startsWith('image/'))
          ) {
            e.preventDefault();
            void handleFiles(files);
          }
        }}
        placeholder={
          '# 开始用 Markdown 写作…\n\n' +
          '输入 / 唤起片段菜单(图片、链接、代码块、表格…),' +
          '也支持粘贴或拖拽图片。'
        }
        spellCheck={false}
        className="min-h-0 flex-1 resize-none bg-transparent px-6 py-4 font-mono text-sm leading-relaxed text-slate-700 placeholder:text-slate-300 focus:outline-none dark:text-slate-200 dark:placeholder:text-slate-600"
      />

      {menu && menuItems.length > 0 && (
        <SnippetMenu
          items={menuItems}
          activeIndex={menu.index}
          textarea={contentRef.current}
          anchor={menu.start}
          onPick={insertSnippet}
          onHover={(i) => setMenu((m) => (m ? { ...m, index: i } : m))}
        />
      )}

      <footer className="flex items-center justify-between border-t border-slate-200 px-6 py-2 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
        <span>
          {isProcessing ? '正在处理图片…' : `${note.content.length} 字符`}
        </span>
        <span className="font-mono">输入 / 插入片段</span>
      </footer>
    </section>
  );
}
