import { useRef } from 'react';
import type { Note } from '../types';
import type { Theme } from '../hooks/useTheme';
import { noteTitle, notePreview, formatTimestamp, formatBytes } from '../lib/format';
import {
  MoonIcon,
  NoteIcon,
  PlusIcon,
  SearchIcon,
  SunIcon,
  TrashIcon,
  UploadIcon,
  XIcon,
} from './icons';

// Nominal LocalStorage budget (most browsers cap at ~5 MB) for the meter.
const STORAGE_BUDGET = 5 * 1024 * 1024;

interface SidebarProps {
  notes: Note[];
  totalCount: number;
  selectedId: string | null;
  query: string;
  theme: Theme;
  usageBytes: number;
  onQueryChange: (query: string) => void;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onToggleTheme: () => void;
  onImport: (files: FileList | null) => void;
}

/** Left rail: branding, theme toggle, new-note action, search, and the list. */
export default function Sidebar({
  notes,
  totalCount,
  selectedId,
  query,
  theme,
  usageBytes,
  onQueryChange,
  onSelect,
  onCreate,
  onDelete,
  onToggleTheme,
  onImport,
}: SidebarProps) {
  const importInputRef = useRef<HTMLInputElement>(null);
  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
      <div className="border-b border-slate-200 p-3 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <h1 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <NoteIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Markdown 笔记
          </h1>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleTheme}
              title={theme === 'dark' ? '切换到浅色主题' : '切换到深色主题'}
              aria-label="切换主题"
              className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              {theme === 'dark' ? (
                <SunIcon className="h-4 w-4" />
              ) : (
                <MoonIcon className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              title="导入 .md 文件"
              aria-label="导入 Markdown 文件"
              className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <UploadIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onCreate}
              title="新建笔记"
              aria-label="新建笔记"
              className="rounded-md bg-indigo-600 p-1.5 text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <input
          ref={importInputRef}
          type="file"
          accept=".md,.markdown,.txt,text/markdown,text/plain"
          multiple
          className="hidden"
          onChange={(e) => {
            onImport(e.target.files);
            e.target.value = '';
          }}
        />

        <div className="relative mt-3">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="搜索笔记"
            className="w-full rounded-md border border-slate-200 bg-white py-1.5 pr-8 pl-8 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              title="清除搜索"
              aria-label="清除搜索"
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600 focus:outline-none dark:hover:text-slate-300"
            >
              <XIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {notes.length === 0 ? (
          <EmptyList hasNotes={totalCount > 0} query={query} />
        ) : (
          <ul>
            {notes.map((note) => (
              <NoteListItem
                key={note.id}
                note={note}
                selected={note.id === selectedId}
                onSelect={() => onSelect(note.id)}
                onDelete={() => onDelete(note.id)}
              />
            ))}
          </ul>
        )}
      </div>

      <footer className="space-y-1.5 border-t border-slate-200 px-3 py-2 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
        <div className="flex items-center justify-between">
          <span>
            {query
              ? `${notes.length} / ${totalCount} 篇笔记`
              : `${totalCount} 篇笔记`}
          </span>
          <span title={`已用 ${formatBytes(usageBytes)} / 5 MB`}>
            {formatBytes(usageBytes)}
          </span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className={`h-full rounded-full transition-all ${
              usageBytes / STORAGE_BUDGET >= 0.9
                ? 'bg-red-500'
                : usageBytes / STORAGE_BUDGET >= 0.7
                  ? 'bg-amber-500'
                  : 'bg-indigo-500'
            }`}
            style={{
              width: `${Math.min(100, (usageBytes / STORAGE_BUDGET) * 100)}%`,
            }}
          />
        </div>
      </footer>
    </aside>
  );
}

interface NoteListItemProps {
  note: Note;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function NoteListItem({ note, selected, onSelect, onDelete }: NoteListItemProps) {
  return (
    <li
      className={`group relative border-b border-l-2 border-slate-200 dark:border-slate-800 ${
        selected
          ? 'border-l-indigo-500 bg-white dark:bg-slate-800'
          : 'border-l-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60'
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="w-full px-3 py-2.5 pr-8 text-left focus:outline-none"
      >
        <h3
          className={`truncate text-sm font-medium ${
            selected
              ? 'text-indigo-700 dark:text-indigo-300'
              : 'text-slate-800 dark:text-slate-100'
          }`}
        >
          {noteTitle(note)}
        </h3>
        <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
          {notePreview(note)}
        </p>
        <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
          {formatTimestamp(note.updatedAt)}
        </p>
      </button>
      <button
        type="button"
        onClick={onDelete}
        title="删除笔记"
        aria-label={`删除笔记:${noteTitle(note)}`}
        className="absolute top-2 right-1.5 rounded p-1 text-slate-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 focus:opacity-100 focus:outline-none group-hover:opacity-100 dark:hover:bg-red-950/40 dark:hover:text-red-400"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </li>
  );
}

function EmptyList({ hasNotes, query }: { hasNotes: boolean; query: string }) {
  return (
    <div className="px-4 py-10 text-center text-sm text-slate-400 dark:text-slate-500">
      {hasNotes ? (
        <>
          没有匹配
          <span className="font-medium text-slate-500 dark:text-slate-300">
            “{query}”
          </span>
          的笔记。
        </>
      ) : (
        <>
          还没有笔记。
          <br />
          点击{' '}
          <span className="font-medium text-indigo-600 dark:text-indigo-400">
            +
          </span>{' '}
          新建一篇。
        </>
      )}
    </div>
  );
}
