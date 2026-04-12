import './style.css'
import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass }     from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'

gsap.registerPlugin(ScrollTrigger)

/* ─────────────────────────────────────────────────────────────
   NAV
───────────────────────────────────────────────────────────── */
const nav = document.getElementById('nav')!
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60)
}, { passive: true })

/* ─────────────────────────────────────────────────────────────
   HERO TEXT ELEMENTS
───────────────────────────────────────────────────────────── */
const loaderEl  = document.getElementById('hero-loader')!
const pctEl     = document.getElementById('loader-pct')!
const fillEl    = document.getElementById('loader-fill')!
const orbsEl    = document.getElementById('hero-orbs')!       as HTMLElement
const blueRise  = document.getElementById('sections-rise')!   as HTMLElement
const headline  = document.querySelector('.hero-headline-frame')    as HTMLElement
const subEl     = document.querySelector('.hero-sub')         as HTMLElement
const actionsEl = document.querySelector('.hero-actions')     as HTMLElement
const rulersEl  = document.querySelector('.hero-rulers')      as HTMLElement
const starsEl   = document.getElementById('hero-stars')       as HTMLElement
const hudTextEl   = document.getElementById('hero-hud-text')    as HTMLElement
const scrollNudge = document.getElementById('scroll-nudge')!   as HTMLElement

gsap.set([headline, subEl, actionsEl], { opacity: 0, y: 28 })
gsap.set(rulersEl,    { opacity: 0 })
gsap.set(starsEl,     { opacity: 0 })
gsap.set(hudTextEl,   { opacity: 0, visibility: 'hidden' })
gsap.set(blueRise, { y: '100vh' }) // start below viewport, rises to y:0

/* ─────────────────────────────────────────────────────────────
   THREE.JS — RENDERER
───────────────────────────────────────────────────────────── */
const renderer = new THREE.WebGLRenderer({
  antialias:         true,
  alpha:             true,
  powerPreference:   'high-performance'
})
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setClearColor(0x000000, 1)
renderer.toneMapping      = THREE.NoToneMapping
renderer.outputColorSpace = THREE.SRGBColorSpace
orbsEl.appendChild(renderer.domElement)

/* ─────────────────────────────────────────────────────────────
   SCENE & CAMERA
───────────────────────────────────────────────────────────── */
const scene  = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(
  46,
  window.innerWidth / window.innerHeight,
  0.1, 100
)
camera.position.z = 13

/* ─────────────────────────────────────────────────────────────
   PARTICLE SWARM — instanced tetrahedra lerp onto sphere surface
───────────────────────────────────────────────────────────── */
const SWARM_COUNT = 2500
const SWARM_R     = 3.8   // sphere radius in scene units

const swarmGeo  = new THREE.TetrahedronGeometry(0.022)
const swarmMat  = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 })
const redColor   = new THREE.Color(3.0, 0.25, 0.0)
const blueColor  = new THREE.Color(0.0, 2.5, 6.0)
const oceanColor     = new THREE.Color(0.06, 0.008, 0.0)   // very faint red for ocean
const oceanBlueColor = new THREE.Color(0.0, 0.06, 0.16)   // very faint blue for ocean
const isLandArr  = new Uint8Array(SWARM_COUNT).fill(1)  // default all land until mask loads
const swarmMesh = new THREE.InstancedMesh(swarmGeo, swarmMat, SWARM_COUNT)
swarmMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)

const ringGroup = new THREE.Group()
ringGroup.add(swarmMesh)
ringGroup.scale.setScalar(0.757)
scene.add(ringGroup)

// Start positions: random cloud that converges onto the sphere
const swarmPositions: THREE.Vector3[] = []
for (let i = 0; i < SWARM_COUNT; i++) {
  swarmPositions.push(new THREE.Vector3(
    (Math.random() - 0.5) * SWARM_R * 4,
    (Math.random() - 0.5) * SWARM_R * 4,
    (Math.random() - 0.5) * SWARM_R * 4
  ))
  swarmMesh.setColorAt(i, redColor)
}
if (swarmMesh.instanceColor) swarmMesh.instanceColor.needsUpdate = true

