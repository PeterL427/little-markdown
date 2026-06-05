/**
 * Slash-command snippets for the editor. Typing `/` at a word boundary opens a
 * filterable menu; picking an item replaces the `/query` text with `body` and
 * places the caret at `caret` (an offset within `body`).
 */

export interface Snippet {
  /** Menu label (Chinese). */
  label: string;
  /** Syntax preview shown on the right of the menu row. */
  hint: string;
  /** Space-separated search terms (Chinese, English, pinyin). */
  keywords: string;
  /** Text inserted in place of the `/query`. */
  body: string;
  /** Caret offset within `body` after insertion. */
  caret: number;
}

export const SNIPPETS: Snippet[] = [
  { label: '图片', hint: '![](url)', keywords: 'image img 图片 picture photo tupian tp', body: '![]()', caret: 4 },
  { label: '链接', hint: '[文字](url)', keywords: 'link 链接 url a lianjie lj', body: '[]()', caret: 1 },
  { label: '代码块', hint: '``` ```', keywords: 'code block 代码块 fence pre daimakuai dmk', body: '```\n\n```', caret: 4 },
  { label: '行内代码', hint: '`代码`', keywords: 'inline code 行内代码 hangneidaima', body: '``', caret: 1 },
  { label: '标题', hint: '# 标题', keywords: 'heading title 标题 h1 biaoti bt', body: '# ', caret: 2 },
  { label: '二级标题', hint: '## 标题', keywords: 'heading title 二级标题 h2 biaoti', body: '## ', caret: 3 },
  { label: '粗体', hint: '**粗体**', keywords: 'bold strong 粗体 cuti ct', body: '****', caret: 2 },
  { label: '斜体', hint: '*斜体*', keywords: 'italic em 斜体 xieti xt', body: '**', caret: 1 },
  { label: '引用', hint: '> 引用', keywords: 'quote blockquote 引用 yinyong yy', body: '> ', caret: 2 },
  { label: '无序列表', hint: '- 列表项', keywords: 'list ul bullet 无序列表 列表 liebiao lb', body: '- ', caret: 2 },
  { label: '有序列表', hint: '1. 列表项', keywords: 'list ol ordered 有序列表 列表 liebiao', body: '1. ', caret: 3 },
  { label: '任务列表', hint: '- [ ] 待办', keywords: 'task todo checkbox 任务列表 待办 renwu rw', body: '- [ ] ', caret: 6 },
  { label: '表格', hint: '表格', keywords: 'table 表格 grid biaoge bg', body: '| 列1 | 列2 |\n| --- | --- |\n| 单元 | 单元 |\n', caret: 2 },
  { label: '分割线', hint: '---', keywords: 'hr rule divider 分割线 fengexian fgx', body: '---\n', caret: 4 },
];

export interface SlashTrigger {
  /** Index of the `/` character in the textarea value. */
  start: number;
  /** Text typed after the `/`, up to the caret (never contains whitespace). */
  query: string;
}

/**
 * Detect an active slash trigger ending at `caret`. A trigger is a `/` at the
 * start of the text or right after whitespace, with no whitespace between it
 * and the caret. Returns null when there's no such `/`.
 */
export function detectSlashTrigger(value: string, caret: number): SlashTrigger | null {
  for (let i = caret - 1; i >= 0; i -= 1) {
    const ch = value[i];
    if (ch === '/') {
      const before = i === 0 ? '\n' : value[i - 1];
      if (before === '\n' || before === ' ' || before === '\t') {
        return { start: i, query: value.slice(i + 1, caret) };
      }
      return null;
    }
    if (ch === ' ' || ch === '\n' || ch === '\t') return null;
  }
  return null;
}

/** Snippets whose keywords contain the (case-insensitive) query. */
export function filterSnippets(query: string): Snippet[] {
  const q = query.trim().toLowerCase();
  if (!q) return SNIPPETS;
  return SNIPPETS.filter((s) => s.keywords.toLowerCase().includes(q));
}
