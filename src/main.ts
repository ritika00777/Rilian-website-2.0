import './style.css'
import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

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

gsap.set([headline, subEl, actionsEl], { opacity: 0, y: 28 })
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
renderer.toneMapping         = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.3
renderer.outputColorSpace    = THREE.SRGBColorSpace
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
   LIGHTING
   Blue key + purple fill + deep-blue rim + soft front fill.
   This combination produces the blue-purple iridescent look
   from the reference.
───────────────────────────────────────────────────────────── */
scene.add(new THREE.AmbientLight(0x08051a, 3))

// Cool blue key from top-left
const keyLight = new THREE.DirectionalLight(0x88aaff, 7)
keyLight.position.set(-3, 10, 6)
scene.add(keyLight)

// Magenta/pink fill from lower-right — produces the pink iridescent band
const fillLight = new THREE.PointLight(0xff33cc, 9, 40)
fillLight.position.set(9, -5, 4)
scene.add(fillLight)

// Deep violet rim from behind
const rimLight = new THREE.PointLight(0x6622ff, 12, 35)
rimLight.position.set(-2, 5, -10)
scene.add(rimLight)

// Soft cyan front fill
const frontLight = new THREE.PointLight(0x44ddff, 3, 26)
frontLight.position.set(0, 0, 13)
scene.add(frontLight)

// Extra warm purple from top-right for colour variety
const accentLight = new THREE.PointLight(0xaa44ff, 7, 32)
accentLight.position.set(6, 8, 2)
scene.add(accentLight)

/* ─────────────────────────────────────────────────────────────
   GEOMETRY & MATERIAL
   MeshPhysicalMaterial with iridescence is what gives the
   blue-purple glass shimmer seen in the reference. The
   iridescenceThicknessRange controls which color bands appear.
───────────────────────────────────────────────────────────── */
// Cylinder with visible rim — flat face + clear edge like the reference
const discGeo = new THREE.CylinderGeometry(1.25, 1.25, 0.19, 64)

function makeGlassMat(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color:                       new THREE.Color(0x1a10cc),  // blue-violet base
    emissive:                    new THREE.Color(0x180830),
    emissiveIntensity:           0.6,
    transparent:                 true,
    opacity:                     0.90,
    roughness:                   0.01,                       // near-mirror smooth
    metalness:                   0.0,
    iridescence:                 1.0,
    iridescenceIOR:              2.0,                        // strong colour spread
    iridescenceThicknessRange:   [100, 800] as [number, number],
    side:                        THREE.DoubleSide
  })
}

/* ─────────────────────────────────────────────────────────────
   DISC RING SETUP
   8 disc-meshes arranged on "arms" that radiate from the
   ring-group centre. ring-group is tilted on X (-0.62 rad ≈ 35°)
   so the orbit appears as an ellipse from the camera.

   Each disc starts facing the ring-group's +Z (toward camera).
   rotation.set(π/2, 0, spinOffset) with Three.js XYZ Euler order:
     - rz = spinOffset : coin-flip spin axis
     - rx = π/2        : orient flat face toward camera
   The z-component increments every frame producing the
   face-on → edge-on → face-on cycle (the "coin flip").
───────────────────────────────────────────────────────────── */
const ORBIT_R   = 4.0
const RING_TILT = -0.70
const ORBIT_SPD = 0.36                            // rad/s, orbital
const SPIN_SPDS = [1.8, 2.1, 1.6, 2.3, 1.9, 2.05, 1.72, 2.25]  // rad/s, self-spin per disc

const ringGroup = new THREE.Group()
ringGroup.rotation.x = RING_TILT
ringGroup.scale.setScalar(0.7)   // 30% smaller
scene.add(ringGroup)

type DiscEntry = {
  arm:       THREE.Group
  mesh:      THREE.Mesh
  mat:       THREE.MeshPhysicalMaterial
  spinOffset: number
  spinSpeed:  number
}

const discEntries: DiscEntry[] = []

for (let i = 0; i < 8; i++) {
  const arm = new THREE.Group()
  arm.rotation.z = (i / 8) * Math.PI * 2   // spread arms evenly around 360°
  ringGroup.add(arm)

  const mat  = makeGlassMat()
  const mesh = new THREE.Mesh(discGeo, mat)
  mesh.position.x = ORBIT_R
  // Initial orientation: flat face toward ring's +Z (camera)
  mesh.rotation.set(Math.PI / 2, 0, (i / 8) * Math.PI * 2)
  arm.add(mesh)

  discEntries.push({
    arm, mesh, mat,
    spinOffset: (i / 8) * Math.PI * 2,   // start each disc out of phase
    spinSpeed:  SPIN_SPDS[i]
  })
}

