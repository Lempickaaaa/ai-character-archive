<script setup>
import { ref, computed } from 'vue'
import { PLATFORMS, replaceTemplates, buildExportFields } from '../data/platforms.js'
import { copyText } from '../store/toast.js'
import { ROLES } from '../data/constants.js'
import MappingEditor from './MappingEditor.vue'

const props = defineProps({ project: { type: Object, required: true } })

const activePlatformId = ref(PLATFORMS[0].id)
const activePlatform = computed(() => PLATFORMS.find((p) => p.id === activePlatformId.value))
const showAdvanced = ref(false)

const roleEmoji = (v) => ROLES.find((r) => r.value === v)?.emoji || '🧸'

// 초점(주요) 캐릭터 = 첫 번째 main, 없으면 첫 캐릭터
const focal = computed(
  () => props.project.characters.find((c) => c.role === 'main') || props.project.characters[0] || null,
)

// 플랫폼이 생성한 입력칸 + 사용자가 수정한 값 병합 (전체 캐릭터 일괄)
const fields = computed(() => {
  const pf = activePlatform.value
  if (!pf || props.project.characters.length === 0) return []
  const ctx = {
    project: props.project,
    characters: props.project.characters,
    relations: props.project.relations,
    world: props.project.world,
    focal: focal.value,
  }
  const mapped = props.project.mappings?.[pf.id] || undefined
  const built = buildExportFields(pf, ctx, mapped)
  const ov = props.project.exportOverrides?.[pf.id] || {}
  return built.map((f) => {
    const okey = f.key
    const value = okey in ov ? ov[okey] : f.value
    return { ...f, _okey: okey, value, edited: okey in ov }
  })
})

function render(text) {
  return replaceTemplates(text || '', focal.value, props.project.characters)
}

function onEdit(f, ev) {
  const platformId = activePlatform.value?.id
  if (!platformId) return
  const platformOverrides = props.project.exportOverrides?.[platformId] || {}
  if (!props.project.exportOverrides) props.project.exportOverrides = {}
  props.project.exportOverrides[platformId] = { ...platformOverrides, [f._okey]: ev.target.value }
}

function resetPlatform() {
  if (confirm(`${activePlatform.value.name}의 수정 내용을 모두 기본값으로 되돌릴까요?`)) {
    if (props.project.exportOverrides?.[activePlatform.value.id]) {
      delete props.project.exportOverrides[activePlatform.value.id]
    }
  }
}

function copyAll() {
  const text = fields.value
    .filter((f) => (f.value || '').trim())
    .map((f) => `■ ${f.label}\n${render(f.value)}`)
    .join('\n\n')
  copyText(text)
}

function overCount(f) {
  return f.maxlength && (f.value || '').length > f.maxlength
}

function copyPart(value) {
  copyText(value || '')
}
</script>

