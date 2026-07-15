"use client";

/** Brief §6: Original SVG emblem. Two offset arcs, one vertical measurement axis, one displaced point. */
export function Emblem({
  className = "",
  size = 24,
  withHorizon = false,
}: {
  className?: string;
  size?: number;
  withHorizon?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Outer arc — wider orbit */}
      <path
        d="M 8 44 A 24 24 0 0 1 56 44"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        opacity="0.95"
      />
      {/* Inner arc — phase-shifted */}
      <path
        d="M 14 30 A 16 16 0 0 1 46 30"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        opacity="0.55"
      />
      {/* Vertical measurement axis */}
      <line
        x1="32"
        y1="6"
        x2="32"
        y2="58"
        stroke="currentColor"
        strokeWidth="0.75"
        opacity="0.45"
      />
      {/* Tick marks */}
      <line x1="29" y1="14" x2="35" y2="14" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="29" y1="32" x2="35" y2="32" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="29" y1="50" x2="35" y2="50" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      {/* Displaced point — signal crossing the horizon */}
      <circle cx="42" cy="20" r="1.6" fill="#A43124" />
      {withHorizon && (
        <line x1="6" y1="58" x2="58" y2="58" stroke="#3A2417" strokeWidth="0.75" />
      )}
    </svg>
  );
}