// Load Earth specular map: bright = ocean, dark = land
{
  const maskImg = new Image()
  maskImg.crossOrigin = 'anonymous'
  maskImg.src = 'https://raw.githubusercontent.com/mrdoob/three.js/r160/examples/textures/planets/earth_specular_2048.jpg'
  maskImg.onload = () => {
    const mc = document.createElement('canvas')
    mc.width  = maskImg.naturalWidth
    mc.height = maskImg.naturalHeight
    const mctx = mc.getContext('2d')!
    mctx.drawImage(maskImg, 0, 0)
    const pd = mctx.getImageData(0, 0, mc.width, mc.height)
    for (let i = 0; i < SWARM_COUNT; i++) {
      const phi   = Math.acos(-1 + (2 * i) / SWARM_COUNT)
      const theta = (Math.sqrt(SWARM_COUNT * Math.PI) * phi) % (Math.PI * 2)
      const u = theta / (Math.PI * 2)
      const v = phi / Math.PI
      const px = Math.min(Math.floor(u * mc.width),  mc.width  - 1)
      const py = Math.min(Math.floor(v * mc.height), mc.height - 1)
      const brightness = pd.data[(py * mc.width + px) * 4]
      isLandArr[i] = brightness < 120 ? 1 : 0  // dark = land, bright = ocean
    }
  }
}

// Bloom post-processing
const composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera))
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.7, 1.02, 0.1
)
composer.addPass(bloomPass)

/* ─────────────────────────────────────────────────────────────
   RENDER LOOP
───────────────────────────────────────────────────────────── */
const dummy   = new THREE.Object3D()
const target  = new THREE.Vector3()
const _quat   = new THREE.Quaternion()
const _axisX  = new THREE.Vector3(1, 0, 0)
const _axisY  = new THREE.Vector3(0, 1, 0)

/* ── Drag-to-rotate ─────────────────────────────────────────── */
let isDragging = false
let dragPrevX  = 0
let dragPrevY  = 0
let dragVelX   = 0
let dragVelY   = 0

/* ── Cursor repulsion ───────────────────────────────────────── */
const mouseNDC     = new THREE.Vector2(9999, 9999)
const _raycaster    = new THREE.Raycaster()
const _invMat       = new THREE.Matrix4()
const _localOrigin  = new THREE.Vector3()
const _localDir     = new THREE.Vector3()
const _localRay     = new THREE.Ray()
const _closestOnRay = new THREE.Vector3()
const _toPos        = new THREE.Vector3()

window.addEventListener('pointermove', (e: PointerEvent) => {
  const rect = renderer.domElement.getBoundingClientRect()
  mouseNDC.x = ((e.clientX - rect.left) / rect.width)  *  2 - 1
  mouseNDC.y = ((e.clientY - rect.top)  / rect.height) * -2 + 1
}, { passive: true })

const COLOR_R     = 1.15
const colorBlend  = new Float32Array(SWARM_COUNT)   // 0 = base color, 1 = blue
const _tempColor  = new THREE.Color()

// Listen on document — hero-inner (z-index 5) sits above the canvas
// and would swallow canvas-level events
const heroEl = document.getElementById('hero')!
heroEl.style.cursor = 'grab'

document.addEventListener('pointerdown', (e: PointerEvent) => {
  // Only start drag if clicking within the hero section
  if (!heroEl.contains(e.target as Node)) return
  isDragging = true
  dragPrevX  = e.clientX
  dragPrevY  = e.clientY
  dragVelX   = 0
  dragVelY   = 0
  heroEl.style.cursor = 'grabbing'
})

document.addEventListener('pointermove', (e: PointerEvent) => {
  if (!isDragging) return
  dragVelY =  (e.clientX - dragPrevX) * 0.003
  dragVelX =  (e.clientY - dragPrevY) * 0.003
  dragPrevX = e.clientX
  dragPrevY = e.clientY
})

document.addEventListener('pointerup', () => {
  if (!isDragging) return
  isDragging = false
  heroEl.style.cursor = 'grab'
})

