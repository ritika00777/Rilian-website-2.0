import './style.css'

/* ─────────────────────────────────────────────────────────────
   SHARED — nav + footer injection for secondary pages
   (newsroom.html, article pages)
───────────────────────────────────────────────────────────── */

const NAV_HTML = `
<nav id="nav">
  <div class="nav-inner">
    <a href="/" class="nav-logo"><img src="/rilian-logo.svg" alt="Rilian" height="18"></a>
    <div class="nav-links">
      <div class="nav-dropdown">
        <button class="nav-link">Products <span class="chevron">›</span></button>
        <div class="dropdown-panel">
          <a href="/#caspian" class="dropdown-link">Caspian</a>
          <a href="/#dawntreader" class="dropdown-link">DawnTreader</a>
          <a href="/#armory" class="dropdown-link">Armory</a>
        </div>
      </div>
      <a href="/newsroom.html" class="nav-link">Newsroom</a>
      <a href="/#about" class="nav-link">About Us</a>
    </div>
    <div class="nav-actions">
      <a href="/request-briefing.html" class="btn-primary btn-sm">Request a Briefing</a>
    </div>
  </div>
</nav>`

const FOOTER_HTML = `
<footer id="footer">
  <div class="footer-watermark" aria-hidden="true">
    <img src="/rilian-logo.svg" alt="">
  </div>
  <div class="footer-bottom">
    <div class="footer-copyright-band">
      <span class="footer-copyright">© 2026 Rilian. All rights reserved.</span>
    </div>
    <div class="footer-nav-bar">
      <div class="footer-nav-group">
        <p class="footer-nav-label">Navigation</p>
        <div class="footer-nav-links">
          <a href="/#caspian">Caspian</a>
          <a href="/#dawntreader">Dawntreader</a>
          <a href="/#armory">Armory</a>
          <a href="/#about">About Us</a>
          <a href="/newsroom.html">Newsroom</a>
        </div>
      </div>
      <div class="footer-right">
        <div class="footer-social">
          <a href="https://x.com/RilianTech" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.735-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
          <a href="https://www.linkedin.com/company/riliantech" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          </a>
        </div>
        <div class="footer-legal-links">
          <a href="/privacy-security.html">Privacy &amp; Security</a>
          <a href="/terms-and-conditions.html">Terms &amp; Conditions</a>
          <a href="/service-level-agreement.html">SLA</a>
        </div>
      </div>
    </div>
  </div>
</footer>`

/* ── Inject nav + footer ────────────────────────────────────── */
const navSlot    = document.getElementById('nav-placeholder')
const footerSlot = document.getElementById('footer-placeholder')
if (navSlot)    navSlot.outerHTML    = NAV_HTML
if (footerSlot) footerSlot.outerHTML = FOOTER_HTML

/* ── Nav scroll behaviour ───────────────────────────────────── */
const navEl = document.getElementById('nav')
window.addEventListener('scroll', () => {
  navEl?.classList.toggle('scrolled', window.scrollY > 60)
}, { passive: true })

/* ── Button character stagger (matches main.ts) ─────────────── */
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
