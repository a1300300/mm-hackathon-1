<template>
  <section class="container">
    <Hero title="Welcome to Nuxt 3" subtitle="Let's build something great." />
    <div class="content">
      <p>This is your new Nuxt 3 app. Edit <code>pages/index.vue</code> to get started.</p>
      <p>
        Learn more in the
        <a href="https://nuxt.com/docs" target="_blank" rel="noreferrer">Nuxt docs</a>.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
useHead({ title: 'MM Hackathon 1' })
</script>

<style scoped>
.container {
  max-width: 960px;
  margin: 40px auto;
  padding: 0 16px;
}
.content {
  margin-top: 24px;
  color: #333;
}
.links {
  margin-top: 32px;
}
a { color: #00DC82; text-decoration: none; }
code { background: #f3f3f3; padding: 2px 6px; border-radius: 4px; }
</style>