function animate() {
  requestAnimationFrame(animate)

  if (!isDragging) {
    dragVelX *= 0.97
    dragVelY *= 0.97
  }
  // Rotate around world-space axes (quaternion) — prevents gimbal flip
  _quat.setFromAxisAngle(_axisY, 0.0012 + dragVelY)
  ringGroup.quaternion.premultiply(_quat)
  _quat.setFromAxisAngle(_axisX, 0.0004 + dragVelX)
  ringGroup.quaternion.premultiply(_quat)

  // Transform cursor ray into ringGroup local space
  ringGroup.updateMatrixWorld()
  _invMat.copy(ringGroup.matrixWorld).invert()
  _raycaster.setFromCamera(mouseNDC, camera)
  _localOrigin.copy(_raycaster.ray.origin).applyMatrix4(_invMat)
  _localDir.copy(_raycaster.ray.direction).transformDirection(_invMat)
  _localRay.set(_localOrigin, _localDir)

  // Lerp each particle toward its fibonacci sphere target + cursor repulsion
  for (let i = 0; i < SWARM_COUNT; i++) {
    const phi   = Math.acos(-1 + (2 * i) / SWARM_COUNT)
    const theta = Math.sqrt(SWARM_COUNT * Math.PI) * phi
    target.set(
      SWARM_R * Math.cos(theta) * Math.sin(phi),
      SWARM_R * Math.sin(theta) * Math.sin(phi),
      SWARM_R * Math.cos(phi)
    )
    swarmPositions[i].lerp(target, 0.08)

    // Perpendicular distance from particle to cursor ray
    _toPos.subVectors(swarmPositions[i], _localRay.origin)
    const t = _toPos.dot(_localDir)
    _closestOnRay.copy(_localRay.origin).addScaledVector(_localDir, t)
    const distSq = swarmPositions[i].distanceToSquared(_closestOnRay)

    // Front-face check: particle normal (its position) dotted with direction to camera
    // _toPos = particle - cameraLocal, so dot(particle, _toPos) < 0 means facing camera
    const frontFacing = swarmPositions[i].dot(_toPos) < 0

    // Fade to blue when cursor is near and particle faces camera — never fades back
    if (frontFacing && distSq < COLOR_R * COLOR_R) {
      colorBlend[i] += (1.0 - colorBlend[i]) * 0.12
    }
    const targetBlue = isLandArr[i] ? blueColor : oceanBlueColor
    _tempColor.copy(isLandArr[i] ? redColor : oceanColor).lerp(targetBlue, colorBlend[i])
    swarmMesh.setColorAt(i, _tempColor)

    dummy.position.copy(swarmPositions[i])
    dummy.updateMatrix()
    swarmMesh.setMatrixAt(i, dummy.matrix)
  }
  swarmMesh.instanceMatrix.needsUpdate = true
  if (swarmMesh.instanceColor) swarmMesh.instanceColor.needsUpdate = true

  composer.render()
}

/* ─────────────────────────────────────────────────────────────
   RESIZE
───────────────────────────────────────────────────────────── */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  composer.setSize(window.innerWidth, window.innerHeight)
}, { passive: true })

/* ─────────────────────────────────────────────────────────────
   LOADER COUNTER
───────────────────────────────────────────────────────────── */
let pct = 0
const tick = setInterval(() => {
  pct = Math.min(pct + Math.floor(Math.random() * 7) + 3, 100)
  pctEl.textContent  = `${pct}%`
  fillEl.style.width = `${pct}%`
  if (pct >= 100) {
    clearInterval(tick)
    setTimeout(initHero, 280)
  }
}, 55)

/* ─────────────────────────────────────────────────────────────
   INIT — loader out, canvas fades in, render loop starts
───────────────────────────────────────────────────────────── */
function initHero() {
  loaderEl.classList.add('done')
  animate()

  gsap.to(orbsEl,      { opacity: 1, duration: 1.2, ease: 'power2.out' })
  scrollNudge.style.visibility = 'visible'
  nudgeFadeTween = gsap.fromTo(scrollNudge, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'power2.out' })
  gsap.set(hudTextEl, { visibility: 'visible' })
  hudFadeTween = gsap.to(hudTextEl, { opacity: 1, duration: 6.0, delay: 0.6, ease: 'power2.out',
    onStart: () => { hudReady = true }
  })

  // Arc stays hidden until scroll timeline reveals it after text appears
}

/* ─────────────────────────────────────────────────────────────
   SCROLL ANIMATION
   Pin the hero. As the user scrolls:
     1. Ring scales up (discs fly off-screen) + fades out.
     2. Headline / sub / CTAs fade up through the empty centre.
   GSAP animates Three.js object properties directly — this
   works because GSAP can tween any numeric JS property.
───────────────────────────────────────────────────────────── */
const ringProxy = { scale: 0.757, opacity: 1.0 }
let hudReady = false
let hudFadeTween: gsap.core.Tween | null = null
let nudgeFadeTween: gsap.core.Tween | null = null

const heroTl = gsap.timeline({
  scrollTrigger: {
    trigger:       '#hero',
    start:         'top top',
    end:           '+=550%',
    pin:           true,
    scrub:         1.5,
    anticipatePin: 1,
    onUpdate: (self) => {
      if (self.progress > 0) {
        if (nudgeFadeTween) { nudgeFadeTween.kill(); nudgeFadeTween = null }
        scrollNudge.style.opacity = String(Math.max(0, 1 - self.progress / 0.25))
      }
      if (hudReady) {
        if (hudFadeTween && self.progress > 0) {
          hudFadeTween.kill()
          hudFadeTween = null
        }
        hudTextEl.style.opacity = String(Math.max(0, 1 - self.progress / 0.45))
      }
    }
  }
})

