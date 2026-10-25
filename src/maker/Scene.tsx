import { Suspense, useMemo, useRef, useEffect, type MutableRefObject } from 'react'
import { useThree, useFrame, useLoader } from '@react-three/fiber'
import { EffectComposer, Bloom, DepthOfField, SMAA } from '@react-three/postprocessing'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import dracoJs from 'three/examples/jsm/libs/draco/gltf/draco_wasm_wrapper.js?url'
import dracoWasm from 'three/examples/jsm/libs/draco/gltf/draco_decoder.wasm?url'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import * as THREE from 'three'
import { FOCUS_POINTS, FRAMES_PER_NODE } from './focusPoints'
import { nodeIndex } from './progress'
import { addFaceDetails } from './faceDetails'
import { addEyeTracking, type EyeRig } from './eyeTracking'

// Ported from yo5on/Aboutme (src/scene/Scene.tsx). Changes for the Maker chapter: the camera follows progress
// through this chapter's timeline instead of page scroll; the works entrance / pan stops and the turntable spin
// are gone; the sky and lights are re-graded to the site palette; phones get a lighter model and no post/shadows.

// me.glb is Draco-compressed. The decoder is three's own, emitted by Vite (self-hosted, no third-party CDN);
// explicit URLs because DRACOLoader's import.meta.url defaults break under dev pre-bundling.
// Phones get me-phone.glb: 2048² texture, about half the triangles.
export const modelUrl = (phone: boolean) => `${import.meta.env.BASE_URL}maker/${phone ? 'me-phone.glb' : 'me.glb'}`
const withDraco = (loader: GLTFLoader) => {
  loader.setDRACOLoader(new DRACOLoader().setDecoderPath({ js: dracoJs, wasm: dracoWasm }))
}

const M = FOCUS_POINTS.length // timeline node count
const RESUME_FRAMES = M * FRAMES_PER_NODE // node k sits at frame (k+1)·50; the opening stop at frame 0
// a node locks when its card top reaches this line (share of the viewport from the top): on phones the card
// comes to rest below the bust, which fills the top of the screen
const NODE_LINE = { desktop: 0.3, phone: 0.6 }
const FOV = 22.9 // narrow lens, same as the reference glb camera

// me.glb (Tripo export) is a 0.98-unit bust facing +X with its pivot at the bbox centre.
// Measured from the mesh: eye centre ≈ (0.21, 0.19, 0), eye spacing ≈ 0.19.
// Scale so the eye spacing matches the reference (≈0.5 world units), turn it to face +Z,
// and move it so the eye centre lands on world (0, 1.5, 0) — all camera stops are authored around that.
const MODEL = {
  scale: 2.65,
  rotationY: -Math.PI / 2,
  position: [0, 1.5 - 0.19 * 2.65, -0.21 * 2.65] as [number, number, number],
}

// Camera path: the chapter opening, then one stop per timeline node (Education → Think → Innovate → Fabricate → Say hi).
// c = camera position, f = focus / look-at point on the face; sx / sy = sideways / vertical truck as a
// fraction of the focus distance (sx > 0 pushes the subject left of the right-hand timeline, sy < 0 raises it).
type Stop = { c: [number, number, number]; f: [number, number, number]; sx: number; sy?: number }
const STOPS: Stop[] = [
  { c: [0, 1.5, 7.2], f: [0, 1.5, 0.05], sx: 0.12, sy: -0.058 }, // opening: level, eyes ~37% from the top, left of the intro
  { c: [2.2, 0.75, 1.9], f: [0.33, 1.38, 0.02], sx: 0.2 }, // education: low three-quarter, cheek
  { c: [1.28, 1.25, 1.57], f: [0.29, 1.16, -0.05], sx: 0.16 }, // think: square on the cheek kiss
  { c: [-1.6, 1.75, 1.7], f: [-0.25, 1.5, 0.03], sx: 0.2 }, // innovate: swing to the other side, eye level
  { c: [-0.6, 0.55, 2.2], f: [0, 1.4, 0.06], sx: 0.18 }, // fabricate: low, looking up at the nose bandage
  { c: [0.64, 1.71, 7.5], f: [0, 1.3, 0.22], sx: 0.1 }, // say hi: pull back to a wide front shot
]
if (STOPS.length !== M + 1) throw new Error('Scene: STOPS needs the opening stop plus one stop per FOCUS_POINTS entry')

