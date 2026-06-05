import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Note, NotePatch } from '../types';
import { loadNotes, saveNotes } from '../lib/storage';

export interface UseNotes {
  notes: Note[];
  selectedId: string | null;
  selectedNote: Note | null;
  createNote: () => void;
  updateNote: (id: string, patch: NotePatch) => void;
  deleteNote: (id: string) => void;
  selectNote: (id: string) => void;
  /** Add one or more notes (e.g. from imported files) and select the first. */
  addNotes: (items: Pick<Note, 'title' | 'content'>[]) => void;
  /** Set when the last save failed (e.g. LocalStorage quota exceeded). */
  persistError: string | null;
}

/**
 * Owns the note collection and the current selection, and keeps the
 * collection mirrored to LocalStorage. Notes are kept sorted with the most
 * recently updated first.
 */
export function useNotes(): UseNotes {
  const [notes, setNotes] = useState<Note[]>(() => sortByUpdated(loadNotes()));
  const [selectedId, setSelectedId] = useState<string | null>(
    () => notes[0]?.id ?? null,
  );
  const [persistError, setPersistError] = useState<string | null>(null);

  // Persist whenever the collection changes.
  useEffect(() => {
    const ok = saveNotes(notes);
    setPersistError(
      ok
        ? null
        : '存储空间不足,最近的更改可能未保存。请删除部分图片或笔记后重试。',
    );
  }, [notes]);

  // If the selected note disappears (e.g. it was deleted), fall back to the
  // first remaining note, or clear the selection when the list is empty.
  useEffect(() => {
    if (selectedId !== null && !notes.some((n) => n.id === selectedId)) {
      setSelectedId(notes[0]?.id ?? null);
    }
  }, [notes, selectedId]);

  const createNote = useCallback(() => {
    const now = Date.now();
    const note: Note = {
      id: crypto.randomUUID(),
      title: '',
      content: '',
      createdAt: now,
      updatedAt: now,
    };
    setNotes((prev) => [note, ...prev]);
    setSelectedId(note.id);
  }, []);

  const addNotes = useCallback(
    (items: Pick<Note, 'title' | 'content'>[]) => {
      if (items.length === 0) return;
      const base = Date.now();
      const created: Note[] = items.map((item, i) => {
        // Descending timestamps keep the first imported note newest (on top).
        const ts = base + (items.length - 1 - i);
        return {
          id: crypto.randomUUID(),
          title: item.title,
          content: item.content,
          createdAt: ts,
          updatedAt: ts,
        };
      });
      setNotes((prev) => sortByUpdated([...created, ...prev]));
      setSelectedId(created[0].id);
    },
    [],
  );

  const updateNote = useCallback((id: string, patch: NotePatch) => {
    setNotes((prev) =>
      sortByUpdated(
        prev.map((n) =>
          n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n,
        ),
      ),
    );
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const selectNote = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const selectedNote = useMemo(
    () => notes.find((n) => n.id === selectedId) ?? null,
    [notes, selectedId],
  );

  return {
    notes,
    selectedId,
    selectedNote,
    createNote,
    updateNote,
    deleteNote,
    selectNote,
    addNotes,
    persistError,
  };
}

function sortByUpdated(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => b.updatedAt - a.updatedAt);
}