heroTl
  // ── Phase 1: ring blooms out (0 → 0.75) ──────────────────────────────
  .to(ringProxy, {
    scale:   3.85,
    opacity: 0,
    ease:    'power2.in',
    duration: 0.75,
    onUpdate() {
      ringGroup.scale.setScalar(ringProxy.scale)
      swarmMat.opacity = ringProxy.opacity
    }
  }, 0)

  // ── Phase 2: text fades in — stays fixed ──────────────────────────────
  .to(rulersEl,  { opacity: 1, ease: 'power2.out', duration: 0.35 }, 0.42)
  .to(starsEl,   { opacity: 1, ease: 'power2.out', duration: 0.50 }, 0.42)
  .to(headline,  { opacity: 1, y: 0, ease: 'power2.out', duration: 0.35 }, 0.42)
  .to(subEl,     { opacity: 1, y: 0, ease: 'power2.out', duration: 0.30 }, 0.54)
  .to(actionsEl, { opacity: 1, y: 0, ease: 'power2.out', duration: 0.25 }, 0.54)
  // Arc fades in — delayed to give reading time on headline
  .to(blueRise,  { opacity: 1, duration: 0.20, ease: 'power2.out' }, 0.80)

  // ── Phase 3: panel rises ───────────────────────────────────────────────
  .to(blueRise, {
    y:        0,
    ease:     'power1.inOut',
    duration: 0.35
  }, 0.85)


/* ─────────────────────────────────────────────────────────────
   SCROLL REVEAL — sections below hero
───────────────────────────────────────────────────────────── */
const obs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return
    entry.target.classList.add('in-view')
    entry.target.querySelectorAll('.reveal-child').forEach((child, i) => {
      setTimeout(() => child.classList.add('in-view'), i * 110)
    })
    obs.unobserve(entry.target)
  })
}, { threshold: 0.08 })

document.querySelectorAll('.reveal').forEach(el => obs.observe(el))

/* ── Caspian numbered cards — slide up on enter ──────────────── */
const cardObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return
    entry.target.classList.add('card-visible')
    cardObs.unobserve(entry.target)
  })
}, { threshold: 0.12 })

document.querySelectorAll('.vp-card-num').forEach(card => cardObs.observe(card))


/* ── Caspian card canvas illustrations ──────────────────────── */
function initVpCanvas(canvas: HTMLCanvasElement, index: number) {
  const parent = canvas.parentElement as HTMLElement
  const W = parent.offsetWidth  || 400
  const H = parent.offsetHeight || 300
  canvas.width  = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  switch (index) {
    case 0: vpWavyLines(ctx, W, H);   break
    case 1: vpNetworkNodes(ctx, W, H); break
    case 2: vpModuleGrid(ctx, W, H);   break
    case 3: vpOrbitData(ctx, W, H);    break
    case 4: vpScanGrid(ctx, W, H);     break
  }
}

function vpWavyLines(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const lines = 14, sp = W / (lines + 1)
  let t = 0
  ;(function frame() {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H)
    for (let i = 0; i < lines; i++) {
      const x = sp * (i + 1)
      ctx.beginPath()
      ctx.strokeStyle = i % 4 === 0 ? '#0016FC' : `rgba(255,255,255,${0.3 + i * 0.03})`
      ctx.lineWidth   = i % 4 === 0 ? 1.5 : 0.7
      for (let y = 0; y <= H; y += 2) {
        const amp = (i / lines) * 22 + 5
        const dx  = Math.sin((y / H * 2.8 + t + i * 0.45) * Math.PI) * amp
        y === 0 ? ctx.moveTo(x + dx, y) : ctx.lineTo(x + dx, y)
      }
      ctx.stroke()
    }
    t += 0.016
    requestAnimationFrame(frame)
  })()
}