const EYE_MID = new THREE.Vector3(0.17, 0.15, 0) // me.glb model space, between the painted eyes

// Gradient sky sphere wrapped around the camera: graphite above, near-black below, so the bust sits in the moth's world.
// Matches --stage-top/--stage-bottom in styles.css (navy palette: #2a2e6b / #0d0f2a)
function GradientBackground() {
  const uniforms = useMemo(
    () => ({
      uTop: { value: new THREE.Color('#2b2b2b') },
      uBottom: { value: new THREE.Color('#0c0c0c') },
      uSteep: { value: 1.4 }, // the narrow lens only sees the middle band; steep stretches the transition into view
    }),
    []
  )
  return (
    <mesh scale={100}>
      <sphereGeometry args={[1, 32, 32]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={/* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={/* glsl */ `
          uniform vec3 uTop;
          uniform vec3 uBottom;
          uniform float uSteep;
          varying vec3 vDir;
          void main() {
            float t = clamp(vDir.y * uSteep * 0.5 + 0.5, 0.0, 1.0);
            gl_FragColor = vec4(mix(uBottom, uTop, t), 1.0);
          }
        `}
      />
    </mesh>
  )
}

// Image-based light from three's procedural RoomEnvironment (no HDR asset to ship)
function Env({ intensity }: { intensity: number }) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const room = new RoomEnvironment()
    const tex = pmrem.fromScene(room, 0.04).texture
    scene.environment = tex
    scene.environmentIntensity = intensity
    return () => {
      scene.environment = null
      tex.dispose()
      room.dispose()
      pmrem.dispose()
    }
  }, [gl, scene, intensity])
  return null
}

