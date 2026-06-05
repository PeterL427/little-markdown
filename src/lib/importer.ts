export interface ParsedNote {
  title: string;
  content: string;
}

const MARKDOWN_EXT = /\.(md|markdown|mdown|mkd|txt)$/i;

function isMarkdownFile(file: File): boolean {
  return (
    MARKDOWN_EXT.test(file.name) ||
    file.type === 'text/markdown' ||
    file.type === 'text/plain'
  );
}

/**
 * Derive a title + body from a Markdown file. A leading H1 becomes the title
 * (mirroring export, so an exported file round-trips); otherwise the filename
 * is used and the whole text is kept as the body.
 */
export function parseMarkdownFile(filename: string, text: string): ParsedNote {
  const normalized = text.replace(/\r\n/g, '\n');
  const match = normalized.match(/^\s*#\s+(.+?)[ \t]*(?:\n|$)/);
  if (match) {
    const title = match[1].trim();
    // Drop the H1 line and one following blank line so the body reads cleanly.
    const content = normalized.slice(match[0].length).replace(/^\n/, '');
    return { title, content };
  }
  return { title: filename.replace(MARKDOWN_EXT, '').trim(), content: normalized };
}

/** Read and parse the Markdown files from a selection (other types ignored). */
export async function readNoteFiles(
  files: FileList | File[],
): Promise<ParsedNote[]> {
  const markdownFiles = Array.from(files).filter(isMarkdownFile);
  return Promise.all(
    markdownFiles.map(async (file) =>
      parseMarkdownFile(file.name, await file.text()),
    ),
  );
}
