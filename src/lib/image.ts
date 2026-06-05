/**
 * Turns an image File into a Markdown-embeddable data URL. Because notes live
 * in LocalStorage (~5 MB total), large rasters are downscaled and recompressed
 * to keep embedded images small; vector/animated formats are embedded as-is.
 */

const MAX_DIMENSION = 1600; // px, longest side after downscaling
const MAX_SOURCE_BYTES = 10 * 1024 * 1024; // reject uploads larger than 10 MB
const DOWNSCALE_THRESHOLD = 200 * 1024; // only canvas-process rasters over 200 KB
const PASSTHROUGH_TYPES = ['image/gif', 'image/svg+xml']; // keep animation/vector

export interface ProcessedImage {
  /** A `data:` URL safe to embed in Markdown. */
  dataUrl: string;
  /** A cleaned-up base name for use as alt text. */
  name: string;
}

/** Read, validate, and (if needed) compress an image file. */
export async function processImageFile(file: File): Promise<ProcessedImage> {
  if (!file.type.startsWith('image/')) {
    throw new Error('只支持图片文件');
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error('图片太大,请选择小于 10MB 的图片');
  }

  const name = (file.name || 'image').replace(/\.[^./\\]+$/, '') || 'image';

  // Vector/animated or already-small images: embed verbatim.
  if (PASSTHROUGH_TYPES.includes(file.type) || file.size <= DOWNSCALE_THRESHOLD) {
    return { dataUrl: await readAsDataUrl(file), name };
  }

  // Large rasters: downscale + recompress. Fall back to a verbatim embed if
  // the canvas path fails for any reason.
  try {
    return { dataUrl: await downscale(file), name };
  } catch {
    return { dataUrl: await readAsDataUrl(file), name };
  }
}

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('读取文件失败'));
    reader.readAsDataURL(file);
  });
}

async function downscale(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas unavailable');
    ctx.drawImage(img, 0, 0, width, height);

    // PNG keeps transparency; everything else becomes JPEG for size.
    const outType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    return canvas.toDataURL(outType, 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = src;
  });
}

/**
 * Process the image files in a selection and join them into Markdown image
 * syntax (`![name](dataUrl)`), one per line. Non-image files are ignored;
 * returns an empty string if there are none.
 */
export async function imageFilesToMarkdown(files: File[]): Promise<string> {
  const images = files.filter((f) => f.type.startsWith('image/'));
  const snippets: string[] = [];
  for (const file of images) {
    const { dataUrl, name } = await processImageFile(file);
    snippets.push(`![${name}](${dataUrl})`);
  }
  return snippets.join('\n');
}
