import type { Note } from '../types';

const STORAGE_KEY = 'markdown-notes:v1';

/** Read every note from LocalStorage, tolerating missing/corrupt data. */
export function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Keep only objects that look like a Note.
    return parsed.filter(isNote);
  } catch {
    return [];
  }
}

/** Persist the full list of notes. Returns false on quota/serialization errors. */
export function saveNotes(notes: Note[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    return true;
  } catch {
    /* storage full or unavailable */
    return false;
  }
}

function isNote(value: unknown): value is Note {
  if (typeof value !== 'object' || value === null) return false;
  const n = value as Record<string, unknown>;
  return (
    typeof n.id === 'string' &&
    typeof n.title === 'string' &&
    typeof n.content === 'string' &&
    typeof n.createdAt === 'number' &&
    typeof n.updatedAt === 'number'
  );
}
