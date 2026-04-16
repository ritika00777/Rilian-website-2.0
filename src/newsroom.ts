import './shared'
import { ARTICLES, type Tab, cardHTML, gridClass, revealCards } from './articles'

/* ─────────────────────────────────────────────────────────────
   NEWSROOM PAGE — full listing
───────────────────────────────────────────────────────────── */
const grid = document.getElementById('newsroom-grid') as HTMLElement

let activeTab: Tab = 'press'

function render() {
  const all = ARTICLES.filter(a => a.tab === activeTab)

  grid.className = `news-grid ${gridClass(activeTab)}`
  grid.innerHTML = all.map(cardHTML).join('')
  revealCards(grid)
}

/* ── Tab switching ──────────────────────────────────────────── */
document.querySelectorAll<HTMLButtonElement>('.news-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.news-tab').forEach(t => t.classList.remove('active'))
    btn.classList.add('active')
    activeTab = (btn.dataset.tab ?? 'press') as Tab
    render()
  })
})

/* ── Initial render ─────────────────────────────────────────── */
render()
