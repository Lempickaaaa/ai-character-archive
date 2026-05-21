<script setup>
import { ref, computed, watch } from 'vue'
import { PLATFORMS, replaceTemplates } from '../data/platforms.js'
import { setExportOverride, clearExportOverrides } from '../store/index.js'
import { copyText, toast } from '../store/toast.js'
import { ROLES } from '../data/constants.js'

const props = defineProps({ project: { type: Object, required: true } })

const activePlatformId = ref(PLATFORMS[0].id)
const activeCharId = ref(props.project.characters[0]?.id || '')

// 캐릭터가 없거나 선택값이 사라지면 보정
watch(
  () => props.project.characters.map((c) => c.id).join(','),
  () => {
    if (!props.project.characters.find((c) => c.id === activeCharId.value)) {
      activeCharId.value = props.project.characters[0]?.id || ''
    }
  },
)

const activeChar = computed(() => props.project.characters.find((c) => c.id === activeCharId.value) || null)
const activePlatform = computed(() => PLATFORMS.find((p) => p.id === activePlatformId.value))

const roleEmoji = (v) => ROLES.find((r) => r.value === v)?.emoji || '🧸'

// 플랫폼이 생성한 입력칸 + 사용자가 수정한 값 병합
const fields = computed(() => {
  const pf = activePlatform.value
  if (!pf || !activeChar.value) return []
  const ctx = {
    project: props.project,
    character: activeChar.value,
    characters: props.project.characters,
    relations: props.project.relations,
    world: props.project.world,
  }
  const built = pf.build(ctx)
  const ov = props.project.exportOverrides?.[pf.id] || {}
  return built.map((f) => {
    const okey = `${activeChar.value.id}.${f.key}`
    const value = okey in ov ? ov[okey] : f.value
    return { ...f, _okey: okey, value, generated: f.value, edited: okey in ov }
  })
})

function onEdit(f, ev) {
  setExportOverride(props.project.id, activePlatform.value.id, f._okey, ev.target.value)
}

function resetPlatform() {
  if (confirm(`${activePlatform.value.name}의 수정 내용을 모두 기본값으로 되돌릴까요?`)) {
    clearExportOverrides(props.project.id, activePlatform.value.id)
  }
}

function copyAll() {
  const text = fields.value
    .filter((f) => (f.value || '').trim())
    .map((f) => {
      const converted = replaceTemplates(f.value, activeChar.value, props.project.characters)
      return `■ ${f.label}\n${converted}`
    })
    .join('\n\n')
  copyText(text)
}

function overCount(f) {
  return f.maxlength && (f.value || '').length > f.maxlength
}
</script>

<template>
  <div>
    <h2 class="section-title">🚀 플랫폼별 내보내기</h2>
    <p class="section-desc">캐릭터를 고르면 플랫폼 입력칸에 맞춰 자동 배치돼요. 값은 자유롭게 수정 후 복사하세요.</p>

    <div v-if="project.characters.length === 0" class="empty card">
      <div class="big">🐣</div>
      <p>먼저 '캐릭터' 탭에서 캐릭터를 추가해주세요.</p>
    </div>

    <template v-else>
      <!-- 캐릭터 선택 -->
      <div class="select-block">
        <span class="tiny muted sel-label">캐릭터</span>
        <div class="char-chips">
          <button
            v-for="c in project.characters"
            :key="c.id"
            class="char-chip"
            :class="{ on: c.id === activeCharId }"
            @click="activeCharId = c.id"
          >
            {{ roleEmoji(c.role) }} {{ c.name || '(이름 없음)' }}
          </button>
        </div>
      </div>

      <!-- 플랫폼 선택 -->
      <div class="select-block">
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

      <!-- 안내 + 액션 -->
      <div class="card plat-info" :style="{ '--pc': activePlatform.color }">
        <div class="spread">
          <div class="grow">
            <strong>{{ activePlatform.emoji }} {{ activePlatform.name }}</strong>
            <p class="tiny muted" style="margin: 4px 0 0">{{ activePlatform.note }}</p>
          </div>
          <div class="row" style="gap: 8px">
            <button class="btn btn-sm" @click="resetPlatform">↺ 기본값</button>
            <button class="btn btn-primary btn-sm" @click="copyAll">전체 복사</button>
          </div>
        </div>
      </div>

      <!-- 입력칸 -->
      <div v-for="f in fields" :key="f._okey" class="card field-card">
        <div class="field-top">
          <span class="lab-strong">
            {{ f.label }}
            <span v-if="f.edited" class="chip pink tiny" style="margin-left: 6px">수정됨</span>
          </span>
          <div class="field-top-right">
            <span v-if="f.maxlength" class="counter tiny" :class="{ over: overCount(f) }">
              {{ (f.value || '').length }} / {{ f.maxlength }}
            </span>
            <button class="btn btn-ghost btn-sm" @click="copyText(replaceTemplates(f.value || '', activeChar, project.characters))">복사</button>
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
  </div>
</template>

<style scoped>
.select-block { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
.sel-label { width: 48px; flex-shrink: 0; padding-top: 8px; font-weight: 600; }
.char-chips, .plat-chips { display: flex; gap: 8px; flex-wrap: wrap; }

.char-chip, .plat-chip { border: 1.5px solid var(--line-strong); background: var(--surface-soft); border-radius: 999px; padding: 8px 15px; font-size: .88rem; font-weight: 600; color: var(--ink-soft); cursor: pointer; font-family: var(--font-body); transition: all .14s; }
.char-chip:hover, .plat-chip:hover { transform: translateY(-1px); }
.char-chip.on { background: linear-gradient(135deg, var(--green), var(--green-strong)); color: #081019; border-color: transparent; font-weight: 700; }
.plat-chip.on { background: linear-gradient(135deg, var(--pc), rgba(255, 255, 255, 0.22)); color: #081019; border-color: transparent; box-shadow: var(--shadow-sm); }

.plat-info { border-left: 5px solid var(--pc); }

.field-card { padding: 16px; }
.field-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.field-top-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.lab-strong { font-weight: 700; font-size: .95rem; }
.field-hint { margin: 4px 0 10px; }
</style>
