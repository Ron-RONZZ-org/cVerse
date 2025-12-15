export default defineNuxtConfig({
  devtools: { enabled: true },
  compatibilityDate: '2025-12-15',
  ssr: false,
  
  app: {
    head: {
      title: 'cVerse - CV Generator',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Generate professional CVs in PDF format' }
      ]
    }
  }
})
