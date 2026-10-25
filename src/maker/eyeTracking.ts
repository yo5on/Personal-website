import * as THREE from 'three'

// Cursor-following eyes for me.glb.
//
// me.glb is a single Tripo mesh (1 node, 1 material, no skeleton, no morph targets) and its eyes are
// painted into a fragmented texture atlas, so there is no eyeball to rotate. Instead, a clone of the face
// material redraws each painted eye opening as two layers: the painted iris (with its dark rim) slides as a disc
// over the same opening with the iris painted out (removeIris), and the lids stay put and cover whatever slides
// under them. (Stretching the sclera to fill the gap, as before, smeared it over the iris' trailing edge as a
// white cap.) The one change at zero gaze: the bright painted catchlight above each pupil is filled in with the
// iris around it (removeCatchlight). The GLB's geometry, texture and material are left untouched.
//
// Points are in me.glb's model space (face looks along +X, up +Y).
const EYES = [
  { y: 0.155, z: 0.086 }, // eye on the viewer's left (+Z)
  { y: 0.145, z: -0.085 }, // eye on the viewer's right
]
const R = 0.06 // capture half-size around each eye (the openings are ~0.08 wide)
const S = 1024 // capture resolution
const FRONT_X = 0.1 // eye surface sits at x ≈ 0.14–0.19; ignore anything further back
const TUCK = 0.25 // how far (iris radii) the iris may slide under a lid at full gaze
const MAX_TRAVEL = 0.9 // iris travel cap (iris radii)
const SPRITE = 1.15 // the sliding disc, in iris radii: the iris plus its soft dark halo
const FADE = 600 // ms for the eye layers to fade in over the painted eyes

export interface EyeRig {
  // absolute gaze in [-1, 1] (not accumulated): +x = toward the viewer's right (the eye's -Z side), +y = up
  setGaze(x: number, y: number): void
  // settles once the eye layers are in (or the analysis gave up and the painted eyes stay)
  ready: Promise<void>
}

