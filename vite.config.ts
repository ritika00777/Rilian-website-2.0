import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main:                   resolve(__dirname, 'index.html'),
        newsroom:               resolve(__dirname, 'newsroom.html'),
        privacySecurity:        resolve(__dirname, 'privacy-security.html'),
        termsAndConditions:     resolve(__dirname, 'terms-and-conditions.html'),
        serviceLevel:           resolve(__dirname, 'service-level-agreement.html'),
        termsOfUse:             resolve(__dirname, 'terms-of-use.html'),
        requestBriefing:        resolve(__dirname, 'request-briefing.html'),
        articleSovereignEndpoint: resolve(__dirname, 'articles/sovereign-endpoint.html'),
        articleUaeTechNexus:    resolve(__dirname, 'articles/uae-us-tech-nexus.html'),
        articleHiddenCost:      resolve(__dirname, 'articles/hidden-cost-breach.html'),
        articleGisec:           resolve(__dirname, 'articles/gisec-2025.html'),
        articleOodacon:         resolve(__dirname, 'articles/oodacon.html'),
      },
    },
  },
})