function vpNetworkNodes(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const nodes = [
    { x: W * 0.20, y: H * 0.30 }, { x: W * 0.50, y: H * 0.18 },
    { x: W * 0.82, y: H * 0.35 }, { x: W * 0.30, y: H * 0.72 },
    { x: W * 0.72, y: H * 0.75 },
  ]
  const edges = [[0,1],[1,2],[0,3],[1,4],[2,4],[3,4]]
  let t = 0
  ;(function frame() {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H)
    edges.forEach(([a, b], ei) => {
      const na = nodes[a], nb = nodes[b]
      ctx.beginPath(); ctx.strokeStyle = 'rgba(0,22,252,0.3)'; ctx.lineWidth = 1
      ctx.moveTo(na.x, na.y); ctx.lineTo(nb.x, nb.y); ctx.stroke()
      const p  = (t * 0.5 + ei * 0.25) % 1
      ctx.beginPath()
      ctx.arc(na.x + (nb.x - na.x) * p, na.y + (nb.y - na.y) * p, 2.5, 0, Math.PI * 2)
      ctx.fillStyle = '#0016FC'; ctx.fill()
    })
    nodes.forEach((n, i) => {
      const pulse = Math.sin(t * 1.4 + i * 0.9) * 0.5 + 0.5
      const r = 12 + pulse * 6
      const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r)
      grd.addColorStop(0, 'rgba(0,22,252,0.6)'); grd.addColorStop(1, 'transparent')
      ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2); ctx.fillStyle = grd; ctx.fill()
      ctx.beginPath(); ctx.arc(n.x, n.y, 3, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill()
    })
    t += 0.022; requestAnimationFrame(frame)
  })()
}

function vpModuleGrid(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const cols = 7, rows = 5
  const cw = W / (cols + 1), ch = H / (rows + 1)
  const sz = Math.min(cw, ch) * 0.42
  let t = 0
  ;(function frame() {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H)
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const x = cw * (c + 1), y = ch * (r + 1)
        const wave = (Math.sin(t * 1.2 - c * 0.7 - r * 0.5) + 1) / 2
        const isBlue = (c + r) % 3 === 0
        const alpha = 0.12 + wave * 0.7
        ctx.strokeStyle = isBlue ? `rgba(0,22,252,${alpha})` : `rgba(255,255,255,${alpha * 0.55})`
        ctx.lineWidth   = isBlue ? 1.2 : 0.7
        ctx.strokeRect(x - sz / 2, y - sz / 2, sz, sz)
        if (wave > 0.75) {
          ctx.fillStyle = isBlue
            ? `rgba(0,22,252,${(wave - 0.75) * 1.5})`
            : `rgba(255,255,255,${(wave - 0.75) * 0.8})`
          ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz)
        }
      }
    }
    t += 0.025; requestAnimationFrame(frame)
  })()
}

function vpOrbitData(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const cx = W / 2, cy = H / 2, mn = Math.min(W, H)
  const rings = [
    { r: mn * 0.12, spd:  0.50, n: 3 },
    { r: mn * 0.24, spd: -0.30, n: 5 },
    { r: mn * 0.38, spd:  0.18, n: 7 },
  ]
  let t = 0
  ;(function frame() {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H)
    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, rings[0].r * 1.8)
    grd.addColorStop(0, 'rgba(0,22,252,0.45)'); grd.addColorStop(1, 'transparent')
    ctx.beginPath(); ctx.arc(cx, cy, rings[0].r * 1.8, 0, Math.PI * 2); ctx.fillStyle = grd; ctx.fill()
    ctx.beginPath(); ctx.arc(cx, cy, 3.5, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill()
    rings.forEach((ring, ri) => {
      ctx.beginPath(); ctx.arc(cx, cy, ring.r, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(0,22,252,0.18)'; ctx.lineWidth = 0.5; ctx.stroke()
      for (let i = 0; i < ring.n; i++) {
        const angle = (i / ring.n) * Math.PI * 2 + t * ring.spd
        ctx.beginPath()
        ctx.arc(cx + Math.cos(angle) * ring.r, cy + Math.sin(angle) * ring.r, ri === 0 ? 3 : 2, 0, Math.PI * 2)
        ctx.fillStyle = ri === 0 ? '#0016FC' : 'rgba(255,255,255,0.7)'; ctx.fill()
      }
    })
    t += 0.022; requestAnimationFrame(frame)
  })()
}

