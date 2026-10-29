<div align="center">

<samp><b>YO5ON — THINK. INNOVATE. FABRICATE.</b></samp>

<samp>react · vite · motion · three.js · react three fiber</samp>

<samp><a href="https://yo5on.github.io/Personal-website/">yo5on.github.io/Personal-website</a></samp>

</div>

---

<div align="center"><samp>The personal website of Yoson, a CSE student specializing in AI / ML. It unifies two earlier sites — the editorial <a href="https://github.com/yo5on/Portfolio">Portfolio</a> and the interactive 3D <a href="https://github.com/yo5on/Aboutme">Aboutme</a> — as one "Specimen &amp; Maker" site.</samp></div>

---

<div align="center"><samp><b>Concept</b></samp></div>

- <samp><b>Fig. 01 — the specimen.</b> Portfolio's hero: the engraved moth in crimson ribbons, now under the headline <i>Think. Innovate. Fabricate.</i> with the tagline <i>“Small, sharp tools over big, vague ideas.”</i> Pure 2D, no 3D cost.</samp>
- <samp><b>Selected work.</b> Nine projects, each tagged with a verb and filterable by it: <b>Think</b> (FakeGuard, Agentic AI pest monitoring, AI Personal Tutor), <b>Innovate</b> (Daymark, Maze Runner), <b>Fabricate</b> (Line Follower, Robotic Arm, Sparky, Gesture RC Car). Every project opens a full-screen view with its own link (<code>#work/&lt;id&gt;</code>); three have full case studies.</samp>
- <samp><b>Fig. 02 — the maker.</b> The Aboutme 3D bust (with its eye tracking, nose bandage and cheek kiss) on a sticky stage behind ordinary scrolling cards — Education → Think → Innovate → Fabricate → Say hi — which together are the About, practice and résumé. Each card is a camera stop. Nothing is pinned or scroll-jacked.</samp>
- <samp><b>Credentials.</b> Portfolio's certificate carousel (13 entries, every PDF and preview) plus a hackathon ledger (Tech Utsav / FakeGuard, InHack, Adobe).</samp>
- <samp><b>Contact.</b> Email, GitHub, LinkedIn.</samp>

<samp>There is no résumé PDF in either source site, so the timeline is the résumé view; add a file and a link to it in <code>src/data/content.js</code> if one becomes available.</samp>

---

<div align="center"><samp><b>Design</b></samp></div>

- <samp><b>Palette</b> — midnight navy <code>#1B1E4A</code>, warm stone <code>#AFAEA2</code>, crimson <code>#D21319</code> (display text <code>#DA1E24</code> for contrast). The 3D sky is re-graded navy → deep navy, lit by a warm stone key and a crimson rim light, so the bust sits in the moth's world.</samp>
- <samp><b>Type</b> — Instrument Serif (display), Instrument Sans (interface and reading), IBM Plex Mono (technical detail); Hello Wimsy for the wordmark.</samp>
- <samp><b>Motion</b> — restrained reveals and parallax from Portfolio; the hero verbs exit with Aboutme's blur and letter-spacing effect. Reduced motion keeps only fades, drops cursor parallax and eye tracking, and the camera moves only with scroll.</samp>

---

<div align="center"><samp><b>3D chapter — performance &amp; fallbacks</b></samp></div>

- <samp>The WebGL chunk (three, R3F, postprocessing; ~358 KB gzip) is a lazy import: fetched when the page is idle, mounted when the chapter is about one screen away. The model loads only on mount. Initial page load does not include either.</samp>
- <samp>One canvas, rendered only while the chapter is on screen (<code>frameloop="never"</code> otherwise); unmounting it disposes the renderer.</samp>
- <samp>Desktop: <code>me.glb</code> (1.46 MB, 4096² texture), DPR ≤ 1.5 dropping to 1 if the GPU can't hold ~45 fps, depth of field + bloom + SMAA, shadows.</samp>
- <samp>Phones (touch or ≤ 760 px): <code>me-phone.glb</code> (630 KB, 2048² texture, ~104k vs ~192k triangles, made with gltf-transform resize → simplify → draco), DPR 1, no post-processing, no shadows; the bust fills the top of the screen and the cards scroll over the rest.</samp>
- <samp>The brand starburst turns (CSS only, no extra WebGL context) over the sky while the scene loads, and stays, still, with a message, only without WebGL or after a load error; the 3D cannot be switched off.</samp>

---

<div align="center"><samp><b>Getting started</b></samp></div>

<samp>Requires Node.js 22.12+.</samp>

```bash
git clone https://github.com/yo5on/Personal-website.git
cd Personal-website
npm install
npm run dev        # local dev server
npm test           # unit tests (vitest)
npm run typecheck  # TypeScript (the 3D scene is TS; the rest is JSX)
npm run build      # production build into dist/
npm run preview    # serve the production build
```

<samp>Builds use relative asset URLs (<code>base: './'</code>), so the same build works at a domain root or under <code>/Personal-website/</code>. Set <code>SITE_URL</code> when building to make the social-preview URLs absolute; the Pages workflow sets it to <code>https://yo5on.github.io/Personal-website</code>.</samp>

<samp><b>Deployment</b> — <code>.github/workflows/deploy.yml</code> tests, type-checks, builds and publishes <code>dist/</code> to GitHub Pages on every push to <code>main</code> (repository Settings → Pages → Source: GitHub Actions).</samp>

---

<div align="center"><samp><b>Project structure</b></samp></div>

```text
public/
  certificates/      certificate PDFs and previews (from yo5on/Portfolio)
  fonts/             wordmark and handwriting fonts, with their licences
  images/            moth artwork, favicon, social preview, project images (work/)
  maker/             me.glb and me-phone.glb
src/
  components/        Hero, Work, Plate, CaseView, Maker, Certificates, Sections, Nav, Icons…
  maker/             Scene.tsx, eyeTracking.ts, faceDetails.ts, focusPoints.ts (ported from Aboutme),
                     progress.ts (+ test), MakerCanvas.tsx (the lazy chunk)
  data/content.js    projects, studies, Maker timeline, certificates
  styles.css         design tokens and layout
  main.jsx
```

---

<div align="center"><samp><b>Credits &amp; licences</b></samp></div>

- <samp><b>Moth artwork, project photos, screenshots, certificates</b> — the owner's own, carried over from yo5on/Portfolio (see its README). New here: the Gesture RC Car photo and AI Personal Tutor screenshot from those repositories' READMEs (the screenshot cropped to the app).</samp>
- <samp><b>3D bust and scene</b> — ported from yo5on/Aboutme, whose layout and motion were adapted from the open-source <a href="https://github.com/dayinji/sen-3d-resume">sen-3d-resume</a>. Its MIT licence is kept in <code>LICENSE-sen-3d-resume</code>; as that file notes, it covers source code only, not personal content or the character models.</samp>
- <samp><b>Draco decoder</b> — three.js's own, bundled by Vite (no third-party CDN).</samp>
- <samp><b>Fonts</b> — Instrument Serif, Instrument Sans and IBM Plex Mono (SIL OFL, Google Fonts; subsets in <code>public/fonts/</code>); Hello Wimsy under its personal-use licence (<code>public/fonts/Hello-Wimsy-License.txt</code>). Handwriting glyphs are parsed by opentype.js (MIT), loaded from jsDelivr.</samp>

---

<div align="center">

<samp>Email: <a href="mailto:yo5on2025@gmail.com">yo5on2025@gmail.com</a> · GitHub: <a href="https://github.com/yo5on">github.com/yo5on</a> · LinkedIn: <a href="https://www.linkedin.com/in/yo5on">linkedin.com/in/yo5on</a></samp>

</div>

---

<div align="center"><samp><b>License</b></samp></div>

<samp>This project's original code is licensed under the MIT License. See [LICENSE](LICENSE) for details. Third-party assets and dependencies remain under their respective licenses.</samp>
