import { HandwritingText } from '@/components/ui/handwriting-text'

// The traced word is drawn from the same face as the type around it, self-hosted so the outlines match
// exactly: Instrument Serif Italic (Latin subset) for display statements, IBM Plex Mono Italic (Fontsource
// Latin WOFF) for technical annotations. SIL OFL; licences: /fonts/OFL-InstrumentSerif.txt, /fonts/OFL-IBMPlexMono.txt
export const INK_FONTS = {
  display: 'fonts/InstrumentSerif-Italic-latin.ttf',
  code: 'fonts/IBMPlexMono-Italic-latin.woff',
}

/**
 * A word in the site's italic that writes itself, then inks in. The real text stays in
 * the DOM (visually hidden) for screen readers and search; the drawing is decorative.
 * `pending` keeps the space reserved but blank until the word should start writing.
 */
export default function InkWord({ text, font = INK_FONTS.display, pending = false, ...props }) {
  return <>
    <span className="sr-only">{text}</span>
    <span aria-hidden="true">
      {pending
        ? <span style={{ opacity: 0 }}>{text}</span>
        : <HandwritingText text={text} fontUrl={font} matchText strokeWidth={0.8} holdFallback={2500} {...props} />}
    </span>
  </>
}
