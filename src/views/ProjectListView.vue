<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { store, createProject, deleteProject, duplicateProject, importProjectJSON } from '../store/index.js'
import { toast } from '../store/toast.js'

const router = useRouter()
const newName = ref('')
const importError = ref('')
const FEEDBACK_WEBHOOK_URL = import.meta.env.VITE_FEEDBACK_WEBHOOK_URL || ''

const feedbackMessage = ref('')
const feedbackError = ref('')
const feedbackNotice = ref('')
const feedbackSending = ref(false)

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

function onFileSelected(ev) {
  const file = ev.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    importError.value = ''
    try {
      const jsonText = String(reader.result || '')
      const proj = importProjectJSON(jsonText)
      toast(`'${proj.name}' 프로젝트를 불러왔어요 ✨`)
      router.push({ name: 'characters', params: { id: proj.id } })
    } catch (e) {
      importError.value = e.message || '불러오기에 실패했어요.'
    }
  }
  reader.readAsText(file)
  ev.target.value = ''
}

async function submitFeedback() {
  feedbackError.value = ''
  feedbackNotice.value = ''

  const message = feedbackMessage.value.trim()
  if (!message) {
    feedbackError.value = '내용을 입력해 주세요.'
    return
  }

  const payload = {
    time: new Date().toISOString(),
    message,
  }

  feedbackSending.value = true

  try {
    if (FEEDBACK_WEBHOOK_URL) {
      const response = await fetch(FEEDBACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error('전송 실패')
      feedbackNotice.value = '개발자에게 전송했어요.'
      feedbackMessage.value = ''
      return
    }
    feedbackError.value = 'VITE_FEEDBACK_WEBHOOK_URL 이 설정되지 않았어요.'
  } catch {
    feedbackError.value = '전송에 실패했어요. webhook URL과 외부 서비스 설정을 확인해 주세요.'
  } finally {
    feedbackSending.value = false
  }
}
</script>

<template>
  <div class="page">
    <div class="hero card fade-rise" style="--delay: 0ms">
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
      <div v-if="importError" class="import-error">⚠ {{ importError }}</div>
    </div>

    <h2 class="section-title fade-rise" style="margin-top: 28px; --delay: 90ms">📁 내 프로젝트</h2>
    <p class="section-desc fade-rise" style="--delay: 140ms">브라우저에 자동 저장돼요. (캐시를 지우면 사라지니 JSON 내보내기로 백업하세요)</p>

    <div v-if="store.projects.length === 0" class="empty card fade-rise" style="--delay: 200ms">
      <div class="big">🌷</div>
      <p>아직 프로젝트가 없어요.<br />위에서 첫 프로젝트를 만들어볼까요?</p>
    </div>

    <div v-else class="grid">
      <div
        v-for="(p, index) in store.projects"
        :key="p.id"
        class="proj card fade-rise"
        :style="{ '--delay': `${200 + index * 70}ms` }"
        @click="open(p.id)"
      >
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
    <!-- 피드백 섹션 -->
    <div class="feedback-wrap fade-rise" style="--delay: 320ms">
      <h2 class="section-title">💬 개발자 전용 피드백</h2>
      <p class="section-desc">댓글처럼 공개되지 않고, 개발자에게만 전달돼요. 시간과 내용만 저장됩니다.</p>

      <div class="feedback-card card">
        <label class="field">
          <span class="lab">메시지</span>
          <textarea v-model="feedbackMessage" rows="4" placeholder="불편했던 점, 좋은 점, 원하는 기능을 편하게 적어주세요."></textarea>
        </label>

        <p v-if="feedbackError" class="import-error">⚠ {{ feedbackError }}</p>
        <p v-if="feedbackNotice" class="feedback-note">{{ feedbackNotice }}</p>

        <div class="row" style="justify-content: flex-end; gap: 8px; margin-top: 12px">
          <button class="btn btn-ghost btn-sm" @click="feedbackMessage = ''">지우기</button>
          <button class="btn btn-primary btn-sm" :disabled="feedbackSending" @click="submitFeedback">
            {{ feedbackSending ? '전송 중...' : '개발자에게 보내기' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.hero {
  background:
    radial-gradient(700px 220px at 10% 0%, rgba(216, 131, 66, 0.22), transparent 60%),
    linear-gradient(135deg, rgba(255, 226, 196, 0.08), rgba(160, 143, 132, 0.14)),
    var(--surface-soft);
  border: 1px solid rgba(255, 210, 166, 0.18);
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.34), 0 0 0 1px rgba(255, 210, 166, 0.08);
}
.hero-title { font-size: 1.7rem; margin: 0 0 8px; }
.hero-desc { color: var(--ink-soft); margin: 0 0 18px; max-width: 620px; line-height: 1.7; }
.create-row { display: flex; gap: 10px; flex-wrap: wrap; }
.create-row input { flex: 1; min-width: 220px; }
.import-error { color: var(--danger); font-size: .85rem; font-weight: 600; margin: 12px 0 0; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
.proj { cursor: pointer; transition: transform .12s, box-shadow .15s, border-color .15s; }
.proj:hover { transform: translateY(-3px); box-shadow: var(--shadow-pop); border-color: rgba(216, 131, 66, 0.42); }
.proj-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
.proj-name { font-size: 1.12rem; margin: 0 0 8px; word-break: break-all; }
.proj-actions { display: flex; gap: 2px; flex-shrink: 0; }
.proj-meta { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
.proj-intro { display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin: 0 0 10px; min-height: 2.2em; }
.proj-date { color: var(--ink-faint); margin: 0; }
.feedback-card { margin-top: 20px; }
.feedback-wrap { margin-top: 40px; }
.feedback-note { margin: 8px 0 0; color: var(--green-strong); font-size: .85rem; }
</style>
