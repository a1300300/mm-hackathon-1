<template>
  <div class="layout">
    <header class="header">
      <NuxtLink to="/" class="brand">🐷🐷🐷</NuxtLink>
      <nav class="nav">
        <NuxtLink to="/">Home</NuxtLink>
        <NuxtLink to="/about">About</NuxtLink>
      </nav>
    </header>
    <main class="main">
      <slot />
    </main>
    <footer class="footer">
      <small>© {{ new Date().getFullYear() }} Nuxt Starter</small>
    </footer>
  </div>
</template>

<style scoped>
.layout { display: flex; min-height: 100vh; flex-direction: column; }
.header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; border-bottom: 1px solid #eee; position: sticky; top: 0; background: white;
}
.brand { font-weight: 700; color: #111; text-decoration: none; }
.nav a { margin-left: 12px; text-decoration: none; color: #333; }
.main { flex: 1; }
.footer { border-top: 1px solid #eee; padding: 12px 16px; color: #666; }
</style>

