import { useEffect, useMemo, useRef } from 'react'
import { Canvas, invalidate, useFrame } from '@react-three/fiber'
import { DoubleSide, Vector2 } from 'three'

// Ported from yo5on/Aboutme (src/ui/NoiseOverlay.tsx): full-screen film grain over the stage, its own canvas,
// redrawn about once a second (frameloop="demand"), so it costs almost nothing.
// Aboutme drew the grain near-white and relied on CSS mix-blend-mode: multiply at 50% opacity to turn it into
// darkening. Wherever the browser composites that WebGL layer without the blend, the grain paints as a grey-white
// veil over the navy. Instead the shader outputs the multiply result directly, as black with alpha =
// strength × (1 − grain): plain alpha blending then gives bg × (1 − strength × (1 − grain)), the same as multiply,
// so it can only darken, never lighten or tint the page.
const CONFIG = { zIndex: 100, strength: 0.14 } // Aboutme's look was strength 0.5
const num = (v: number) => v.toFixed(3)

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec2 uResolution;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x)
      + (c - a) * u.y * (1.0 - u.x)
      + (d - b) * u.x * u.y;
  }

  void main() {
    vec2 pixel = gl_FragCoord.xy;
    float frame = uTime;
    float mask = noise(pixel / uResolution.y * 30.0 + 1000.0*hash(vec2(frame * 0.1))) * 0.2;
    mask = smoothstep(0.005, 0.03, mask);
    float b = noise(pixel / uResolution.y * 30.0 + 1000.0*hash(vec2(frame * 0.1))) * 0.2;
    b += noise(pixel / uResolution.y * 60.0 + 1000.0*hash(vec2(frame * 0.2))) * 0.5;
    b = clamp(b, 0.0, 1.0);
    b = smoothstep(0.1, 0.12, b);
    vec3 color = mix(vec3(0.2, 0.4, 0.45), vec3(1.0, 1.4, 1.3), b);
    color += vec3(mask);
    color *= hash(pixel / uResolution.y * 200.0 + 1000.0*hash(vec2(frame * 0.3))) * 4.0;
    color = clamp(color, 0.0, 1.0);
    // luminance, so the grain never shifts the palette's hue
    float grain = dot(color, vec3(0.2126, 0.7152, 0.0722));
    gl_FragColor = vec4(vec3(0.0), (1.0 - grain) * ${num(CONFIG.strength)});
  }
`

function NoisePlane() {
  const materialRef = useRef<any>(null)
  const resolution = useMemo(() => new Vector2(), [])
  const lastTimeRef = useRef(-999)
  const frameRate = 1

  useFrame(({ clock, size }) => {
    if (!materialRef.current) return
    if (clock.elapsedTime - lastTimeRef.current < (1 / frameRate) * 0.5) return
    lastTimeRef.current = clock.elapsedTime
    materialRef.current.uniforms.uTime.value = clock.elapsedTime % 10000
    resolution.set(size.width, size.height)
    materialRef.current.uniforms.uResolution.value = resolution
  })

  // demand mode: a timer invalidates for the slowly flickering grain
  useEffect(() => {
    const interval = setInterval(() => invalidate(), 1000 / frameRate)
    return () => clearInterval(interval)
  }, [])

  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uResolution: { value: resolution } }), [resolution])

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        transparent
        depthTest={false}
        depthWrite={false}
        side={DoubleSide}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  )
}

export default function NoiseOverlay() {
  return (
    <div
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: CONFIG.zIndex }}
    >
      <Canvas
        style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
        frameloop="demand"
        camera={{ position: [0, 0, 1] }}
        gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}
      >
        <NoisePlane />
      </Canvas>
    </div>
  )
}
