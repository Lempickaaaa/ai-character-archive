<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { store, createProject, deleteProject, duplicateProject } from '../store/index.js'

const router = useRouter()
const newName = ref('')

function create() {
  const p = createProject(newName.value)
  newName.value = ''
  router.push({ name: 'characters', params: { id: p.id } })
}

function open(id) {
  router.push({ name: 'characters', params: { id } })
}

function remove(id, name) {
  if (confirm(`'${name}' 프로젝트를 삭제할까요? 되돌릴 수 없어요.`)) deleteProject(id)
}

function fmt(iso) {
  try {
    return new Date(iso).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
  } catch {
    return ''
  }
}
</script>

<template>
  <div class="page">
    <div class="hero card">
      <h1 class="hero-title">나만의 캐릭터 설정을 한 곳에 ✿</h1>
      <p class="hero-desc">
        제타 · 블룸 · 멜팅 · 크랙 · 케이브덕 — 캐릭터와 세계관을 한 번 정리하면
        플랫폼별 입력칸에 맞춰 바로 복붙할 수 있어요.
      </p>
      <div class="create-row">
        <input
          v-model="newName"
          type="text"
          placeholder="프로젝트 이름 (예: 별빛 기숙사 세계관)"
          @keyup.enter="create"
        />
        <button class="btn btn-primary" @click="create">+ 프로젝트 만들기</button>
      </div>
    </div>

    <h2 class="section-title" style="margin-top: 28px">📁 내 프로젝트</h2>
    <p class="section-desc">브라우저에 자동 저장돼요. (캐시를 지우면 사라지니 JSON 내보내기로 백업하세요)</p>

    <div v-if="store.projects.length === 0" class="empty card">
      <div class="big">🌷</div>
      <p>아직 프로젝트가 없어요.<br />위에서 첫 프로젝트를 만들어볼까요?</p>
    </div>

    <div v-else class="grid">
      <div v-for="p in store.projects" :key="p.id" class="proj card" @click="open(p.id)">
        <div class="proj-head">
          <h3 class="proj-name">{{ p.name }}</h3>
          <div class="proj-actions" @click.stop>
            <button class="btn btn-ghost btn-sm" title="복제" @click="duplicateProject(p.id)">⧉</button>
            <button class="btn btn-ghost btn-sm" title="삭제" @click="remove(p.id, p.name)">🗑</button>
          </div>
        </div>
        <div class="proj-meta">
          <span class="chip pink">캐릭터 {{ p.characters.length }}</span>
          <span class="chip">관계 {{ p.relations.length }}</span>
          <span class="chip mint">요소 {{ p.world.elements.length }}</span>
        </div>
        <p class="proj-intro muted tiny">{{ p.intro || '소개글이 아직 없어요.' }}</p>
        <p class="proj-date tiny">수정일 · {{ fmt(p.updatedAt) }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hero { background: linear-gradient(135deg, #fff, var(--surface-soft)); border-color: var(--line-strong); }
.hero-title { font-size: 1.7rem; margin: 0 0 8px; }
.hero-desc { color: var(--ink-soft); margin: 0 0 18px; max-width: 620px; }
.create-row { display: flex; gap: 10px; flex-wrap: wrap; }
.create-row input { flex: 1; min-width: 220px; }

.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
.proj { cursor: pointer; transition: transform .12s, box-shadow .15s, border-color .15s; }
.proj:hover { transform: translateY(-3px); box-shadow: var(--shadow); border-color: var(--pink-soft); }
.proj-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
.proj-name { font-size: 1.12rem; margin: 0 0 8px; word-break: break-all; }
.proj-actions { display: flex; gap: 2px; flex-shrink: 0; }
.proj-meta { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
.proj-intro { display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin: 0 0 10px; min-height: 2.2em; }
.proj-date { color: var(--ink-faint); margin: 0; }
</style>