function vpScanGrid(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const gs = 30
  let t = 0
  ;(function frame() {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H)
    const scanY = (t % 1) * H
    for (let x = 0; x <= W; x += gs) {
      ctx.beginPath(); ctx.strokeStyle = 'rgba(0,22,252,0.1)'; ctx.lineWidth = 0.5
      ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
    }
    for (let y = 0; y <= H; y += gs) {
      const g = Math.max(0, 1 - Math.abs(y - scanY) / (gs * 2.5))
      ctx.beginPath()
      ctx.strokeStyle = `rgba(0,22,252,${0.08 + g * 0.65})`; ctx.lineWidth = 0.5 + g * 1.2
      ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
      if (g > 0.3) {
        for (let x = 0; x <= W; x += gs) {
          ctx.beginPath(); ctx.arc(x, y, 1.5 * g, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(0,22,252,${g * 0.9})`; ctx.fill()
        }
      }
    }
    const sg = ctx.createLinearGradient(0, scanY - 10, 0, scanY + 10)
    sg.addColorStop(0, 'transparent'); sg.addColorStop(0.5, 'rgba(0,22,252,0.7)'); sg.addColorStop(1, 'transparent')
    ctx.fillStyle = sg; ctx.fillRect(0, scanY - 10, W, 20)
    t += 0.005; requestAnimationFrame(frame)
  })()
}

setTimeout(() => {
  document.querySelectorAll<HTMLCanvasElement>('.vp-canvas').forEach((canvas, i) => {
    initVpCanvas(canvas, i)
  })
}, 200)

/* ─────────────────────────────────────────────────────────────
   HERO GRID — align background to headline-frame corners
───────────────────────────────────────────────────────────── */
function alignHeroGrid() {
  const frame   = document.querySelector<HTMLElement>('.hero-headline-frame')
  const grid    = document.querySelector<HTMLElement>('.hero-grid')
  if (!frame || !grid) return
  const rect    = frame.getBoundingClientRect()
  const offsetX = rect.left % 64
  const offsetY = rect.top  % 64
  grid.style.backgroundPosition = `${offsetX}px ${offsetY}px`
}
window.addEventListener('load',   alignHeroGrid)
window.addEventListener('resize', alignHeroGrid)

/* ── Hero star dots ─────────────────────────────────────────── */
function drawStars() {
  const canvas = document.getElementById('hero-stars') as HTMLCanvasElement
  const hero   = document.getElementById('hero')!
  canvas.width  = hero.offsetWidth
  canvas.height = hero.offsetHeight
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const COUNT = 39
  for (let i = 0; i < COUNT; i++) {
    const x    = Math.random() * canvas.width
    const y    = Math.random() * canvas.height
    const r    = Math.random() * 1.2 + 0.3        // 0.3–1.5px radius
    const glow = r * 6

    const grad = ctx.createRadialGradient(x, y, 0, x, y, glow)
    grad.addColorStop(0,   `rgba(100, 180, 255, ${0.54 + Math.random() * 0.36})`)
    grad.addColorStop(0.3, `rgba(60,  130, 255, ${0.135 + Math.random() * 0.09})`)
    grad.addColorStop(1,   'rgba(0, 0, 0, 0)')

    ctx.beginPath()
    ctx.arc(x, y, glow, 0, Math.PI * 2)
    ctx.fillStyle = grad
    ctx.fill()

    // Bright core dot
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(180, 220, 255, ${0.63 + Math.random() * 0.27})`
    ctx.fill()
  }
}
window.addEventListener('load',   drawStars)
window.addEventListener('resize', drawStars)

/* ─────────────────────────────────────────────────────────────
   SPOTLIGHT CURSOR — feeds --cursor-x / --cursor-y to all cards
───────────────────────────────────────────────────────────── */
const crosshairX = document.getElementById('crosshair-x')!
const crosshairY = document.getElementById('crosshair-y')!

document.addEventListener('pointermove', (e: PointerEvent) => {
  document.documentElement.style.setProperty('--cursor-x', String(e.clientX))
  document.documentElement.style.setProperty('--cursor-y', String(e.clientY))

  // Crosshair lines follow cursor within hero
  const heroRect = heroEl.getBoundingClientRect()
  if (e.clientY >= heroRect.top && e.clientY <= heroRect.bottom) {
    crosshairX.style.top = `${e.clientY - heroRect.top}px`
    crosshairY.style.left = `${e.clientX - heroRect.left}px`
  }


}, { passive: true })

/* ─────────────────────────────────────────────────────────────
   BUTTON CHARACTER STAGGER (rilian.com style)
   Splits each button's text into individual <span> chars so
   they can slide up with staggered delays on hover.
───────────────────────────────────────────────────────────── */
document.querySelectorAll<HTMLElement>('.btn-primary, .btn-ghost').forEach(btn => {
  Array.from(btn.childNodes).forEach(node => {
    if (node.nodeType !== Node.TEXT_NODE) return
    const text = node.textContent ?? ''
    if (!text.trim()) return
    const clip = document.createElement('span')
    clip.className = 'btn-chars-clip'
    const wrapper = document.createElement('span')
    wrapper.className = 'btn-chars'
    text.split('').forEach((char, i) => {
      const span = document.createElement('span')
      span.className = 'btn-char'
      span.style.transitionDelay = `${i * 0.012}s`
      if (char === ' ') span.style.whiteSpace = 'pre'
      span.textContent = char
      wrapper.appendChild(span)
    })
    clip.appendChild(wrapper)
    node.replaceWith(clip)
  })
})

/* ─────────────────────────────────────────────────────────────
   DIFF CARD STACK — drag / click to cycle
───────────────────────────────────────────────────────────── */
const diffCards = Array.from(document.querySelectorAll<HTMLElement>('.diff-card'))

if (diffCards.length) {
  let frontIdx = 0
  const POSITIONS = ['is-front', 'is-right', 'is-left'] // index offsets 0,1,2

  function applyPositions() {
    const n = diffCards.length
    diffCards.forEach((card, i) => {
      card.classList.remove('is-front', 'is-left', 'is-right')
      const offset = ((i - frontIdx) + n) % n
      if (offset < POSITIONS.length) card.classList.add(POSITIONS[offset])
    })
  }

  // Click a back card → bring to front
  diffCards.forEach((card, i) => {
    card.addEventListener('click', () => {
      if (!card.classList.contains('is-front')) {
        frontIdx = i
        applyPositions()
      }
    })
  })

  // Drag on the stack to cycle
  const stackEl = document.querySelector<HTMLElement>('.diff-stack')!
  let dragStartX = 0
  let isDragging = false

  stackEl.addEventListener('pointerdown', (e: PointerEvent) => {
    dragStartX = e.clientX
    isDragging = true
    stackEl.setPointerCapture(e.pointerId)
  })

  stackEl.addEventListener('pointerup', (e: PointerEvent) => {
    if (!isDragging) return
    isDragging = false
    const delta = e.clientX - dragStartX
    if (Math.abs(delta) > 50) {
      frontIdx = ((frontIdx + (delta < 0 ? 1 : -1)) + diffCards.length) % diffCards.length
      applyPositions()
    }
  })

  applyPositions()

  // Nudge hint: play once when stack scrolls into view
  const nudgeObs = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      nudgeObs.disconnect()
      setTimeout(() => {
        const front = diffCards.find(c => c.classList.contains('is-front'))
        if (front) {
          front.classList.add('nudge')
          front.addEventListener('animationend', () => front.classList.remove('nudge'), { once: true })
        }
      }, 600)
    }
  }, { threshold: 0.5 })
  const stackObs = document.querySelector('.diff-stack')
  if (stackObs) nudgeObs.observe(stackObs)
}

/* ── DAWNTREADER title: robotic letter-by-letter reveal ─────── */
function initRoboticTitle(el: HTMLElement) {
  const text = el.textContent ?? ''
  el.innerHTML = text.split('').map(ch =>
    `<span class="dt-char">${ch === ' ' ? '&nbsp;' : ch}</span>`
  ).join('')
  const chars = Array.from(el.querySelectorAll<HTMLElement>('.dt-char'))
  const obs = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return
    obs.disconnect()
    const order = chars.map((_, i) => i).sort(() => Math.random() - 0.5)
    order.forEach((charIdx, step) => {
      setTimeout(() => chars[charIdx].classList.add('on'), step * 60)
    })
  }, { threshold: 0.5 })
  obs.observe(el)
}

