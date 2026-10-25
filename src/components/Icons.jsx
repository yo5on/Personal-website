/*
 * Interface icons, drawn as inline SVG so they render identically everywhere.
 * Unicode arrows (↗ → ↑ ×) fall back to colour emoji on some platforms, so they
 * are not used for UI. Icons are decorative: the text beside them carries the meaning.
 */

const base = {
  viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4,
  strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, focusable: 'false',
}

export function ArrowUpRight({ className = 'icon' }) {
  return <svg {...base} className={className}><path d="M5 11 11 5M6 5h5v5" /></svg>
}

export function ArrowRight({ className = 'icon' }) {
  return <svg {...base} className={className}><path d="M3 8h10M9.5 4.5 13 8l-3.5 3.5" /></svg>
}

export function ArrowUp({ className = 'icon' }) {
  return <svg {...base} className={className}><path d="M8 13V3M4.5 6.5 8 3l3.5 3.5" /></svg>
}

export function Close({ className = 'icon' }) {
  return <svg {...base} className={className}><path d="m4 4 8 8M12 4l-8 8" /></svg>
}

/**
 * The wordmark's mark: the starburst (public/images/starburst.svg, traced from the reference artwork) in plain
 * white, painted through a CSS mask so the one file serves every colour; public/images/starburst-favicon.svg is
 * the same path in black / white for the tab.
 */
export function BrandStar({ className = 'brand-mark' }) {
  return <span className={className} aria-hidden="true" />
}

/** A link that opens in a new tab: label, external-link icon, and a screen-reader notice. */
export function ExternalLink({ href, children, className }) {
  return (
    <a className={className} href={href} target="_blank" rel="noreferrer">
      {children}<ArrowUpRight className="icon icon-ext" />
      <span className="sr-only"> (opens in new tab)</span>
    </a>
  )
}
