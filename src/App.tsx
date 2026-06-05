import { useMemo, useState } from 'react';
import { useNotes } from './hooks/useNotes';
import { useTheme } from './hooks/useTheme';
import { useFileDrop } from './hooks/useFileDrop';
import { noteTitle } from './lib/format';
import { readNoteFiles } from './lib/importer';
import { imageFilesToMarkdown } from './lib/image';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import MarkdownPreview from './components/MarkdownPreview';
import ConfirmDialog from './components/ConfirmDialog';
import { NoteIcon, PlusIcon, UploadIcon } from './components/icons';

export default function App() {
  const {
    notes,
    selectedId,
    selectedNote,
    createNote,
    updateNote,
    deleteNote,
    selectNote,
    addNotes,
    persistError,
  } = useNotes();
  const { theme, toggleTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Filter the list by title or body, case-insensitively. Selection is left
  // untouched so a non-matching open note stays editable while you search.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q),
    );
  }, [notes, query]);

  // Approximate LocalStorage footprint, for the sidebar usage meter.
  const usageBytes = useMemo(() => {
    try {
      return new Blob([JSON.stringify(notes)]).size;
    } catch {
      return 0;
    }
  }, [notes]);

  const pendingNote = notes.find((n) => n.id === pendingDeleteId) ?? null;

  function confirmDelete() {
    if (pendingDeleteId) deleteNote(pendingDeleteId);
    setPendingDeleteId(null);
  }

  async function handleImport(files: FileList | null) {
    if (!files || files.length === 0) return;
    try {
      const parsed = await readNoteFiles(files);
      if (parsed.length === 0) {
        window.alert('请选择 .md / .markdown / .txt 文件');
        return;
      }
      addNotes(parsed);
    } catch {
      window.alert('导入失败,无法读取文件');
    }
  }

  // Files dropped anywhere on the window: .md → new notes, images → current note.
  async function handleDroppedFiles(files: FileList) {
    const all = Array.from(files);
    try {
      const parsed = await readNoteFiles(all);
      const imageMd = await imageFilesToMarkdown(all);

      if (imageMd) {
        if (selectedNote) {
          updateNote(selectedNote.id, {
            content: `${selectedNote.content}\n${imageMd}\n`,
          });
        } else {
          // No note open — make the images their own new note.
          parsed.unshift({ title: '', content: `${imageMd}\n` });
        }
      }

      if (parsed.length > 0) {
        addNotes(parsed);
      } else if (!imageMd) {
        window.alert('未找到可导入的 .md 文件或图片');
      }
    } catch (err) {
      window.alert(err instanceof Error ? err.message : '处理拖放文件失败');
    }
  }

  const isDraggingFile = useFileDrop(handleDroppedFiles);

  return (
    <div className="flex h-full flex-col bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      {persistError && (
        <div className="shrink-0 border-b border-amber-200 bg-amber-100 px-4 py-2 text-sm text-amber-800 dark:border-amber-800/60 dark:bg-amber-900/40 dark:text-amber-200">
          {persistError}
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <Sidebar
          notes={filtered}
          totalCount={notes.length}
          selectedId={selectedId}
          query={query}
          theme={theme}
          usageBytes={usageBytes}
          onQueryChange={setQuery}
          onSelect={selectNote}
          onCreate={createNote}
          onDelete={(id) => setPendingDeleteId(id)}
          onToggleTheme={toggleTheme}
          onImport={handleImport}
        />

        <main className="flex min-w-0 flex-1">
          {selectedNote ? (
            <>
              <section className="min-w-0 flex-1 border-r border-slate-200 dark:border-slate-800">
                <Editor
                  note={selectedNote}
                  onChange={(patch) => updateNote(selectedNote.id, patch)}
                  onDelete={() => setPendingDeleteId(selectedNote.id)}
                />
              </section>

              <section className="flex min-w-0 flex-1 flex-col bg-white dark:bg-slate-900">
                <div className="shrink-0 border-b border-slate-200 px-8 py-3 text-xs font-medium tracking-wide text-slate-400 uppercase dark:border-slate-800 dark:text-slate-500">
                  预览
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
                  <MarkdownPreview content={selectedNote.content} theme={theme} />
                </div>
              </section>
            </>
          ) : (
            <WelcomeScreen onCreate={createNote} />
          )}
        </main>
      </div>

      {isDraggingFile && (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-6 backdrop-blur-sm">
          <div className="rounded-2xl border-2 border-dashed border-indigo-400 bg-white/90 px-10 py-8 text-center shadow-xl dark:bg-slate-800/90">
            <UploadIcon className="mx-auto h-9 w-9 text-indigo-500 dark:text-indigo-400" />
            <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-100">
              拖放文件到此处
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              .md 文件导入为新笔记 · 图片插入当前笔记
            </p>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="删除笔记"
        message={
          pendingNote
            ? `确定删除“${noteTitle(pendingNote)}”吗?\n此操作无法撤销。`
            : ''
        }
        confirmLabel="删除"
        cancelLabel="取消"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}

function WelcomeScreen({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 text-center dark:bg-slate-900">
      <NoteIcon className="h-14 w-14 text-slate-300 dark:text-slate-700" />
      <h2 className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-200">
        未选择笔记
      </h2>
      <p className="mt-1 max-w-xs text-sm text-slate-400 dark:text-slate-500">
        新建一篇笔记,开始用 Markdown 写作并实时预览。
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-5 inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
      >
        <PlusIcon className="h-4 w-4" />
        新建笔记
      </button>
    </div>
  );
}
