// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  typescript: {
    strict: true
  },
  compatibilityDate: '2024-04-03',
  runtimeConfig: {
    openaiApiKey: process.env.OPENAI_API_KEY
  },
  vite: {
    server: {
      allowedHosts: ['lightly-flexible-honeybee.ngrok-free.app'],
      // If you also use a custom host or port, keep them here, e.g.:
      // host: '0.0.0.0',
      // port: 3000,
    },
  },
})

