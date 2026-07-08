import { useState, type CSSProperties } from 'react';
import { cn } from '../ui/utils';

// Plain hex values (not Tailwind bg-* classes) so the placeholder renders
// correctly when captured by html2canvas for the shareable product card.
// Tailwind v4's default palette uses oklch() colors, which html2canvas
// cannot paint, so it would silently render a blank/black box there.
const PLACEHOLDER_COLORS = [
  '#f43f5e', // rose
  '#f97316', // orange
  '#f59e0b', // amber
  '#65a30d', // lime
  '#10b981', // emerald
  '#14b8a6', // teal
  '#0891b2', // cyan
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#d946ef', // fuchsia
  '#ec4899', // pink
];

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function getColorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PLACEHOLDER_COLORS[Math.abs(hash) % PLACEHOLDER_COLORS.length];
}

/**
 * Drop-in replacement for a raw <img> product thumbnail/hero. Shows the
 * product photo when `imageUrl` is set and loads successfully; otherwise
 * (missing URL, empty string, or a broken/expired URL) falls back to a
 * colored circle/square with the product's initials, so the UI never shows
 * a broken-image icon or an empty box.
 */
export function ProductImage({
  imageUrl,
  name,
  className,
  style,
}: {
  imageUrl?: string;
  name: string;
  className?: string;
  style?: CSSProperties;
}) {
  const [failed, setFailed] = useState(false);
  const showPlaceholder = !imageUrl || failed;

  if (showPlaceholder) {
    return (
      <div
        className={cn('flex items-center justify-center font-semibold text-white select-none', className)}
        style={{ backgroundColor: getColorForName(name || '?'), ...style }}
        aria-label={name}
        role="img"
      >
        {getInitials(name)}
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={name}
      onError={() => setFailed(true)}
      className={cn(className)}
      style={style}
    />
  );
}