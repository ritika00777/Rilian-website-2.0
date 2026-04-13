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
      },
    },
  },
})
