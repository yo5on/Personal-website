// Each nav item is its own page, addressed by hash (#work, #maker…) so it survives a refresh and works under
// GitHub Pages' sub-path without a server fallback. #work/<id> is a project view over the Work page.
// Origin (the hero) is the landing page: no hash, #top and unknown hashes all open it.
export const PAGES = ['origin', 'work', 'maker', 'credentials', 'contact']
export const pageFromHash = hash => {
  const id = hash.replace(/^#/, '').split('/')[0]
  return PAGES.includes(id) ? id : 'origin'
}