// Environment + navy hemisphere + warm stone key (front right) + crimson rim (behind left)
function Lights({ shadows }: { shadows: boolean }) {
  return (
    <>
      <Env intensity={0.7} />
      <hemisphereLight args={['#d9d5c6', '#1b1e4a', 0.95]} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={2.5}
        color="#f1e6d0"
        castShadow={shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
      />
      <directionalLight position={[-5, 3, -4]} intensity={3.2} color="#d21319" />
    </>
  )
}

// me.glb + scroll-driven camera path + auto-focus target
function Man({
  focusRef,
  frameRef,
  phone,
  shadows,
  onReady,
}: {
  focusRef: MutableRefObject<THREE.Vector3>
  frameRef: MutableRefObject<number>
  phone: boolean
  shadows: boolean
  onReady: () => void
}) {
  const cam = {
    damping: 0.1,
    dwell: 0.35,
    parallax: 4,
    parallaxEase: 0.1,
    mobilePullback: 1.2, // on phones, pull the camera back along focus→camera (1.2 = 20% further)
    mobileTimelinePullback: 1.6, // extra pull-back for the close-ups on portrait screens
  }

  // Eyes follow the cursor / touch point. maxYaw / maxPitch: gaze angle (deg) for full iris travel.
  // freq: spring stiffness (rad/s, ~0.25 s to settle); deadzone: target change (gaze units) to ignore;
  // glance: size / interval (s) of the small idle eye shifts while the cursor rests.
  const look = { maxYaw: 15, maxPitch: 10, freq: 16, deadzone: 0.01, glance: 0.06, glanceEvery: [2.5, 6] }
  const gaze = useRef({ x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, still: 0, next: 3, ix: 0, iy: 0 })

  const get = useThree((s) => s.get)
  const { scene } = useLoader(GLTFLoader, modelUrl(phone), withDraco)
  const eyes = useRef<EyeRig | null>(null)

  const model = useMemo(() => {
    const meshes: any[] = []
    scene.traverse((o: any) => {
      if (o.isMesh) {
        o.castShadow = shadows
        o.receiveShadow = shadows
        meshes.push(o)
      }
    })
    // nose bandage + cheek kiss (once per loaded scene; useLoader caches it)
    if (meshes[0] && !scene.getObjectByName('nose-bandage')) addFaceDetails(meshes[0])
    if (meshes[0]) eyes.current = meshes[0].userData.eyes ??= addEyeTracking(meshes[0], get().gl)
    return scene
  }, [scene, get, shadows])

  // The bust's lowest point: me.glb is cut off at the chest, so its bbox min.y is a flat rim of
  // vertices. Sample that rim (mesh-local) so the camera can keep it at the viewport's bottom edge.
  const rim = useMemo(() => {
    let mesh: any = null
    model.traverse((o: any) => {
      if (o.isMesh && !mesh) mesh = o
    })
    if (!mesh) return null
    const geo = mesh.geometry
    if (!geo.boundingBox) geo.computeBoundingBox()
    const minY = geo.boundingBox.min.y
    const pos = geo.attributes.position.array as ArrayLike<number>
    const all: number[] = []
    for (let i = 0; i < pos.length; i += 3) {
      if (pos[i + 1] < minY + 0.004) all.push(i)
    }
    const step = Math.max(1, Math.floor(all.length / 160))
    const local: THREE.Vector3[] = []
    for (let k = 0; k < all.length; k += step) {
      const i = all[k]
      local.push(new THREE.Vector3(pos[i], pos[i + 1], pos[i + 2]))
    }
    return { mesh, local, world: local.map(() => new THREE.Vector3()), center: new THREE.Vector3() }
  }, [model])

  // Model parsed, decals built, and mounted → the poster can go
  useEffect(() => { onReady() }, [onReady])

  const path = useMemo(
    () => ({
      curve: new THREE.CatmullRomCurve3(
        STOPS.map((s) => new THREE.Vector3(...s.c)),
        false,
        'centripetal'
      ),
      focus: STOPS.map((s) => new THREE.Vector3(...s.f)),
    }),
    []
  )

  // Reduced motion: no cursor parallax and no eye tracking; the camera only moves with the scroll
  const reduceMotion = useRef(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true)

  // window-level mouse input (smouse is the eased value)
  const mouse = useRef({ x: 0, y: 0 })
  const smouse = useRef({ x: 0, y: 0 })
  // Pointer for the eyes in client px (null = nothing to look at → eyes ease back to neutral).
  // Converted to canvas NDC every frame, so resizing and scrolling never leave it stale.
  // Touch only guides the eyes while a finger is down. All listeners are passive.
  const pointer = useRef<{ x: number; y: number } | null>(null)
  useEffect(() => {
    const set = (cx: number, cy: number) => {
      pointer.current = reduceMotion.current ? null : { x: cx, y: cy }
    }
    const clear = () => (pointer.current = null)
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.current.y = -((e.clientY / window.innerHeight) * 2 - 1)
      set(e.clientX, e.clientY)
    }
    const onTouch = (e: TouchEvent) => e.touches[0] && set(e.touches[0].clientX, e.touches[0].clientY)
    const opts = { passive: true }
    window.addEventListener('pointermove', onPointer, opts)
    window.addEventListener('touchstart', onTouch, opts)
    window.addEventListener('touchmove', onTouch, opts)
    window.addEventListener('touchend', clear, opts)
    window.addEventListener('touchcancel', clear, opts)
    window.addEventListener('blur', clear)
    document.documentElement.addEventListener('mouseleave', clear)
    return () => {
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('touchstart', onTouch)
      window.removeEventListener('touchmove', onTouch)
      window.removeEventListener('touchend', clear)
      window.removeEventListener('touchcancel', clear)
      window.removeEventListener('blur', clear)
      document.documentElement.removeEventListener('mouseleave', clear)
    }
  }, [])
  const ray = useRef(new THREE.Raycaster())
  const ndc = useRef(new THREE.Vector2())
  const eyeMid = useRef(new THREE.Vector3())
  const lookAt = useRef(new THREE.Vector3())

  const sectionEl = useRef<HTMLElement | null>(null)
  const anchorEls = useRef<(Element | null)[] | null>(null)

  const frameSmooth = useRef(0)
  const tmpVec = useRef(new THREE.Vector3())
  const camPos = useRef(new THREE.Vector3())
  const camQuat = useRef(new THREE.Quaternion())
  const lookMat = useRef(new THREE.Matrix4())
  const paraEuler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))
  const paraQuat = useRef(new THREE.Quaternion())
  const invQuat = useRef(new THREE.Quaternion())
  const camOffset = useRef(new THREE.Vector3())

  useFrame((_, dt) => {
    dt = Math.min(dt, 0.1) // a frame after the loop was paused off-screen must not jump the springs
    const a = 1 - Math.pow(cam.damping, dt)

    // 1) Continuous node index s from the chapter's timeline cards (viewport coords): see progress.ts
    if (!anchorEls.current?.every(Boolean)) {
      sectionEl.current = document.getElementById('maker')
      anchorEls.current = FOCUS_POINTS.map((n) => document.querySelector(`[data-point="${n}"]`))
    }
    let sTarget = -1
    const els = anchorEls.current
    if (sectionEl.current && els.every(Boolean)) {
      sTarget = nodeIndex(
        sectionEl.current.getBoundingClientRect().top,
        els.map((el) => el!.getBoundingClientRect().top),
        window.innerHeight * (phone ? NODE_LINE.phone : NODE_LINE.desktop),
        cam.dwell
      )
    }
    // 2) Smoothed frame: opening stop at 0, node k at (k+1)·50
    const frameTarget = THREE.MathUtils.clamp((sTarget + 1) * FRAMES_PER_NODE, 0, RESUME_FRAMES)
    frameSmooth.current += (frameTarget - frameSmooth.current) * a
    const frame = frameSmooth.current
    frameRef.current = frame
    const s = THREE.MathUtils.clamp(frame / FRAMES_PER_NODE - 1, -1, M - 1)

    // 3) Sample the path: position on the spline, focus/sx lerped per 50-frame segment
    const seg = THREE.MathUtils.clamp(frame / FRAMES_PER_NODE, 0, STOPS.length - 1)
    const iA = Math.min(Math.floor(seg), STOPS.length - 2)
    const f = seg - iA
    path.curve.getPoint(seg / (STOPS.length - 1), camPos.current)
    focusRef.current.lerpVectors(path.focus[iA], path.focus[iA + 1], f)
    const sx = THREE.MathUtils.lerp(STOPS[iA].sx, STOPS[iA + 1].sx, f)
    const sy = THREE.MathUtils.lerp(STOPS[iA].sy ?? 0, STOPS[iA + 1].sy ?? 0, f)

    // 4) Aim at the focus, then orbit around it with eased mouse parallax (focus stays put on screen)
    const camera: any = get().camera
    if (!camera.isPerspectiveCamera) return
    lookMat.current.lookAt(camPos.current, focusRef.current, camera.up)
    camQuat.current.setFromRotationMatrix(lookMat.current)
    const me = 1 - Math.pow(cam.parallaxEase, dt)
    smouse.current.x += (mouse.current.x - smouse.current.x) * me
    smouse.current.y += (mouse.current.y - smouse.current.y) * me
    const ax = reduceMotion.current ? 0 : THREE.MathUtils.degToRad(cam.parallax)
    paraEuler.current.set(-smouse.current.y * ax, -smouse.current.x * ax, 0)
    paraQuat.current.setFromEuler(paraEuler.current)
    tmpVec.current.copy(camPos.current).sub(focusRef.current).applyQuaternion(paraQuat.current)
    // timeline weight: fades in from the opening (s: -0.8→0.3) → no jumps
    const tlWeight = THREE.MathUtils.smoothstep(s, -0.8, 0.3)
    if (phone) {
      tmpVec.current.multiplyScalar(cam.mobilePullback * THREE.MathUtils.lerp(1, cam.mobileTimelinePullback, tlWeight))
    }
    tmpVec.current.add(focusRef.current)
    camera.position.copy(tmpVec.current)
    camera.quaternion.multiplyQuaternions(paraQuat.current, camQuat.current)

    // Sideways truck: desktop puts the subject left of the timeline; on phones the cards are full width and
    // scroll over the bust, so it stays centred
    const dist = camera.position.distanceTo(focusRef.current)
    if (!phone) camera.translateX(dist * sx)
    camera.translateY(dist * sy)
    if (camera.fov !== FOV) {
      camera.fov = FOV
      camera.updateProjectionMatrix()
    }

    // 5) Ground the bust. me.glb ends at the chest only ~1.8 units below the eyes, so wide framings left its
    //    cut edge floating above the viewport bottom. Dolly the camera toward the focus — the focus keeps its
    //    screen position, so the composition holds — until the camera-facing half of the bottom rim touches
    //    the bottom edge. Close-ups already crop below the rim and are left alone. Recomputed every frame, so
    //    viewport size, phone pull-back and parallax can't make it float again.
    if (rim) {
      rim.mesh.updateWorldMatrix(true, false)
      rim.center.set(0, 0, 0)
      for (let i = 0; i < rim.local.length; i++) {
        rim.world[i].copy(rim.local[i]).applyMatrix4(rim.mesh.matrixWorld)
        rim.center.add(rim.world[i])
      }
      rim.center.divideScalar(rim.local.length)
      invQuat.current.copy(camera.quaternion).invert()
      camOffset.current.copy(camera.position).sub(focusRef.current)
      const tanHalf = Math.tan(THREE.MathUtils.degToRad(FOV / 2))
      // highest screen y (NDC) of the visible bottom rim with the camera at focus + offset·k
      const rimTop = (k: number) => {
        const cx = focusRef.current.x + camOffset.current.x * k
        const cy = focusRef.current.y + camOffset.current.y * k
        const cz = focusRef.current.z + camOffset.current.z * k
        const q = tmpVec.current.set(rim.center.x - cx, rim.center.y - cy, rim.center.z - cz).applyQuaternion(invQuat.current)
        const centerDepth = -q.z
        let top = -Infinity
        for (const p of rim.world) {
          q.set(p.x - cx, p.y - cy, p.z - cz).applyQuaternion(invQuat.current)
          const depth = -q.z
          if (depth <= 0 || depth > centerDepth) continue // far half is hidden behind the body
          top = Math.max(top, q.y / (depth * tanHalf))
        }
        return top
      }
      if (rimTop(1) > -1) {
        let lo = 0.3
        let hi = 1
        for (let i = 0; i < 14; i++) {
          const mid = (lo + hi) / 2
          if (rimTop(mid) > -1) hi = mid
          else lo = mid
        }
        camera.position.copy(focusRef.current).addScaledVector(camOffset.current, lo)
      }
    }

    // 6) Eyes: look at a point in front of the face, halfway along the pointer's ray from the camera
    //    (the viewer). Measured in model space, so it holds for every camera stop and the parallax.
    //    Both eyes share one parallel gaze: no crossing.
    if (eyes.current && rim) {
      let gx = 0
      let gy = 0
      const r = pointer.current && get().gl.domElement.getBoundingClientRect()
      if (pointer.current && r) {
        ndc.current.set(((pointer.current.x - r.left) / r.width) * 2 - 1, -(((pointer.current.y - r.top) / r.height) * 2 - 1))
      }
      const inside = !!r && Math.abs(ndc.current.x) <= 1 && Math.abs(ndc.current.y) <= 1
      if (inside) {
        camera.updateMatrixWorld()
        const mid = rim.mesh.localToWorld(eyeMid.current.copy(EYE_MID))
        ray.current.setFromCamera(ndc.current, camera)
        const target = ray.current.ray.at(camera.position.distanceTo(mid) * 0.5, lookAt.current)
        const d = rim.mesh.worldToLocal(target).sub(EYE_MID)
        gx = Math.atan2(-d.z, d.x) / THREE.MathUtils.degToRad(look.maxYaw)
        gy = Math.atan2(d.y, Math.hypot(d.x, d.z)) / THREE.MathUtils.degToRad(look.maxPitch)
        // elliptical limit, so diagonals can't push the iris past either axis' travel
        const len = Math.hypot(gx, gy)
        if (len > 1) {
          gx /= len
          gy /= len
        }
      }
      const g = gaze.current
      // Deadzone: sub-pixel pointer noise never moves the target, so a resting cursor gives a still gaze
      if (Math.hypot(gx - g.tx, gy - g.ty) > look.deadzone) {
        g.tx = gx
        g.ty = gy
        g.still = g.ix = g.iy = 0
      } else if (inside && (g.still += dt) > g.next) {
        // Cursor resting: now and then a tiny glance off the fixation point and back, like a real gaze
        const back = g.ix !== 0 || g.iy !== 0
        g.ix = back ? 0 : (Math.random() * 2 - 1) * look.glance
        g.iy = back ? 0 : (Math.random() * 2 - 1) * look.glance * 0.6
        g.next = g.still + (back ? 0.4 + Math.random() * 0.6 : THREE.MathUtils.randFloat(look.glanceEvery[0], look.glanceEvery[1]))
      }
      // Critically damped spring (exact step, so the same motion at any frame rate): eases in and out of
      // every change of direction and never overshoots past the iris travel limit
      const w = look.freq
      const e = Math.exp(-w * dt)
      const dx = g.x - (g.tx + g.ix)
      const dy = g.y - (g.ty + g.iy)
      const cx = g.vx + w * dx
      const cy = g.vy + w * dy
      g.x = g.tx + g.ix + (dx + cx * dt) * e
      g.y = g.ty + g.iy + (dy + cy * dt) * e
      g.vx = (g.vx - w * cx * dt) * e
      g.vy = (g.vy - w * cy * dt) * e
      eyes.current.setGaze(g.x, g.y)
    }
  })

  return (
    <group position={MODEL.position} rotation={[0, MODEL.rotationY, 0]} scale={MODEL.scale}>
      <primitive object={model} />
    </group>
  )
}

