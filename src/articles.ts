/* ─────────────────────────────────────────────────────────────
   ARTICLES — shared data for homepage + newsroom page
───────────────────────────────────────────────────────────── */

export type Tab = 'press' | 'news' | 'blogs' | 'events'

export interface Article {
  id: string
  tab: Tab
  category: string
  title: string
  source: string
  date: string
  href: string
  external: boolean
  image?: string   // path to local image asset
  excerpt?: string // short description shown on cards
}

export const TAB_LABELS: Record<Tab, string> = {
  press:  'Press Releases',
  news:   'In The News',
  blogs:  'Blogs',
  events: 'Event Spotlight',
}

export const ARTICLES: Article[] = [
  // ── Press Releases ────────────────────────────────────────
  {
    id: 'simspace',
    tab: 'press',
    category: 'Press Release',
    title: 'SimSpace and Rilian Technologies Partner to Strengthen Agentic Cyber Defense for Critical Infrastructure Organizations in the US and GCC',
    source: 'PR Newswire',
    date: 'January 20, 2026',
    href: 'https://www.prnewswire.com/news-releases/simspace-and-rilian-technologies-partner-to-strengthen-agentic-cyber-defense-for-critical-infrastructure-organizations-in-the-us-and-gcc-302664853.html',
    external: true,
    image: '/src/assets/newsroom/simspace.jpg',
    excerpt: 'SimSpace and Rilian unite to deliver agentic cyber defense for critical infrastructure organizations across the US and GCC.',
  },
  {
    id: 'sentinelone',
    tab: 'press',
    category: 'Press Release',
    title: 'SentinelOne and Rilian Technologies Partner to Enhance AI-Driven Cybersecurity in the Middle East',
    source: 'Gulf News',
    date: 'December 11, 2025',
    href: 'https://gulfnews.com/gn-focus/sentinelone-and-rilian-technologies-partners-to-enhance-ai-driven-cybersecurity-in-the-middle-east-1.500376632',
    external: true,
    image: '/src/assets/newsroom/sentinelone.png',
    excerpt: 'SentinelOne and Rilian Technologies deepen AI-driven cybersecurity capabilities across the Middle East.',
  },
  {
    id: 'censys',
    tab: 'press',
    category: 'Press Release',
    title: 'Censys and Rilian Technologies Partner to Strengthen Cyber Defense and Critical Infrastructure Security Across the Middle East',
    source: 'PR Newswire',
    date: 'December 4, 2025',
    href: 'https://www.prnewswire.com/news-releases/censys-and-rilian-technologies-partner-to-strengthen-cyber-defense-and-critical-infrastructure-security-across-the-middle-east-302631272.html',
    external: true,
    image: '/src/assets/newsroom/censys.jpg',
    excerpt: 'Censys and Rilian combine attack surface intelligence with sovereign deployment to protect critical infrastructure.',
  },
  {
    id: 'uae-cyber-council',
    tab: 'press',
    category: 'Press Release',
    title: 'UAE Cyber Security Council to Collaborate With Rilian Technologies and CPX Holding to Secure Critical Infrastructure',
    source: 'Business Wire',
    date: 'July 30, 2025',
    href: 'https://www.businesswire.com/news/home/20250730228444/en/UAE-Cyber-Security-Council-to-Collaborate-With-Rilian-Technologies-and-CPX-Holding-to-Secure-Critical-Infrastructure-In-Collaboration-With-Leading-Partners-From-the-UAE-and-the-World',
    external: true,
    excerpt: 'The UAE Cyber Security Council, Rilian Technologies, and CPX Holding align to protect national critical infrastructure.',
  },

  // ── In The News ───────────────────────────────────────────
  {
    id: 'homeland-security',
    tab: 'news',
    category: 'In The News',
    title: "Making America's Cyber Strategy Work in a New Era of Digital Conflict",
    source: 'Homeland Security Today',
    date: 'March 11, 2026',
    href: 'https://www.hstoday.us/subject-matter-areas/cybersecurity/making-president-trumps-cyber-strategy-real/',
    external: true,
    image: '/src/assets/newsroom/homeland-security.jpg',
    excerpt: "CEO Christian Schnedler on turning the administration's cyber strategy into operational reality in an era of digital conflict.",
  },
  {
    id: 'cipher-brief',
    tab: 'news',
    category: 'In The News',
    title: "Winning the Innovation Race: Why America's Allies Are the Key to Beating Beijing",
    source: 'The Cipher Brief',
    date: 'October 27, 2025',
    href: 'https://www.thecipherbrief.com/us-china-tech-race',
    external: true,
    image: '/src/assets/newsroom/cipher-brief.avif',
    excerpt: 'Christian Schnedler and former CIA officer Duyane Norman on why America\'s alliances are the decisive factor in beating Beijing.',
  },
  {
    id: 'wsj-qatar',
    tab: 'news',
    category: 'In The News',
    title: 'Why Global Companies Are Setting Up in Qatar',
    source: 'WSJ — Invest Qatar',
    date: 'May 15, 2025',
    href: 'https://partners.wsj.com/invest-qatar/eye-on-qatar/why-global-companies-are-setting-up-here/',
    external: true,
    image: '/src/assets/newsroom/wsj-qatar.avif',
    excerpt: "What's driving global companies to establish operations in Qatar — and why cybersecurity infrastructure is central to the story.",
  },

  // ── Blogs ─────────────────────────────────────────────────
  {
    id: 'sovereign-endpoint',
    tab: 'blogs',
    category: 'Case Study',
    title: "Sovereign Endpoint Deployment in One Week: Inside Rilian's Role in a National Security Mission",
    source: 'Rilian',
    date: '2025',
    href: '/articles/sovereign-endpoint.html',
    external: false,
    image: '/src/assets/newsroom/sovereign-endpoint.png',
    excerpt: 'How Rilian deployed mobile threat defense in an air-gapped sovereign environment in under seven days.',
  },
  {
    id: 'uae-us-nexus',
    tab: 'blogs',
    category: 'Opinion',
    title: 'The UAE-US Tech Nexus: Opportunities for Global Cyber Leaders in the GCC',
    source: 'Rilian',
    date: 'May 2025',
    href: '/articles/uae-us-tech-nexus.html',
    external: false,
    image: '/src/assets/newsroom/uae-us-nexus.avif',
    excerpt: "The Gulf isn't buying innovation anymore — it's building it. What the Trump administration's Gulf visit confirmed for cyber operators.",
  },
  {
    id: 'breach-silence',
    tab: 'blogs',
    category: 'Article',
    title: 'The Hidden Cost of Breach Silence and How to Avoid Paying for It',
    source: 'Rilian',
    date: '2025',
    href: '/articles/hidden-cost-breach.html',
    external: false,
    image: '/src/assets/newsroom/breach-silence.jpg',
    excerpt: "Silence doesn't contain breaches — it amplifies them. A hard look at what delayed disclosure actually costs organizations.",
  },

  // ── Event Spotlight ───────────────────────────────────────
  {
    id: 'gisec-2025',
    tab: 'events',
    category: 'Event Spotlight',
    title: 'Live from GISEC 2025: The New Rules of Sovereign Cyber Readiness',
    source: 'Rilian',
    date: 'May 2025',
    href: '/articles/gisec-2025.html',
    external: false,
    image: '/src/assets/newsroom/gisec-2025.png',
    excerpt: 'Three takeaways from the floor of GISEC 2025: AI as infrastructure, OT as the primary battleground, deployment as the differentiator.',
  },
  {
    id: 'oodacon',
    tab: 'events',
    category: 'Event Coverage',
    title: "Rilian Technologies at OODAcon: Conversation with Rilian's CEO Christian Schnedler",
    source: 'Rilian',
    date: '2025',
    href: '/articles/oodacon.html',
    external: false,
    image: '/src/assets/newsroom/oodacon.webp',
    excerpt: "Rilian's U.S. debut at OODAcon: how the company is building sovereign-grade security where conventional vendors can't reach.",
  },
]

/* ── Card renderer ─────────────────────────────────────────── */
export function cardHTML(article: Article): string {
  const target = article.external ? ' target="_blank" rel="noopener noreferrer"' : ' target="_blank"'

  const imgBlock = article.image
    ? `<div class="news-card-img"><img src="${article.image}" alt="${article.title}" loading="lazy"></div>`
    : `<div class="news-card-img news-card-img--placeholder"><span class="news-card-placeholder-source">${article.source}</span></div>`

  const excerpt = article.excerpt
    ? `<p class="news-excerpt">${article.excerpt}</p>`
    : ''

  return `<a class="news-card" href="${article.href}"${target}>
  ${imgBlock}
  <div class="news-card-content">
    <span class="news-cat">${article.category}</span>
    <h4>${article.title}</h4>
    ${excerpt}
    <span class="news-read-more">Read More ↗</span>
  </div>
</a>`
}

/* ── Staggered reveal after inserting cards into DOM ───────── */
export function revealCards(grid: HTMLElement): void {
  const cards = grid.querySelectorAll<HTMLElement>('.news-card')
  requestAnimationFrame(() => {
    cards.forEach((card, i) => {
      setTimeout(() => card.classList.add('visible'), i * 45)
    })
  })
}
