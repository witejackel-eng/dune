"use client";

import Link from "next/link";

interface CTAProps {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "outline";
  className?: string;
  /** Cursor label shown when hovering. */
  cursorLabel?: string;
  ariaLabel?: string;
}

/**
 * Brief §27: No giant pill buttons. Square corners. Thin one-pixel borders.
 */
export function CTA({
  href,
  onClick,
  children,
  variant = "primary",
  className = "",
  cursorLabel,
  ariaLabel,
}: CTAProps) {
  const base =
    "group inline-flex items-center gap-3 px-5 py-3 font-mono text-[11px] tracking-[0.18em] uppercase transition-all duration-300 focus-visible:outline-1 focus-visible:outline-amber focus-visible:outline-offset-2";

  const variants = {
    primary: "bg-amber text-carbon hover:bg-bone",
    outline:
      "border border-dust/30 text-dust hover:border-amber hover:text-amber",
    ghost: "text-dust/70 hover:text-amber",
  };

  const cursorAttrs = cursorLabel
    ? { "data-cursor": "activate", "data-cursor-label": cursorLabel }
    : { "data-cursor": "enter" };

  if (href) {
    return (
      <Link
        href={href}
        className={`${base} ${variants[variant]} ${className}`}
        aria-label={ariaLabel}
        {...cursorAttrs}
      >
        {children}
        <span className="transition-transform group-hover:translate-x-1">→</span>
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`${base} ${variants[variant]} ${className}`}
      aria-label={ariaLabel}
      {...cursorAttrs}
    >
      {children}
      <span className="transition-transform group-hover:translate-x-1">→</span>
    </button>
  );
}
