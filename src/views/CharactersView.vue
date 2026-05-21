<script setup>
import { computed } from 'vue'
import { addCharacter, removeCharacter, addRelation, removeRelation } from '../store/index.js'
import { ROLES, NON_MAIN_LIMIT, RELATION_TYPES, EMOTION_TYPES, relationDegreeLabel, BASIC_INFO_FIELDS } from '../data/constants.js'

const props = defineProps({ project: { type: Object, required: true } })

const roleMeta = (v) => ROLES.find((r) => r.value === v) || ROLES[0]

const nameOf = (id) => props.project.characters.find((c) => c.id === id)?.name || '(이름 없음)'
const hasChars = computed(() => props.project.characters.length >= 1)

function summaryLen(c) {
  return (c.summary || '').length
}
</script>

<template>
  <div>
    <!-- 1-1 캐릭터 설정 -->
    <div class="spread">
      <div>
        <h2 class="section-title">🧸 캐릭터 설정</h2>
        <p class="section-desc">역할을 고르고 기본정보·성격·외모 등을 채워보세요. 주변/유저 캐릭터는 설정 {{ NON_MAIN_LIMIT }}자 제한이에요.</p>
      </div>
    </div>

    <div class="add-row">
      <button v-for="r in ROLES" :key="r.value" class="btn" @click="addCharacter(project.id, r.value)">
        {{ r.emoji }} {{ r.label }} 추가
      </button>
    </div>

    <div v-if="project.characters.length === 0" class="empty card">
      <div class="big">🐣</div>
      <p>아직 캐릭터가 없어요. 위 버튼으로 추가해보세요!</p>
    </div>

    <div
      v-for="c in project.characters"
      :key="c.id"
      class="card char-card"
      :style="{ '--accent': c.role === 'main' ? 'var(--pink)' : c.role === 'user' ? 'var(--lav)' : 'var(--mint)' }"
    >
      <div class="char-head">
        <div class="char-head-left">
          <select v-model="c.role" class="role-select">
            <option v-for="r in ROLES" :key="r.value" :value="r.value">{{ r.emoji }} {{ r.label }}</option>
          </select>
          <input v-model="c.name" type="text" class="name-input" placeholder="캐릭터 이름" />
        </div>
        <button class="btn btn-danger btn-sm" @click="removeCharacter(project.id, c.id)">삭제</button>
      </div>
      <p class="role-hint tiny muted">{{ roleMeta(c.role).desc }}</p>

      <!-- 기본정보 (모든 역할 공통) -->
      <div class="block-label">📇 기본정보</div>
      <div class="basic-grid">
        <label v-for="f in BASIC_INFO_FIELDS" :key="f.key" class="basic-item">
          <span class="basic-lab">{{ f.label }}</span>
          <input v-model="c.basic[f.key]" type="text" :placeholder="f.placeholder" />
        </label>
      </div>

      <!-- 주요 캐릭터: 상세 필드 -->
      <template v-if="c.role === 'main'">
        <div class="block-label">📝 상세 설정</div>
        <div class="fields-grid">
          <label class="field">
            <span class="lab">성격</span>
            <textarea v-model="c.personality" placeholder="밝고 장난기 많지만 속은 여림…"></textarea>
          </label>
          <label class="field">
            <span class="lab">외모</span>
            <textarea v-model="c.appearance" placeholder="은발 단발, 보라색 눈동자…"></textarea>
          </label>
          <label class="field">
            <span class="lab">과거</span>
            <textarea v-model="c.past" placeholder="어린 시절의 사건, 트라우마…"></textarea>
          </label>
          <label class="field">
            <span class="lab">특징</span>
            <textarea v-model="c.traits" placeholder="좋아하는 것/싫어하는 것, 버릇…"></textarea>
          </label>
          <label class="field">
            <span class="lab">말버릇</span>
            <textarea v-model="c.speech" placeholder="'~다냥', 존댓말, 특정 말투…"></textarea>
          </label>
          <label class="field">
            <span class="lab">이벤트 트리거</span>
            <textarea v-model="c.eventTrigger" placeholder="비가 오면 우울해진다 / 특정 단어에 반응…"></textarea>
          </label>
        </div>
      </template>

      <!-- 주변/유저 캐릭터: 500자 제한 요약 -->
      <template v-else>
        <div class="block-label">📝 설정</div>
        <label class="field">
          <span class="lab">
            성격·외모·특징·말버릇 등
            <span class="counter" :class="{ over: summaryLen(c) > NON_MAIN_LIMIT }">{{ summaryLen(c) }} / {{ NON_MAIN_LIMIT }}</span>
          </span>
          <textarea
            v-model="c.summary"
            :maxlength="NON_MAIN_LIMIT"
            rows="4"
            placeholder="간단히 핵심만 적어주세요 (500자 제한)"
          ></textarea>
        </label>
      </template>

      <!-- 첫 만남 / 예시 대화 (모든 역할 공통) -->
      <div class="block-label">💬 첫 만남 · 예시 대화</div>
      <div class="fields-grid">
        <label class="field">
          <span class="lab">첫 만남 (도입부 / 첫 상황)</span>
          <textarea v-model="c.firstMeeting" placeholder="대화가 시작되는 첫 장면을 적어주세요."></textarea>
        </label>
        <label class="field">
          <span class="lab">예시 대화</span>
          <textarea v-model="c.exampleDialogue" placeholder="유저: 안녕?&#10;캐릭터: ...누구야, 너."></textarea>
        </label>
      </div>
    </div>

    <hr class="divider" style="margin: 28px 0" />

    <!-- 1-1-2 관계성 -->
    <div class="spread">
      <div>
        <h2 class="section-title">💞 캐릭터 관계성</h2>
        <p class="section-desc">캐릭터 → [관계 유형 · 정도 · 감정] → 캐릭터 형식으로 저장돼요. (내보내기 시 캐릭터 정보에 포함)</p>
      </div>
      <button class="btn btn-lav btn-sm" :disabled="!hasChars" @click="addRelation(project.id)">+ 관계 추가</button>
    </div>

    <div v-if="!hasChars" class="empty card">
      <p class="muted">먼저 캐릭터를 추가하면 관계를 연결할 수 있어요.</p>
    </div>

    <div v-else-if="project.relations.length === 0" class="empty card">
      <div class="big">🔗</div>
      <p>아직 관계가 없어요. '관계 추가'를 눌러보세요!</p>
    </div>

    <div v-for="r in project.relations" :key="r.id" class="card rel-card">
      <div class="rel-line">
        <select v-model="r.fromId" class="rel-char">
          <option v-for="c in project.characters" :key="c.id" :value="c.id">{{ c.name || '(이름 없음)' }}</option>
        </select>
        <span class="rel-arrow">→</span>
        <select v-model="r.type" class="rel-type">
          <option v-for="t in RELATION_TYPES" :key="t" :value="t">{{ t }}</option>
        </select>
        <span class="rel-arrow">→</span>
        <select v-model="r.toId" class="rel-char">
          <option v-for="c in project.characters" :key="c.id" :value="c.id">{{ c.name || '(이름 없음)' }}</option>
        </select>
        <button class="btn btn-danger btn-sm" @click="removeRelation(project.id, r.id)">✕</button>
      </div>

      <div class="rel-slider">
        <span class="tiny muted" style="width: 64px">관계 정도</span>
        <input type="range" min="0" max="100" step="1" v-model.number="r.degree" />
        <span class="chip" style="width: 88px; justify-content: center">{{ relationDegreeLabel(r.degree) }} · {{ r.degree }}</span>
      </div>

      <div class="rel-emotion">
        <span class="tiny muted" style="width: 64px">감정</span>
        <select v-model="r.emotion" class="emo-select">
          <option value="">(감정 없음)</option>
          <option v-for="e in EMOTION_TYPES" :key="e" :value="e">{{ e }}</option>
        </select>
        <input type="range" min="0" max="100" step="1" v-model.number="r.emotionDegree" :disabled="!r.emotion" />
        <span class="chip pink" style="width: 88px; justify-content: center">{{ r.emotion ? relationDegreeLabel(r.emotionDegree) + ' · ' + r.emotionDegree : '—' }}</span>
      </div>

      <p class="rel-preview tiny muted">
        {{ nameOf(r.fromId) }} —[{{ r.type }}, {{ relationDegreeLabel(r.degree) }}<template v-if="r.emotion"> / 감정: {{ r.emotion }}({{ relationDegreeLabel(r.emotionDegree) }})</template>]→ {{ nameOf(r.toId) }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.add-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
.char-card { border-left: 5px solid var(--accent); }
.char-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.char-head-left { display: flex; gap: 10px; align-items: center; flex: 1; flex-wrap: wrap; }
.role-select { width: auto; min-width: 130px; font-weight: 600; }
.name-input { flex: 1; min-width: 140px; font-family: var(--font-head); font-size: 1.05rem; }
.role-hint { margin: 8px 0 16px; }

.block-label { font-family: var(--font-head); font-size: .92rem; color: var(--pink-strong); margin: 18px 0 10px; padding-bottom: 6px; border-bottom: 1.5px dashed var(--line-strong); }

.basic-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
@media (max-width: 720px) { .basic-grid { grid-template-columns: repeat(2, 1fr); } }
.basic-item { display: flex; flex-direction: column; gap: 4px; }
.basic-lab { font-size: .78rem; color: var(--ink-soft); font-weight: 500; padding-left: 2px; }
.basic-item input { padding: 8px 11px; font-size: .9rem; }

.fields-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0 16px; }
@media (max-width: 620px) { .fields-grid { grid-template-columns: 1fr; } }

.rel-card { padding: 16px; }
.rel-line { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.rel-char { flex: 1; min-width: 110px; }
.rel-type { width: auto; min-width: 110px; }
.rel-arrow { color: var(--ink-faint); font-weight: 700; }
.rel-slider, .rel-emotion { display: flex; align-items: center; gap: 12px; margin-top: 14px; }
.emo-select { width: auto; min-width: 120px; flex-shrink: 0; }
.rel-preview { margin: 12px 0 0; padding-top: 10px; border-top: 1px dashed var(--line); }
</style>