const dtTitleEl = document.querySelector<HTMLElement>('.dawntreader-title')
if (dtTitleEl) initRoboticTitle(dtTitleEl)

const armoryTitleEl = document.querySelector<HTMLElement>('.armory-title')
if (armoryTitleEl) initRoboticTitle(armoryTitleEl)

const caspianTitleNew = document.querySelector<HTMLElement>('.caspian-title')
if (caspianTitleNew) initRoboticTitle(caspianTitleNew)

/* ─────────────────────────────────────────────────────────────
   PROBLEM RAYS — scroll-driven reveal on static SVG paths
───────────────────────────────────────────────────────────── */
;(function initProblemRays() {
  const problem = document.getElementById('problem')
  if (!problem) return

  // Order: left-outer → left-mid → left-inner → center → right-inner → right-mid → right-outer
  const rayIds = ['r5', 'r3', 'r1', null, 'r0', 'r2', 'r4']
  const allPaths = rayIds.map(id =>
    id === null
      ? problem.querySelector<SVGPathElement>('.ray-center')!
      : problem.querySelector<SVGPathElement>(`path[stroke="url(#${id})"]`)!
  ).filter(Boolean)
  if (!allPaths.length) return

  // Set initial dasharray/dashoffset using actual path lengths
  allPaths.forEach(p => {
    const len = p.getTotalLength()
    p.style.strokeDasharray = String(len)
    p.style.strokeDashoffset = String(len)
    p.style.transition = 'none'
  })

  const n = allPaths.length  // 7 paths

  function update() {
    const rect = problem!.getBoundingClientRect()
    const vh = window.innerHeight
    const raw = (vh - rect.top) / (vh + rect.height * 0.4)
    const progress = Math.max(0, Math.min(1, raw))

    // Each path gets an equal slice of the scroll range
    // Path i only starts drawing once the previous one is fully drawn
    allPaths.forEach((p, i) => {
      const sliceStart = i / n
      const sliceEnd   = (i + 1) / n
      const p2 = Math.max(0, Math.min(1, (progress - sliceStart) / (sliceEnd - sliceStart)))
      const len = parseFloat(p.style.strokeDasharray)
      p.style.strokeDashoffset = String(len * (1 - p2))
    })
  }

  window.addEventListener('scroll', update, { passive: true })
  update()
})()