<template>
  <div>
    <h2 class="section-title fade-rise" style="--delay: 0ms">🚀 플랫폼별 내보내기</h2>
    <p class="section-desc fade-rise" style="--delay: 40ms">
      프로젝트의 <b>전체 캐릭터·세계관</b>이 플랫폼 입력칸에 맞춰 한 번에 배치돼요. 값은 자유롭게 수정 후 복사하세요.
    </p>
    
    <div class="select-block" style="margin: 12px 0">
      <span class="tiny muted sel-label">플랫폼</span>
      <div class="plat-chips">
        <button
          v-for="p in PLATFORMS"
          :key="p.id"
          class="plat-chip"
          :class="{ on: p.id === activePlatformId }"
          :style="{ '--pc': p.color }"
          @click="activePlatformId = p.id"
        >
          {{ p.emoji }} {{ p.name }}
        </button>
      </div>
    </div>

    <div v-if="project.characters.length === 0" class="empty card">
      <div class="big">🐣</div>
      <p>먼저 '캐릭터' 탭에서 캐릭터를 추가해주세요.</p>
    </div>

    <template v-else>
      <div class="card plat-info fade-rise" style="--delay: 80ms" :style="{ '--pc': activePlatform.color }">
        <div class="spread">
          <div class="grow">
            <strong>{{ activePlatform.emoji }} {{ activePlatform.name }}</strong>
            <p class="tiny muted" style="margin: 4px 0 0">{{ activePlatform.note }}</p>
            <p v-if="focal" class="tiny muted" style="margin: 6px 0 0">
              주요 캐릭터: <b>{{ roleEmoji(focal.role) }} {{ focal.name || '(이름 없음)' }}</b>
              <template v-if="project.characters.length > 1"> · 그 외 {{ project.characters.length - 1 }}명</template>
            </p>
          </div>
          <div class="row" style="gap: 8px">
            <button class="btn btn-sm" @click="showAdvanced = !showAdvanced">
              {{ showAdvanced ? '고급 설정 닫기' : '고급 설정 열기' }}
            </button>
            <button class="btn btn-primary btn-sm" @click="copyAll">전체 복사</button>
          </div>
        </div>


        <div v-if="showAdvanced" class="advanced-wrap">
          <div class="tiny muted advanced-note">
            매핑을 바꾸려면 아래 편집기에서 입력 요소와 입력칸을 다시 연결한 뒤 <b>적용</b>을 누르세요.
          </div>

          <MappingEditor :project="project" :platform="activePlatform" />
        </div>
      </div>

        
      <!-- 입력칸 -->
      <template v-for="f in fields" :key="f._okey">
        <div v-if="f.bundle" class="card field-card lorebook-bundle">
          <div class="field-top">
            <span class="lab-strong">
              {{ f.label }}
            </span>
          </div>
          <div class="bundle-part">
            <div class="bundle-head">
              <span class="tiny muted">제목</span>
              <button class="btn btn-ghost btn-sm" @click="copyPart(f.bundle.title)">복사</button>
            </div>
            <div class="bundle-box">{{ f.bundle.title }}</div>
          </div>
          <div class="bundle-part">
            <div class="bundle-head">
              <span class="tiny muted">키워드 문자열</span>
              <button class="btn btn-ghost btn-sm" @click="copyPart(f.bundle.keywords)">복사</button>
            </div>
            <div class="bundle-box">{{ f.bundle.keywords }}</div>
          </div>
          <div class="bundle-part">
            <div class="bundle-head">
              <span class="tiny muted">키워드 설명</span>
              <button class="btn btn-ghost btn-sm" @click="copyPart(f.bundle.descriptions)">복사</button>
            </div>
            <div class="bundle-box bundle-box-pre">{{ f.bundle.descriptions }}</div>
          </div>
        </div>
        <div v-else class="card field-card">
        <div class="field-top">
          <span class="lab-strong">
            {{ f.label }}
            <span v-if="f.edited" class="chip pink tiny" style="margin-left: 6px">수정됨</span>
          </span>
          <div class="field-top-right">
            <span v-if="f.maxlength" class="counter tiny" :class="{ over: overCount(f) }">
              {{ (f.value || '').length }} / {{ f.maxlength }}
            </span>
            <button class="btn btn-ghost btn-sm" @click="copyText(render(f.value))">복사</button>
          </div>
        </div>
        <p v-if="f.hint" class="tiny muted field-hint">{{ f.hint }}</p>
        <input
          v-if="!f.multiline"
          type="text"
          :value="f.value"
          :maxlength="f.maxlength"
          @input="onEdit(f, $event)"
        />
        <textarea
          v-else
          :value="f.value"
          rows="4"
          @input="onEdit(f, $event)"
        ></textarea>
        </div>
      </template>
    </template>
  </div>
</template>

<style scoped>
.select-block { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
.sel-label { width: 48px; flex-shrink: 0; padding-top: 8px; font-weight: 600; }
.plat-chips { display: flex; gap: 8px; flex-wrap: wrap; }

.plat-chip { border: 1.5px solid var(--line-strong); background: var(--surface-soft); border-radius: 999px; padding: 8px 15px; font-size: .88rem; font-weight: 600; color: var(--ink-soft); cursor: pointer; font-family: var(--font-body); transition: all .14s; }
.plat-chip:hover { transform: translateY(-1px); }
.plat-chip.on { background: var(--pc); color: #fff; border-color: transparent; box-shadow: var(--shadow-sm); }

.plat-info { border-left: 5px solid var(--pc); }
.advanced-wrap { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--line); }
.advanced-note { margin-top: 10px; }

.field-card { padding: 16px; }
.lorebook-bundle { display: flex; flex-direction: column; gap: 12px; }
.field-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.field-top-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.lab-strong { font-weight: 700; font-size: .95rem; }
.field-hint { margin: 4px 0 10px; }
.bundle-part { display: flex; flex-direction: column; gap: 6px; }
.bundle-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.bundle-box { padding: 10px 12px; border: 1px solid var(--line-strong); border-radius: 10px; background: var(--surface-soft); color: var(--ink); white-space: pre-wrap; word-break: break-word; }
.bundle-box-pre { white-space: pre-wrap; }
</style>