export function addEyeTracking(mesh: THREE.Mesh, gl: THREE.WebGLRenderer): EyeRig | null {
  const src = mesh.material as THREE.MeshStandardMaterial
  if (!src.map) return null

  // 1) Straight-on unlit capture of each eye, read back as sRGB bytes
  const rt = new THREE.WebGLRenderTarget(S, S)
  const flat = new THREE.MeshBasicMaterial({ map: src.map, toneMapped: false })
  flat.onBeforeCompile = (s) => {
    // Mip level 0: the minified capture would otherwise pull dark atlas gutter into the UV-island seams
    // around the iris, and the warp would drag those seams into view
    s.fragmentShader = s.fragmentShader
      .replace('#include <map_fragment>', 'diffuseColor *= textureLod(map, vMapUv, 0.0);')
      .replace('#include <colorspace_fragment>', 'gl_FragColor = sRGBTransferOETF(gl_FragColor);')
  }
  const scene = new THREE.Scene()
  scene.add(new THREE.Mesh(mesh.geometry, flat))
  const cam = new THREE.OrthographicCamera(-R, R, R, -R, 0.01, 1)
  const prevTarget = gl.getRenderTarget()
  const prevClear = gl.getClearColor(new THREE.Color())
  const prevAlpha = gl.getClearAlpha()

  const captures = EYES.map((e) => {
    cam.position.set(0.6, e.y, e.z)
    cam.lookAt(0, e.y, e.z) // screen right = model -Z
    gl.setRenderTarget(rt)
    // The postprocessing composer turns autoClear off; without this the second eye was drawn over the
    // first eye's colour and depth, giving the right eye a split, doubled iris
    gl.setClearColor(0x000000, 0)
    gl.clear()
    gl.render(scene, cam)
    const px = new Uint8Array(S * S * 4)
    gl.readRenderTargetPixels(rt, 0, 0, S, S, px) // row 0 = bottom, same as the DataTexture below
    return px
  })
  gl.setRenderTarget(prevTarget)
  gl.setClearColor(prevClear, prevAlpha)
  rt.dispose()
  flat.dispose()

  // 2) Cloned face material with the eye layers spliced in after the base colour lookup. Until the analysis (3) is
  //    back, both layers are a clear 1×1 placeholder (opening weight 0 → the painted eyes show unchanged): the
  //    program compiles once, now, and the real layers only swap uniform values.
  const blank = toTex(new Uint8Array(4), 1)
  const [L, Rt] = EYES.map((e) => ({
    clean: { value: blank }, // the iris layer (the eye without the catchlight), opening mask in alpha
    bg: { value: blank }, // the opening with the iris painted out, same alpha
    box: { value: new THREE.Vector4(e.z, e.y, 1 / (2 * R), FRONT_X) },
    iris: { value: new THREE.Vector3() },
    off: { value: new THREE.Vector2() },
  }))
  // the layers fade in over FADE ms once they arrive, so a late analysis never pops the catchlights out
  const fade = { value: 0 }
  let fadeFrom = 0
  let reach: number[] | null = null
  const mat = src.clone()
  mat.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, {
      uEyeClean0: L.clean, uEyeBg0: L.bg, uEyeBox0: L.box, uIris0: L.iris, uOff0: L.off,
      uEyeClean1: Rt.clean, uEyeBg1: Rt.bg, uEyeBox1: Rt.box, uIris1: Rt.iris, uOff1: Rt.off, uEyeFade: fade,
    })
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vEyePos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvEyePos = position;')
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vEyePos;
uniform sampler2D uEyeClean0, uEyeClean1, uEyeBg0, uEyeBg1;
uniform vec4 uEyeBox0, uEyeBox1; // capture centre z, y, 1 / capture size, min x
uniform vec3 uIris0, uIris1; // iris centre uv, radius
uniform vec2 uOff0, uOff1; // iris shift (uv)
uniform float uEyeFade; // 0 → the painted eyes, 1 → the layers
vec3 eyeLook(sampler2D clean, sampler2D bg, vec4 box, vec3 iris, vec2 off, vec3 base) {
  vec2 uv = vec2(box.x - vEyePos.z, vEyePos.y - box.y) * box.z + 0.5;
  if (vEyePos.x < box.w || uv != clamp(uv, 0.0, 1.0)) return base;
  float open = texture2D(clean, uv).a * uEyeFade; // 0 on the lids, 1 inside the opening (a few capture pixels of feather)
  if (open <= 0.0) return base;
  // the iris disc, read from where it was painted; only what was inside the opening there, so no lid comes along
  vec2 src = uv - off;
  float a = (1.0 - smoothstep(iris.z * ${(SPRITE - 0.09).toFixed(2)}, iris.z * ${SPRITE.toFixed(2)}, length(src - iris.xy))) * texture2D(clean, src).a;
  vec3 eye = mix(texture2D(bg, uv).rgb, texture2D(clean, src).rgb, a);
  // the capture is the map itself, unlit, so the eye replaces the base colour outright (adding only the change
  // left a ring wherever the capture and the atlas disagreed by a pixel) and the lids cover it with their feather
  return mix(base, eye, open);
}`)
      .replace('#include <map_fragment>', `#include <map_fragment>
