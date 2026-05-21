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
    <div class="proj-bar">
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
    <div class="empty card">
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
.proj-title-input:focus { background: #fff; border-color: var(--pink); box-shadow: 0 0 0 4px var(--pink-soft); }

.tabs { display: flex; gap: 6px; flex-wrap: wrap; background: rgba(255,255,255,.6); padding: 6px; border-radius: 999px; border: 1.5px solid var(--line); width: fit-content; }
.tab { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 999px; font-size: .9rem; font-weight: 600; color: var(--ink-soft); transition: background .15s, color .15s; }
.tab:hover { background: var(--surface-soft); color: var(--ink); }
.tab.active { background: linear-gradient(135deg, var(--pink), var(--pink-strong)); color: #fff; box-shadow: var(--shadow-sm); }
</style>
