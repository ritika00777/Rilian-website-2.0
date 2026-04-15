import './shared'
import { ARTICLES, type Tab, cardHTML, gridClass, revealCards } from './articles'

/* ─────────────────────────────────────────────────────────────
   NEWSROOM PAGE — full listing with load more
───────────────────────────────────────────────────────────── */
const BATCH = 3

const grid     = document.getElementById('newsroom-grid')    as HTMLElement
const loadMore = document.getElementById('load-more')        as HTMLButtonElement

let activeTab: Tab     = 'press'
let visible:   number  = BATCH

function render() {
  const all = ARTICLES.filter(a => a.tab === activeTab)

  grid.className = `news-grid ${gridClass(activeTab)}`
  grid.innerHTML = all.slice(0, visible).map(cardHTML).join('')
  revealCards(grid)

  // Show / hide Load More
  if (all.length > visible) {
    loadMore.removeAttribute('hidden')
  } else {
    loadMore.setAttribute('hidden', '')
  }
}

/* ── Tab switching ──────────────────────────────────────────── */
document.querySelectorAll<HTMLButtonElement>('.news-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.news-tab').forEach(t => t.classList.remove('active'))
    btn.classList.add('active')
    activeTab = (btn.dataset.tab ?? 'press') as Tab
    visible   = BATCH
    render()
  })
})

/* ── Load More ──────────────────────────────────────────────── */
loadMore.addEventListener('click', () => {
  visible += BATCH
  render()
})

/* ── Initial render ─────────────────────────────────────────── */
render()