/* ── Center ray: from problem orb → top of caspian screen ── */
;(function initCenterRay() {
  const ray        = document.getElementById('center-ray')
  const riseEl     = document.getElementById('sections-rise')
  const orbEl      = document.querySelector<SVGCircleElement>('#problem-rays circle')
  const screenWrap = document.querySelector<HTMLElement>('.caspian-screen-wrap')
  if (!ray || !riseEl || !orbEl || !screenWrap) return

  function position() {
    const riseRect   = riseEl!.getBoundingClientRect()
    const orbRect    = orbEl!.getBoundingClientRect()
    const screenRect = screenWrap!.getBoundingClientRect()
    const orbY   = orbRect.top  + orbRect.height  / 2 - riseRect.top
    const endY   = screenRect.top - riseRect.top
    ray!.style.top    = `${orbY}px`
    ray!.style.height = `${Math.max(0, endY - orbY)}px`
  }

  requestAnimationFrame(position)
  window.addEventListener('resize', position)
})()

/* ─────────────────────────────────────────────────────────────
   NEWS TABS
───────────────────────────────────────────────────────────── */
/* ── #caspian anchor: scroll past the hero pin to the real section start ── */
document.querySelectorAll<HTMLAnchorElement>('a[href="#caspian"]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault()
    const heroEl2    = document.getElementById('hero')!
    const problemEl  = document.getElementById('problem')!
    const trigger    = ScrollTrigger.getAll().find(t => t.trigger === heroEl2)
    const pinEnd     = trigger ? trigger.end : heroEl2.offsetHeight
    window.scrollTo({ top: pinEnd + problemEl.offsetHeight, behavior: 'smooth' })
  })
})

/* ─────────────────────────────────────────────────────────────
   RISE ARC — pin bottom rim at Armory / Why Rilian boundary
───────────────────────────────────────────────────────────── */
;(function pinRiseArcBottom() {
  const arc          = document.querySelector('.rise-arc')         as HTMLElement
  const sectionsRise = document.getElementById('sections-rise')    as HTMLElement
  const whySection   = document.getElementById('why')              as HTMLElement
  if (!arc || !sectionsRise || !whySection) return

  function update() {
    const riseTop = sectionsRise.getBoundingClientRect().top + window.scrollY
    const whyTop  = whySection.getBoundingClientRect().top  + window.scrollY
    const offset  = window.innerHeight * 0.03 + 80   // compensate for top: -3vh, +80px pushes rim into #why
    arc.style.height = `${whyTop - riseTop + offset}px`
  }

  update()
  window.addEventListener('resize', update, { passive: true })
})()

/* ─────────────────────────────────────────────────────────────
   NEWSROOM — homepage preview (3 cards per tab)
───────────────────────────────────────────────────────────── */
;(function initHomeNewsroom() {
  import('./articles').then(({ ARTICLES, cardHTML, revealCards }) => {
    const grid = document.getElementById('home-news-grid') as HTMLElement | null
    if (!grid) return

    function showTab(tab: string) {
      const subset = ARTICLES.filter(a => a.tab === tab).slice(0, 3)
      grid!.innerHTML = subset.map(cardHTML).join('')
      revealCards(grid!)
    }

    // Initial render — press releases
    showTab('press')

    document.querySelectorAll<HTMLButtonElement>('.news-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.news-tab').forEach(t => t.classList.remove('active'))
        btn.classList.add('active')
        const tab = btn.dataset.tab ?? 'press'
        showTab(tab)
      })
    })
  })
})()

/* ─────────────────────────────────────────────────────────────
   CASPIAN — USE CASES ACCORDION
───────────────────────────────────────────────────────────── */
;(function initUseCases() {
  const trigger = document.getElementById('use-cases-trigger')
  const panel   = document.getElementById('use-cases-panel')
  if (!trigger || !panel) return

  trigger.addEventListener('click', () => {
    const isOpen = trigger.getAttribute('aria-expanded') === 'true'
    trigger.setAttribute('aria-expanded', String(!isOpen))
    panel.classList.toggle('is-open', !isOpen)
  })
})()

