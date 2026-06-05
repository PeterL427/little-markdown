/**
 * Compute the pixel position of a caret inside a <textarea>, relative to the
 * textarea's top-left padding box. Works by rendering an off-screen mirror div
 * styled identically to the textarea and measuring a marker span placed at the
 * caret offset — the standard approach, since the DOM exposes no caret rect for
 * form controls. Adapted from component/textarea-caret-position.
 */

// Style properties that affect text wrapping/metrics and must be mirrored.
const MIRRORED_PROPERTIES = [
  'boxSizing',
  'width',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'fontStyle',
  'fontVariant',
  'fontWeight',
  'fontStretch',
  'fontSize',
  'lineHeight',
  'fontFamily',
  'textAlign',
  'textTransform',
  'textIndent',
  'letterSpacing',
  'wordSpacing',
  'tabSize',
];

export interface CaretCoordinates {
  /** Distance from the textarea's top padding edge to the caret top. */
  top: number;
  /** Distance from the textarea's left padding edge to the caret. */
  left: number;
  /** Line height at the caret, for placing the menu just below it. */
  height: number;
}

export function getCaretCoordinates(
  el: HTMLTextAreaElement,
  position: number,
): CaretCoordinates {
  const computed = window.getComputedStyle(el);
  const div = document.createElement('div');
  const style = div.style as unknown as Record<string, string>;
  const src = computed as unknown as Record<string, string>;

  style.position = 'absolute';
  style.visibility = 'hidden';
  style.whiteSpace = 'pre-wrap';
  style.wordWrap = 'break-word';
  style.overflow = 'hidden';
  for (const prop of MIRRORED_PROPERTIES) style[prop] = src[prop];
  document.body.appendChild(div);

  div.textContent = el.value.slice(0, position);
  const span = document.createElement('span');
  // The remaining text (or a placeholder) lets the span sit at the caret.
  span.textContent = el.value.slice(position) || '.';
  div.appendChild(span);

  const coords: CaretCoordinates = {
    top: span.offsetTop + parseInt(computed.borderTopWidth || '0', 10),
    left: span.offsetLeft + parseInt(computed.borderLeftWidth || '0', 10),
    height: parseInt(computed.lineHeight || computed.fontSize || '18', 10),
  };

  document.body.removeChild(div);
  return coords;
}
