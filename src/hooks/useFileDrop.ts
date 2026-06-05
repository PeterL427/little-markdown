import { useEffect, useRef, useState } from 'react';

/**
 * Window-level file drag-and-drop. Returns whether files are currently being
 * dragged over the window (for an overlay), and invokes `onDropFiles` with the
 * dropped files. Only file drags are intercepted — text/selection drags pass
 * through untouched.
 */
export function useFileDrop(onDropFiles: (files: FileList) => void): boolean {
  const [isDragging, setDragging] = useState(false);
  // dragenter/dragleave fire per child element; a depth counter avoids flicker.
  const depth = useRef(0);
  const onDropRef = useRef(onDropFiles);
  onDropRef.current = onDropFiles;

  useEffect(() => {
    const hasFiles = (e: DragEvent) =>
      !!e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files');

    function onDragEnter(e: DragEvent) {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth.current += 1;
      setDragging(true);
    }
    function onDragOver(e: DragEvent) {
      if (!hasFiles(e)) return;
      e.preventDefault(); // allow drop and stop the browser from opening files
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    }
    function onDragLeave(e: DragEvent) {
      if (!hasFiles(e)) return;
      depth.current -= 1;
      if (depth.current <= 0) {
        depth.current = 0;
        setDragging(false);
      }
    }
    function onDrop(e: DragEvent) {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth.current = 0;
      setDragging(false);
      if (e.dataTransfer && e.dataTransfer.files.length > 0) {
        onDropRef.current(e.dataTransfer.files);
      }
    }

    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, []);

  return isDragging;
}
