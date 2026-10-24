import { Suspense, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import Scene from './Scene'

// The lazily loaded 3D chunk (three, R3F, postprocessing and the scene). Maker.jsx imports it only when the
// chapter is about a screen away, wraps it in an error boundary and keeps the poster up until onReady.

// Render resolution: up to 1.5× on desktop; drops to 1× for good if the GPU can't hold ~45 fps
// (Aboutme measured about 2× faster at 1× on an Intel UHD 620). Phones always render at 1×.
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
  const maxDpr = phone ? 1 : Math.min(Math.max(window.devicePixelRatio, 1), 1.5)
  return (
    <Canvas
      className="maker-canvas"
      frameloop={active ? 'always' : 'never'}
      shadows={phone ? false : { type: THREE.PCFShadowMap }}
      dpr={maxDpr}
      camera={{ position: [0, 1.5, 7.2], fov: 22.9, near: 0.1, far: 500 }}
      gl={{
        antialias: phone, // desktop anti-aliases in post (SMAA); phones have no post pass
        stencil: false,
        depth: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        powerPreference: phone ? 'default' : 'high-performance',
      }}
    >
      <color attach="background" args={['#1b1e4a']} />
      <AdaptiveDpr max={maxDpr} />
      <Suspense fallback={null}>
        <Scene phone={phone} onReady={onReady} />
      </Suspense>
    </Canvas>
  )
}
