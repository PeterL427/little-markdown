export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

/** Fields of a note that the editor is allowed to change. */
export type NotePatch = Partial<Pick<Note, 'title' | 'content'>>;