/* ─────────────────────────────────────────────────────────────
   RENDER LOOP
   Two simultaneous rotations:
   1. ringGroup.rotation.z → all discs orbit (the "ring spins")
   2. mesh.rotation.z per disc → individual coin-flip self-spin
───────────────────────────────────────────────────────────── */
const clock = new THREE.Clock()

function animate() {
  requestAnimationFrame(animate)
  const t = clock.getElapsedTime()

  // Rotation 1: orbital (whole ring rotates on Z)
  ringGroup.rotation.z = t * ORBIT_SPD

  // Rotation 2: each disc flips on its own axis (rz component)
  discEntries.forEach(({ mesh, spinOffset, spinSpeed }) => {
    mesh.rotation.set(Math.PI / 2, 0, spinOffset + t * spinSpeed)
  })

  renderer.render(scene, camera)
}

/* ─────────────────────────────────────────────────────────────
   RESIZE
───────────────────────────────────────────────────────────── */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
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
const ringProxy = { scale: 0.7, opacity: 0.88 }

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
      discEntries.forEach(({ mat }) => { mat.opacity = ringProxy.opacity })
    }
  }, 0)

  // ── Phase 2: text fades in (0.72 → 1.17) — stays fixed ──────────────
  .to(headline,  { opacity: 1, y: 0, ease: 'power2.out', duration: 0.35 }, 0.72)
  .to(subEl,     { opacity: 1, y: 0, ease: 'power2.out', duration: 0.30 }, 0.84)
  .to(actionsEl, { opacity: 1, y: 0, ease: 'power2.out', duration: 0.25 }, 0.92)
  // Arc fades in right after headline
  .to(blueRise,  { opacity: 1, duration: 0.20, ease: 'power2.out' }, 0.80)

  // ── Phase 3: panel rises (0.85 → 1.20) ───────────────────────────────
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

/* Caspian text: hidden until CASPIAN title animation finishes */
const caspianHeader  = document.querySelector('#caspian .section-header')     as HTMLElement | null
const caspianBody    = document.querySelector('#caspian .section-body')        as HTMLElement | null
const caspianScreen  = document.querySelector('#caspian .caspian-screen-wrap') as HTMLElement | null
const caspianVP      = document.querySelector('#caspian .value-props')         as HTMLElement | null
const caspianIso     = document.querySelector('#caspian .caspian-iso-wrap')    as HTMLElement | null
const caspianBtn     = document.querySelector('#caspian .caspian-cta-wrap')    as HTMLElement | null
const caspianTextEls = [caspianHeader, caspianBody, caspianScreen, caspianVP, caspianIso, caspianBtn].filter(Boolean) as HTMLElement[]
gsap.set(caspianTextEls, { opacity: 0, y: 30 })

/* Caspian title: reveal when centred in viewport */
const caspianTitleEl = document.querySelector('.caspian-big-title') as HTMLElement | null
if (caspianTitleEl) {
  const titleObs = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      titleObs.disconnect()

      caspianTitleEl.classList.add('reveal-in')
      setTimeout(() => {
        document.getElementById('caspian-content')?.classList.add('glow-visible')
      }, 1150)
      gsap.to(caspianTextEls, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out', stagger: 0.07, delay: 0.3 })
    }
  }, { threshold: 0, rootMargin: '-40% 0px -40% 0px' })
  titleObs.observe(caspianTitleEl)
}

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

/* ─────────────────────────────────────────────────────────────
   SPOTLIGHT CURSOR — feeds --cursor-x / --cursor-y to all cards
───────────────────────────────────────────────────────────── */
document.addEventListener('pointermove', (e: PointerEvent) => {
  document.documentElement.style.setProperty('--cursor-x', String(e.clientX))
  document.documentElement.style.setProperty('--cursor-y', String(e.clientY))

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

/* ─────────────────────────────────────────────────────────────
   NEWS TABS
───────────────────────────────────────────────────────────── */
document.querySelectorAll('.news-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.news-tab').forEach(t => t.classList.remove('active'))
    tab.classList.add('active')
  })
})
