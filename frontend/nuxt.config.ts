// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  
  // CSS
  css: ['assets/css/main.css'],
  
  // App configuration
  app: {
    head: {
      title: 'Todo App',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'A modern Todo application built with Nuxt 4' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    },
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'layout', mode: 'out-in' }
  },

  // Runtime config for environment variables
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || '',
    }
  },

  // TypeScript
  typescript: {
    strict: true,
    typeCheck: process.env.NODE_ENV === 'production' // Only type check in production builds
  }
})