diffuseColor.rgb = eyeLook(uEyeClean0, uEyeBg0, uEyeBox0, uIris0, uOff0, diffuseColor.rgb);
diffuseColor.rgb = eyeLook(uEyeClean1, uEyeBg1, uEyeBox1, uIris1, uOff1, diffuseColor.rgb);`)
  }
  mat.customProgramCacheKey = () => 'me-eyes'
  mesh.material = mat

  // 3) The image analysis takes ~1–3 s per eye on a laptop, so each eye runs in its own worker and the bust shows
  //    (painted eyes, still) without waiting; the eyes start following once both are back. Scene holds the reveal
  //    for this (up to a cap), so normally the bust appears with its final eyes
  const ready = Promise.all(captures.map(analyseOffThread)).then((found) => {
    if (found.some((f) => !f)) return console.warn('[eyeTracking] could not find the painted irises; eyes stay static')
    const [l, r] = found as EyeLayers[]
    for (const [e, f] of [[L, l], [Rt, r]] as const) {
      e.clean.value = toTex(f.clean, S)
      e.bg.value = toTex(f.bg, S)
      e.iris.value.fromArray(f.iris)
    }
    blank.dispose()
    fadeFrom = performance.now()
    performance.mark('maker-eyes-live')
    // Both eyes turn together, so each direction gets the travel the tighter eye allows (e.g. looking to the
    // viewer's right is limited by the left eye's nasal corner and the right eye's outer corner)
    reach = l.reach.map((v, i) => Math.min(v, r.reach[i]))
  })

  return {
    ready,
    setGaze(x, y) {
      if (!reach) return
      fade.value = Math.min(1, (performance.now() - fadeFrom) / FADE)
      // travel limit for this direction, interpolated between the 8 measured ones
      const a = (Math.atan2(y, x) / (Math.PI / 4) + 8) % 8
      const i = Math.floor(a), f = a - i
      const lim = reach[i] * (1 - f) + reach[(i + 1) % 8] * f
      for (const e of [L, Rt]) e.off.value.set(x * lim * e.iris.value.z, y * lim * e.iris.value.z)
    },
  }
}

function toTex(data: Uint8Array, size: number) {
  const t = new THREE.DataTexture(data, size, size)
  t.colorSpace = THREE.SRGBColorSpace
  t.magFilter = t.minFilter = THREE.LinearFilter
  t.needsUpdate = true
  return t
}

// One eye capture → its layers and iris, as plain data so it can run in eyeWorker.ts
export function analyseEye(px: Uint8Array) {
  const found = analyse(px)
  if (!found) return null
  return { iris: found.iris.toArray(), reach: found.reach, clean: removeCatchlight(px, found.iris), bg: removeIris(px, found.iris) }
}
type EyeLayers = NonNullable<ReturnType<typeof analyseEye>>

// In a worker; on the main thread instead if the worker can't start or fails (px is copied, not transferred, for that)
function analyseOffThread(px: Uint8Array): Promise<EyeLayers | null> {
  return new Promise((resolve) => {
    const inline = () => resolve(analyseEye(px))
    let w: Worker
    try {
      w = new Worker(new URL('./eyeWorker.ts', import.meta.url), { type: 'module' })
    } catch {
      return inline()
    }
    w.onmessage = (e) => { w.terminate(); resolve(e.data) }
    w.onerror = () => { w.terminate(); inline() }
    w.postMessage(px)
  })
}

// From one capture: eye opening (written to px's alpha), iris circle (uv centre, uv radius) and how far the
// iris can travel (in iris radii) in 8 directions, counter-clockwise from the viewer's right.
function analyse(px: Uint8Array): { iris: THREE.Vector3; reach: number[] } | null {
  const sclera = new Uint8Array(S * S)
  for (let i = 0; i < S * S; i++) {
    const r = px[4 * i], g = px[4 * i + 1], b = px[4 * i + 2]
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b)
    sclera[i] = mn > 120 && mx - mn < 0.35 * mx ? 1 : 0
  }
  // opening = per row, everything between the outermost sclera pixels (the lids are convex)
  const open = new Uint8Array(S * S)
  for (let y = 0; y < S; y++) {
    let a = -1, b = -1
    for (let x = 0; x < S; x++) if (sclera[y * S + x]) { if (a < 0) a = x; b = x }
    if (b - a > S / 64) open.fill(1, y * S + a, y * S + b + 1)
  }
  // iris = dark pixels inside the opening; robust extents (ignore stray lash / lid-line pixels)
  const xs: number[] = [], ys: number[] = []
  for (let i = 0; i < S * S; i++) {
    if (!open[i] || sclera[i]) continue
    if (0.3 * px[4 * i] + 0.59 * px[4 * i + 1] + 0.11 * px[4 * i + 2] < 110) { xs.push(i % S); ys.push(Math.floor(i / S)) }
  }
  if (xs.length < S * S / 500) return null
  const q = (v: number[], p: number) => v.sort((m, n) => m - n)[Math.floor(p * (v.length - 1))]
  const x0 = q(xs, 0.02), x1 = q(xs, 0.98), y0 = q(ys, 0.02), y1 = q(ys, 0.98)
  const r = (x1 - x0) / 2
  // a fully visible iris is as tall as it is wide; otherwise the upper lid covers its top
  const cy = y1 - y0 > 1.8 * r ? (y0 + y1) / 2 : y0 + r
  // Travel limits from the opening itself, in 8 directions (iris radii): the iris may go up to the lid ahead
  // plus a little tuck under it
  const ix = Math.round((x0 + x1) / 2), iy = Math.round(cy)
  const lidDist = (dx: number, dy: number) => {
    let n = 0
    for (let x = ix, y = iy; x >= 0 && y >= 0 && x < S && y < S && open[y * S + x]; x += dx, y += dy) n++
    return (n * Math.hypot(dx, dy)) / r
  }
  const dirs = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]]
  const reach = dirs.map(([dx, dy]) =>
    THREE.MathUtils.clamp(lidDist(dx, dy) - 1 + TUCK, 0, MAX_TRAVEL))
  // Opening mask in alpha: 0 on and outside the lids, ramping to 1 a distance B inside the opening (a soft lid edge).
  // Box blur of the mask via a summed-area table; at a straight edge the blur is 0.5 + d / 2B.
  const B = Math.max(2, Math.round(r * 0.04))
  const sat = new Float64Array((S + 1) * (S + 1))
  for (let y = 0; y < S; y++) {
    let row = 0
    for (let x = 0; x < S; x++) {
      row += open[y * S + x]
      sat[(y + 1) * (S + 1) + x + 1] = sat[y * (S + 1) + x + 1] + row
    }
  }
  for (let y = 0; y < S; y++) {
    const ya = Math.max(0, y - B), yb = Math.min(S, y + B + 1)
    for (let x = 0; x < S; x++) {
      let a = 0
      if (open[y * S + x]) {
        const xa = Math.max(0, x - B), xb = Math.min(S, x + B + 1)
        const sum = sat[yb * (S + 1) + xb] - sat[ya * (S + 1) + xb] - sat[yb * (S + 1) + xa] + sat[ya * (S + 1) + xa]
        a = Math.min(1, Math.max(0, (sum / ((2 * B + 1) * (2 * B + 1)) - 0.5) * 2))
      }
      px[4 * (y * S + x) + 3] = Math.round(a * 255)
    }
  }
  // 1.08: include the iris' soft outer edge
  return { iris: new THREE.Vector3(((x0 + x1) / 2 + 0.5) / S, (cy + 0.5) / S, (r * 1.08) / S), reach }
}

// The painted catchlight: the brightest blob inside the iris (found on a 9px box-blurred luminance, so a stray
// bright speck can't win), grown over pixels clearly lighter than the iris and widened to cover its soft glow, then
// filled from its edge inwards with the iris pixels around it and relaxed smooth, so no patch or seam shows.
// Other light marks on the iris that the dark pupil separates from it are kept. Returns a copy; the opening weight in alpha is unchanged.
export function removeCatchlight(px: Uint8Array, iris: THREE.Vector3, S = Math.round(Math.sqrt(px.length / 4))): Uint8Array {
  const out = px.slice()
  const cx = iris.x * S - 0.5, cy = iris.y * S - 0.5, R = iris.z * S
  const lum = (i: number) => 0.3 * px[4 * i] + 0.59 * px[4 * i + 1] + 0.11 * px[4 * i + 2]
  const inner: number[] = [] // pixels well inside the iris, clear of its rim and the sclera
  for (let y = Math.max(0, Math.floor(cy - R)); y <= Math.min(S - 1, Math.ceil(cy + R)); y++)
    for (let x = Math.max(0, Math.floor(cx - R)); x <= Math.min(S - 1, Math.ceil(cx + R)); x++)
      if (Math.hypot(x - cx, y - cy) < 0.85 * R) inner.push(y * S + x)
  if (!inner.length) return out
  const isInner = new Uint8Array(S * S)
  for (const i of inner) isInner[i] = 1
  const ls = inner.map(lum).sort((a, b) => a - b)
  const median = ls[ls.length >> 1]
  let seed = -1, best = -1
  for (const i of inner) {
    const x = i % S, y = (i / S) | 0
    let sum = 0, n = 0
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const j = (y + dy) * S + x + dx
      if (isInner[j]) { sum += lum(j); n++ }
    }
    if (n && sum / n > best) { best = sum / n; seed = i }
  }
  if (best < median + 25) return out // no catchlight brighter than the iris: leave the eye alone
  const thr = median + 0.4 * (best - median)
  const mask = new Uint8Array(S * S)
  const stack = [seed]
  mask[seed] = 1
  while (stack.length) {
    const i = stack.pop()!
    for (const j of [i - 1, i + 1, i - S, i + S]) if (isInner[j] && !mask[j] && lum(j) > thr) { mask[j] = 1; stack.push(j) }
  }
  // the hole: the blob widened (round) by its glow (mask = 1 marks pixels still to fill)
  const W = Math.max(3, Math.round(R * 0.05))
  const blob: number[] = []
  for (let i = 0; i < S * S; i++) if (mask[i]) blob.push(i)
  for (const i of blob) {
    const x = i % S, y = (i / S) | 0
    for (let dy = -W; dy <= W; dy++) for (let dx = -W; dx <= W; dx++)
      if (dx * dx + dy * dy <= W * W && x + dx >= 0 && x + dx < S && y + dy >= 0 && y + dy < S) mask[(y + dy) * S + x + dx] = 1
  }
  let hole: number[] = []
  for (let i = 0; i < S * S; i++) if (mask[i]) hole.push(i)
  const filled = hole.slice()
  // onion-peel fill: each pass sets the hole pixels that touch known ones to their known neighbours' average
  const around = [-1, 1, -S, S, -S - 1, -S + 1, S - 1, S + 1]
  while (hole.length) {
    const next: number[] = [], done: [number, number, number, number][] = []
    for (const i of hole) {
      let r = 0, g = 0, b = 0, n = 0
      for (let d = 0; d < 8; d++) {
        const j = i + around[d]
        if (j < 0 || j >= S * S || mask[j]) continue
        r += out[4 * j]; g += out[4 * j + 1]; b += out[4 * j + 2]; n++
      }
      if (n) done.push([i, r / n, g / n, b / n])
      else next.push(i)
    }
    if (!done.length) break
    for (const [i, r, g, b] of done) { out[4 * i] = r; out[4 * i + 1] = g; out[4 * i + 2] = b; mask[i] = 0 }
    hole = next
  }
  // relax: each filled pixel becomes its 4 neighbours' average, the iris around the hole held fixed; this
  // smooths away the onion-peel streaks
  const f = new Float32Array(S * S * 3)
  for (let i = 0; i < S * S; i++) for (let c = 0; c < 3; c++) f[3 * i + c] = out[4 * i + c]
  for (let k = 0; k < 4 * W + 20; k++)
    for (const i of filled) for (let c = 0; c < 3; c++)
      f[3 * i + c] = (f[3 * (i - 1) + c] + f[3 * (i + 1) + c] + f[3 * (i - S) + c] + f[3 * (i + S) + c]) / 4
  for (const i of filled) for (let c = 0; c < 3; c++) out[4 * i + c] = Math.round(f[3 * i + c])
  return out
}

// The opening with the iris painted out: the disc the iris layer slides from (plus a margin) is filled from the
// sclera around it, inside the opening only, so no lid colour bleeds in. Each pixel blends the nearest known
// pixels left, right, above and below (inverse square distance), then is relaxed smooth. Returns a copy; alpha
// (the opening mask) is unchanged.
export function removeIris(px: Uint8Array, iris: THREE.Vector3, S = Math.round(Math.sqrt(px.length / 4))): Uint8Array {
  const out = px.slice()
  const cx = iris.x * S - 0.5, cy = iris.y * S - 0.5, R = iris.z * S * (SPRITE + 0.03)
  const hole = new Uint8Array(S * S) // 1 = to fill
  const filled: number[] = []
  for (let y = Math.max(0, Math.floor(cy - R)); y <= Math.min(S - 1, Math.ceil(cy + R)); y++)
    for (let x = Math.max(0, Math.floor(cx - R)); x <= Math.min(S - 1, Math.ceil(cx + R)); x++) {
      const i = y * S + x
      if (px[4 * i + 3] > 0 && Math.hypot(x - cx, y - cy) < R) { hole[i] = 1; filled.push(i) }
    }
  // nearest known pixel in each direction (-1 = none: the scan met a lid or the capture edge first)
  const near = [0, 1, 2, 3].map(() => new Int32Array(S * S).fill(-1))
  const scan = (d: Int32Array, start: number, step: number) => {
    let last = -1
    for (let k = 0, i = start; k < S; k++, i += step) {
      if (hole[i]) d[i] = last
      else last = px[4 * i + 3] === 255 ? i : -1 // the feathered lid edge is lid colour, not sclera
    }
  }
  for (let y = 0; y < S; y++) { scan(near[0], y * S, 1); scan(near[1], y * S + S - 1, -1) }
  for (let x = 0; x < S; x++) { scan(near[2], x, S); scan(near[3], x + (S - 1) * S, -S) }
  const f = new Float32Array(S * S * 3)
  for (let i = 0; i < S * S; i++) for (let c = 0; c < 3; c++) f[3 * i + c] = px[4 * i + c]
  for (const i of filled) {
    let w = 0, r = 0, g = 0, b = 0
    for (const d of near) {
      const j = d[i]
      if (j < 0) continue
      const dist = Math.abs(j - i) < S ? Math.abs(j - i) : Math.abs(j - i) / S
      const k = 1 / (dist * dist)
      w += k; r += k * px[4 * j]; g += k * px[4 * j + 1]; b += k * px[4 * j + 2]
    }
    if (w) { f[3 * i] = r / w; f[3 * i + 1] = g / w; f[3 * i + 2] = b / w }
  }
  // relax: smooths the creases where the nearest pixel switches; the lids and their feathered edge hold no value
  const holds = (j: number) => j >= 0 && j < S * S && (hole[j] === 1 || px[4 * j + 3] === 255)
  // which of the 4 neighbours (left, right, below, above) hold, as bits; fixed while relaxing, so it is found once
  // (this loop runs ~15M times per eye: no allocation or call inside it)
  const held = Uint8Array.from(filled, (i) => (+holds(i - 1)) | (+holds(i + 1) << 1) | (+holds(i - S) << 2) | (+holds(i + S) << 3))
  for (let k = 0; k < 120; k++)
    for (let p = 0; p < filled.length; p++) {
      const i = filled[p], m = held[p]
      if (!m) continue
      for (let c = 0; c < 3; c++) {
        let sum = 0, n = 0
        if (m & 1) { sum += f[3 * (i - 1) + c]; n++ }
        if (m & 2) { sum += f[3 * (i + 1) + c]; n++ }
        if (m & 4) { sum += f[3 * (i - S) + c]; n++ }
        if (m & 8) { sum += f[3 * (i + S) + c]; n++ }
        f[3 * i + c] = sum / n
      }
    }
  for (const i of filled) for (let c = 0; c < 3; c++) out[4 * i + c] = Math.round(f[3 * i + c])
  return out
}
