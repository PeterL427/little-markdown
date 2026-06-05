import { createPortal } from 'react-dom';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { XIcon } from './icons';

interface LightboxProps {
  src: string;
  alt: string;
  onClose: () => void;
}

/** Full-screen image viewer. Closes on backdrop click, the button, or Escape. */
export default function Lightbox({ src, alt, onClose }: LightboxProps) {
  useEscapeKey(true, onClose);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt || '图片预览'}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="关闭"
        title="关闭 (Esc)"
        className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        <XIcon className="h-5 w-5" />
      </button>
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
      />
    </div>,
    document.body,
  );
}
