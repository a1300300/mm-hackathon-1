// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  typescript: {
    strict: true
  },
  compatibilityDate: '2024-04-03',
  runtimeConfig: {
    openaiApiKey: process.env.OPENAI_API_KEY
  }
})

