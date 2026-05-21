import { memo } from "react";

const PALETTE = [
  { bg: "#FF6B6B", skin: "#FFE0B2" },
  { bg: "#4ECDC4", skin: "#FFD7A8" },
  { bg: "#FFEAA7", skin: "#FFC9A0" },
  { bg: "#A78BFA", skin: "#FFE0B2" },
  { bg: "#6FCF7B", skin: "#FFDCB4" },
  { bg: "#F2994A", skin: "#FFE0B2" },
  { bg: "#56CCF2", skin: "#FFDCB4" },
  { bg: "#EB5757", skin: "#FFE0B2" },
  { bg: "#2D3436", skin: "#FFDCB4" },
];

export const AVATAR_IDS = PALETTE.map((_, i) => `a${i}`);

interface Props { id: string; size?: number; className?: string }

export const Avatar = memo(function Avatar({ id, size = 56, className }: Props) {
  const i = Math.max(0, AVATAR_IDS.indexOf(id));
  const { bg, skin } = PALETTE[i] ?? PALETTE[0];
  const expressions = i % 3; // 0 smile, 1 oh, 2 grin
  return (
    <svg
      width={size} height={size} viewBox="0 0 64 64" className={className}
      aria-label={`avatar ${id}`}
    >
      <rect x="2" y="2" width="60" height="60" rx="16" ry="14" fill={bg} stroke="#2D3436" strokeWidth="2.5" />
      {/* hair / hat alt */}
      {i % 2 === 0 && (
        <path d="M14 26 Q32 8 50 26 L50 30 L14 30 Z" fill="#2D3436" />
      )}
      {i % 2 === 1 && (
        <path d="M14 28 Q32 14 50 28" stroke="#2D3436" strokeWidth="3" fill="none" strokeLinecap="round" />
      )}
      <circle cx="32" cy="38" r="14" fill={skin} stroke="#2D3436" strokeWidth="2" />
      {/* eyes */}
      <circle cx="27" cy="36" r="1.8" fill="#2D3436" />
      <circle cx="37" cy="36" r="1.8" fill="#2D3436" />
      {/* mouth */}
      {expressions === 0 && <path d="M27 43 Q32 47 37 43" stroke="#2D3436" strokeWidth="2" fill="none" strokeLinecap="round" />}
      {expressions === 1 && <circle cx="32" cy="44" r="2" fill="#2D3436" />}
      {expressions === 2 && <path d="M26 42 Q32 48 38 42 L36 46 Q32 49 28 46 Z" fill="#2D3436" />}
      {/* cheek */}
      <circle cx="23" cy="42" r="2" fill="#FF6B6B" opacity="0.55" />
      <circle cx="41" cy="42" r="2" fill="#FF6B6B" opacity="0.55" />
    </svg>
  );
});
