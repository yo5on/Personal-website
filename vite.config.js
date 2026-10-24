import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// Social cards need absolute URLs. The site origin is resolved at build time from:
//   1. SITE_URL — set explicitly (e.g. SITE_URL=https://example.com npm run build)
//   2. VERCEL_PROJECT_PRODUCTION_URL — provided by Vercel during its builds, as a
//      bare hostname (it follows a custom domain once one is assigned)
// When neither is set (local builds), image paths stay relative and no
// og:url / canonical tags are emitted, so no incorrect absolute URL is produced.
function resolveSiteUrl(env) {
  const raw = (env.SITE_URL || '').trim() || (env.VERCEL_PROJECT_PRODUCTION_URL || '').trim()
  if (!raw) return ''
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  try {
    const url = new URL(withScheme)
    return `${url.origin}${url.pathname}`.replace(/\/+$/, '')
  } catch {
    console.warn(`[social-urls] Ignoring invalid site URL "${raw}"; social image paths stay relative.`)
    return ''
  }
}

const siteUrl = resolveSiteUrl(process.env)

const socialUrls = {
  name: 'social-urls',
  transformIndexHtml(html) {
    const tags = siteUrl
      ? `<link rel="canonical" href="${siteUrl}/" />\n    <meta property="og:url" content="${siteUrl}/" />`
      : ''
    return html.replaceAll('%SITE_URL%', siteUrl).replace('<!--site-url-tags-->', tags)
  },
}

export default defineConfig({
  // Relative asset URLs: the site works at a domain root and under GitHub Pages' /Personal-website/ alike.
  // Safe because there is one page and in-page routes are hashes (#work/<id>), so the document URL never nests.
  base: './',
  plugins: [react(), socialUrls],
  // `@/` points at src/, the shadcn convention (e.g. `@/components/ui/handwriting-text`).
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
})
