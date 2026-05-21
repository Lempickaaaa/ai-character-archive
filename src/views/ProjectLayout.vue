<script setup>
import { computed } from 'vue'
import { useRoute, RouterView, RouterLink } from 'vue-router'
import { getProject } from '../store/index.js'

const route = useRoute()
const project = computed(() => getProject(route.params.id))

const tabs = [
  { name: 'characters', label: '캐릭터', emoji: '🧸' },
  { name: 'world', label: '세계관', emoji: '🗺️' },
  { name: 'intro', label: '소개글', emoji: '📝' },
  { name: 'export', label: '플랫폼 내보내기', emoji: '🚀' },
  { name: 'json', label: 'JSON', emoji: '💾' },
]
</script>

<template>
  <div v-if="project" class="page">
    <div class="proj-bar fade-rise" style="--delay: 0ms">
      <div class="proj-bar-top">
        <RouterLink to="/" class="back">← 목록</RouterLink>
        <input v-model="project.name" class="proj-title-input" placeholder="프로젝트 이름" />
      </div>
      <nav class="tabs">
        <RouterLink
          v-for="t in tabs"
          :key="t.name"
          :to="{ name: t.name, params: { id: project.id } }"
          class="tab"
          active-class="active"
        >
          <span>{{ t.emoji }}</span> {{ t.label }}
        </RouterLink>
      </nav>
    </div>

    <RouterView v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" :project="project" />
      </transition>
    </RouterView>
  </div>

  <div v-else class="page">
    <div class="empty card fade-rise" style="--delay: 60ms">
      <div class="big">🔍</div>
      <p>프로젝트를 찾을 수 없어요.</p>
      <RouterLink to="/" class="btn btn-primary" style="margin-top: 12px">목록으로 가기</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.proj-bar { margin-bottom: 22px; }
.proj-bar-top { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
.back { font-size: .9rem; color: var(--ink-soft); flex-shrink: 0; font-weight: 600; }
.proj-title-input { font-family: var(--font-head); font-size: 1.4rem; color: var(--ink); background: transparent; border: 1.5px solid transparent; padding: 4px 10px; border-radius: var(--radius-sm); }
.proj-title-input:hover { background: var(--surface-soft); }
.proj-title-input:focus { background: var(--surface); border-color: var(--green); box-shadow: 0 0 0 4px rgba(201, 138, 87, 0.16); }

.tabs { display: flex; gap: 6px; flex-wrap: wrap; background: rgba(255,244,233,.03); padding: 6px; border-radius: 999px; border: 1.5px solid rgba(240, 201, 154, 0.12); width: fit-content; box-shadow: inset 0 1px 0 rgba(255,255,255,.04); }
.tab { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 999px; font-size: .9rem; font-weight: 600; color: var(--ink-soft); transition: background .15s, color .15s, transform .15s; }
.tab:hover { background: var(--surface-soft); color: var(--ink); transform: translateY(-1px); }
.tab.active { background: linear-gradient(135deg, var(--green), var(--pink-strong)); color: #120c09; box-shadow: var(--shadow-sm); }
</style>
