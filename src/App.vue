<script setup>
import { RouterView, RouterLink } from 'vue-router'
import { toastState } from './store/toast.js'
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <RouterLink to="/" class="brand">
        <span class="logo">💫</span>
        <span class="brand-text">캐릭터 아카이브</span>
      </RouterLink>
      <span class="brand-sub">AI 캐릭터챗 설정 관리 · 플랫폼별 내보내기</span>
    </header>

    <RouterView v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </RouterView>

    <transition name="fade">
      <div v-if="toastState.visible" class="toast">{{ toastState.msg }}</div>
    </transition>
  </div>
</template>

<style scoped>
.topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 22px;
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(10px);
  border-bottom: 1.5px solid var(--line);
}
.brand { display: inline-flex; align-items: center; gap: 9px; }
.logo { font-size: 1.5rem; filter: drop-shadow(0 2px 4px rgba(255,140,180,.35)); }
.brand-text { font-family: var(--font-head); font-size: 1.25rem; color: var(--ink); }
.brand-sub { color: var(--ink-faint); font-size: .82rem; }
@media (max-width: 560px) { .brand-sub { display: none; } }
</style>
