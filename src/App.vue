<script setup>
import { RouterView, RouterLink } from 'vue-router'
import { toastState } from './store/toast.js'
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <RouterLink to="/" class="brand">
        <span class="logo">💫</span>
        <span class="brand-text">ai-character-generator</span>
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
  background: linear-gradient(180deg, rgba(22, 17, 19, 0.96), rgba(12, 10, 11, 0.9));
  backdrop-filter: blur(14px);
  border-bottom: 1.5px solid rgba(240, 201, 154, 0.14);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
}
.brand { display: inline-flex; align-items: center; gap: 9px; }
.logo { font-size: 1.5rem; filter: drop-shadow(0 2px 6px rgba(201, 138, 87, 0.32)); }
.brand-text { font-family: var(--font-head); font-size: 1.25rem; color: var(--ink); letter-spacing: .01em; }
.brand-sub { color: var(--ink-soft); font-size: .82rem; }
@media (max-width: 560px) { .brand-sub { display: none; } }
</style>
