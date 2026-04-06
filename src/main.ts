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

gsap.set([headline, subEl, actionsEl], { opacity: 0, y: 28 })
gsap.set(rulersEl,  { opacity: 0 })
gsap.set(starsEl,   { opacity: 0 })
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

  gsap.to(orbsEl, { opacity: 1, duration: 1.2, ease: 'power2.out' })

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

const heroTl = gsap.timeline({
  scrollTrigger: {
    trigger:       '#hero',
    start:         'top top',
    end:           '+=550%',
    pin:           true,
    scrub:         1.5,
    anticipatePin: 1
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
  .to(rulersEl,  { opacity: 1, ease: 'power2.out', duration: 0.35 }, 0.52)
  .to(starsEl,   { opacity: 1, ease: 'power2.out', duration: 0.50 }, 0.52)
  .to(headline,  { opacity: 1, y: 0, ease: 'power2.out', duration: 0.35 }, 0.52)
  .to(subEl,     { opacity: 1, y: 0, ease: 'power2.out', duration: 0.30 }, 0.64)
  .to(actionsEl, { opacity: 1, y: 0, ease: 'power2.out', duration: 0.25 }, 0.72)
  // Arc fades in right after headline
  .to(blueRise,  { opacity: 1, duration: 0.20, ease: 'power2.out' }, 0.70)

  // ── Phase 3: panel rises ───────────────────────────────────────────────
  .to(blueRise, {
    y:        0,
    ease:     'power1.inOut',
    duration: 0.35
  }, 0.75)


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

/* Caspian text: hidden until CASPIAN title animation finishes */
/* Caspian section now uses standard reveal like other sections */

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

  // CASPIAN box: element-relative coords for border glow
  const caspianBox = document.getElementById('caspian-title-box')
  if (caspianBox) {
    const r = caspianBox.getBoundingClientRect()
    caspianBox.style.setProperty('--caspian-x', `${e.clientX - r.left + 2}px`)
    caspianBox.style.setProperty('--caspian-y', `${e.clientY - r.top + 2}px`)
  }

  // CASPIAN screen mockup: element-relative coords for border glow
  const caspianScreenInner = document.querySelector('#caspian .caspian-screen-inner') as HTMLElement | null
  if (caspianScreenInner) {
    const r = caspianScreenInner.getBoundingClientRect()
    caspianScreenInner.style.setProperty('--screen-x', `${e.clientX - r.left}px`)
    caspianScreenInner.style.setProperty('--screen-y', `${e.clientY - r.top}px`)
  }

  // DAWNTREADER screen mockup: element-relative coords for border glow
  const dtScreenInner = document.querySelector('#dawntreader .dt-screen-inner') as HTMLElement | null
  if (dtScreenInner) {
    const r = dtScreenInner.getBoundingClientRect()
    dtScreenInner.style.setProperty('--dt-screen-x', `${e.clientX - r.left}px`)
    dtScreenInner.style.setProperty('--dt-screen-y', `${e.clientY - r.top}px`)
  }

  // ARMORY screen mockup: element-relative coords for border glow
  const armoryScreenInner = document.querySelector('#armory .armory-screen-inner') as HTMLElement | null
  if (armoryScreenInner) {
    const r = armoryScreenInner.getBoundingClientRect()
    armoryScreenInner.style.setProperty('--armory-screen-x', `${e.clientX - r.left}px`)
    armoryScreenInner.style.setProperty('--armory-screen-y', `${e.clientY - r.top}px`)
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

document.querySelectorAll('.news-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.news-tab').forEach(t => t.classList.remove('active'))
    tab.classList.add('active')
  })
})