// Post: DepthOfField → Bloom → SMAA (desktop only).
// DoF target follows focusRef every frame; mid-timeline tightens the focus range and boosts bokeh.
function Post({
  focusRef,
  frameRef,
}: {
  focusRef: MutableRefObject<THREE.Vector3>
  frameRef: MutableRefObject<number>
}) {
  const post = {
    bloomIntensity: 0.5,
    bloomThreshold: 0.82,
    startBokeh: 7.4,
    startRange: 2.0,
    focusBokeh: 11.0,
    focusRange: 0.15,
    startBlendFrame: 48,
    endBlendFrame: RESUME_FRAMES - 50, // back to the opening DoF around the last node
  }

  const dofRef = useRef<any>(null)
  useFrame(() => {
    const e = dofRef.current
    if (!e) return
    if (e.target) e.target.copy(focusRef.current)
    // w=1 → opening preset (start / last node), w=0 → close-up preset (middle nodes)
    const f = frameRef.current
    const wStart = 1 - THREE.MathUtils.smoothstep(f, 0, post.startBlendFrame)
    const wEnd = THREE.MathUtils.smoothstep(f, post.endBlendFrame, RESUME_FRAMES)
    const w = Math.max(wStart, wEnd)
    e.bokehScale = THREE.MathUtils.lerp(post.focusBokeh, post.startBokeh, w)
    if (e.cocMaterial) e.cocMaterial.focusRange = THREE.MathUtils.lerp(post.focusRange, post.startRange, w)
  })

  return (
    <EffectComposer multisampling={0} stencilBuffer={false} depthBuffer>
      <DepthOfField
        ref={dofRef}
        target={[0, 1.5, 0]}
        worldFocusRange={post.focusRange}
        bokehScale={post.focusBokeh}
        height={480}
      />
      <Bloom
        mipmapBlur
        intensity={post.bloomIntensity}
        luminanceThreshold={post.bloomThreshold}
        luminanceSmoothing={0.3}
      />
      <SMAA />
    </EffectComposer>
  )
}

export default function Scene({ phone, onReady }: { phone: boolean; onReady: () => void }) {
  const focusRef = useRef(new THREE.Vector3(...STOPS[0].f))
  const frameRef = useRef(0)
  return (
    <>
      <GradientBackground />
      <Suspense fallback={null}>
        <Lights shadows={!phone} />
        <Man focusRef={focusRef} frameRef={frameRef} phone={phone} shadows={!phone} onReady={onReady} />
      </Suspense>
      {!phone && <Post focusRef={focusRef} frameRef={frameRef} />}
    </>
  )
}
