import type { Note } from '../types';
import { noteTitle } from './format';

/**
 * Serialize a note to Markdown. The title lives in a separate field, so prepend
 * it as an H1 — unless the body already opens with a top-level heading, to
 * avoid a duplicate title.
 */
export function noteToMarkdown(note: Note): string {
  const title = note.title.trim();
  const body = note.content;
  if (title && !/^\s*#\s/.test(body)) {
    return `# ${title}\n\n${body}`;
  }
  return body;
}

/** Build a filesystem-safe `.md` filename from the note title. */
function exportFilename(note: Note): string {
  const base = noteTitle(note)
    // Collapse illegal filename characters, spaces, and hyphens to underscores.
    .replace(/[\\/:*?"<>|\x00-\x1f]+/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
  return `${base || 'note'}.md`;
}

/** Trigger a browser download of the note as a `.md` file. */
export function downloadNoteAsMarkdown(note: Note): void {
  const md = noteToMarkdown(note);
  const text = md.endsWith('\n') ? md : `${md}\n`;
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = exportFilename(note);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
