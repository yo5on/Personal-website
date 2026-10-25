import { analyseEye } from './eyeTracking'

// eyeTracking's image analysis for one eye capture, off the main thread (see analyseOffThread)
self.onmessage = (e: MessageEvent<Uint8Array>) => {
  const r = analyseEye(e.data)
  self.postMessage(r, { transfer: r ? [r.clean.buffer, r.bg.buffer] : [] })
}
