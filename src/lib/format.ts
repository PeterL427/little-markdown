import type { Note } from '../types';

/** Display title, falling back to a placeholder for untitled notes. */
export function noteTitle(note: Note): string {
  return note.title.trim() || '无标题笔记';
}

/** A short, plain-text preview of the body for the note list. */
export function notePreview(note: Note): string {
  const text = note.content
    // strip the most common Markdown markers for a cleaner snippet
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_~`>-]/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  return text || '暂无更多内容';
}

/** Human-friendly relative-ish timestamp for the note list. */
export function formatTimestamp(ms: number): string {
  const date = new Date(ms);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();

  if (sameDay) {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

/** Format a byte count as a compact human-readable size (B / KB / MB). */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}
