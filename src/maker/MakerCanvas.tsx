import { Suspense, useCallback, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import Scene from './Scene'
import NoiseOverlay from './NoiseOverlay'

// The lazily loaded 3D chunk (three, R3F, postprocessing and the scene). Maker.jsx imports it only when the
// chapter is about a screen away, wraps it in an error boundary and keeps the loading starburst up until onReady.

// Render resolution: up to 1.5× on desktop; drops to 1× for good if the GPU can't hold ~45 fps
// (Aboutme measured about 2× faster at 1× on an Intel UHD 620).
function AdaptiveDpr({ max }: { max: number }) {
  const setDpr = useThree((s) => s.setDpr)
  const w = useRef({ t: 0, n: 0, windows: 0, done: max <= 1 })
  useFrame((_, dt) => {
    const a = w.current
    if (a.done) return
    a.t += dt
    a.n++
    if (a.t < 2) return
    // the first window includes shader compilation, so it is ignored
    if (a.windows++ > 0 && a.n / a.t < 45) {
      setDpr(1)
      a.done = true
    }
    a.t = a.n = 0
  })
  return null
}

export default function MakerCanvas({
  phone,
  active,
  onReady,
}: {
  phone: boolean
  active: boolean // the chapter is on screen; off screen the render loop stops
  onReady: () => void
}) {
  // The original's settings on every device (phones included); only the framing in Scene differs on phones
  const maxDpr = Math.min(Math.max(window.devicePixelRatio, 1), 1.5)
  // The grain is a second WebGL context with its own shader: started once the scene is up, so it never competes
  // with the model's load and shader compiles
  const [live, setLive] = useState(false)
  const ready = useCallback(() => { setLive(true); onReady() }, [onReady])
  return (
    <>
      <Canvas
        className="maker-canvas"
        frameloop={active ? 'always' : 'never'}
        shadows={{ type: THREE.PCFShadowMap }}
        dpr={maxDpr}
        camera={{ position: [0, 1.08, 7.2], fov: 22.9, near: 0.1, far: 500 }}
        gl={{
          antialias: false, // anti-aliased in post (SMAA)
          stencil: false,
          depth: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          powerPreference: 'high-performance',
        }}
      >
        <color attach="background" args={['#0a0e16']} />
        <AdaptiveDpr max={maxDpr} />
        <Suspense fallback={null}>
          <Scene phone={phone} onReady={ready} />
        </Suspense>
      </Canvas>
      {active && live && <NoiseOverlay />}
    </>
  )
}
