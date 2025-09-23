<template>
  <section class="hero">
    <h1>{{ title }}</h1>
    <p class="subtitle">{{ subtitle }}</p>
  </section>
</template>

<script setup lang="ts">
defineProps<{ title: string; subtitle?: string }>()
</script>

<style scoped>
.hero { padding: 40px 0 8px; }
h1 { font-size: 40px; margin: 0; line-height: 1.2; }
.subtitle { margin-top: 8px; color: #666; }
</style>

