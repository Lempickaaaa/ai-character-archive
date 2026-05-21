<script setup>
import { ref, computed, watch } from 'vue'
import { SOURCE_FIELDS, getPlatformTargets, cloneTargets } from '../data/schema.js'
import { setPlatformMapping, clearPlatformMapping } from '../store/index.js'
import { toast } from '../store/toast.js'

const props = defineProps({
  platform: { type: Object, required: true },
  project: { type: Object, required: true },
})

// 편집용 타깃 목록 (저장된 커스텀 매핑 우선, 없으면 기본값 복제)
function initialTargets() {
  const saved = props.project.mappings?.[props.platform.id]
  return saved ? JSON.parse(JSON.stringify(saved)) : cloneTargets(props.platform.id)
}
const editTargets = ref(initialTargets())
const pickedSrc = ref(null)
const activeGroup = ref('all')

watch(
  () => props.platform.id,
  () => {
    editTargets.value = initialTargets()
    pickedSrc.value = null
  },
)

const hasCustom = computed(() => !!props.project.mappings?.[props.platform.id])
const sourceGroups = computed(() => [...new Set(SOURCE_FIELDS.map((s) => s.group))])
const visibleSources = computed(() =>
  activeGroup.value === 'all' ? SOURCE_FIELDS : SOURCE_FIELDS.filter((s) => s.group === activeGroup.value),
)

watch(activeGroup, () => {
  if (pickedSrc.value && !visibleSources.value.some((s) => s.id === pickedSrc.value)) pickedSrc.value = null
})

// 그래프 레이아웃
const W = 760
const PAD = 14
const STEP = 46
const NODE_H = 34
const SRC_X = 196
const TGT_X = W - 196
const sources = visibleSources

const layout = computed(() => {
  const targets = editTargets.value
  const rows = Math.max(sources.value.length, targets.length)
  const H = PAD * 2 + rows * STEP
  const srcStep = (H - 2 * PAD) / sources.value.length
  const tgtStep = (H - 2 * PAD) / targets.length
  const srcPos = sources.value.map((s, i) => ({ ...s, y: PAD + srcStep * (i + 0.5) }))
  const tgtPos = targets.map((t, j) => ({ ...t, idx: j, y: PAD + tgtStep * (j + 0.5) }))
  const edges = []
  tgtPos.forEach((t) => {
    ;(t.sources || []).forEach((sid) => {
      const s = srcPos.find((x) => x.id === sid)
      if (s) edges.push({ srcId: sid, tgtIdx: t.idx, y1: s.y, y2: t.y })
    })
  })
  return { H, srcPos, tgtPos, edges }
})

function edgePath(e) {
  const cx = (SRC_X + TGT_X) / 2
  return `M ${SRC_X} ${e.y1} C ${cx} ${e.y1}, ${cx} ${e.y2}, ${TGT_X} ${e.y2}`
}

function pickSrc(id) {
  pickedSrc.value = pickedSrc.value === id ? null : id
}

function pickGroup(group) {
  activeGroup.value = group
}

// 타깃 클릭 → 선택된 소스 연결 토글
function toggleTarget(idx) {
  if (pickedSrc.value == null) return
  const t = editTargets.value[idx]
  if (!t.sources) t.sources = []
  const i = t.sources.indexOf(pickedSrc.value)
  if (i === -1) t.sources.push(pickedSrc.value)
  else t.sources.splice(i, 1)
}

function isConnected(idx, sid) {
  return (editTargets.value[idx]?.sources || []).includes(sid)
}
function srcDim(sid) {
  if (pickedSrc.value == null) return false
  return pickedSrc.value !== sid
}
function edgeActive(e) {
  if (pickedSrc.value == null) return true
  return e.srcId === pickedSrc.value
}

function apply() {
  setPlatformMapping(props.project.id, props.platform.id, editTargets.value)
  toast('매핑을 적용했어요 ✶')
}
function resetDefault() {
  clearPlatformMapping(props.project.id, props.platform.id)
  editTargets.value = cloneTargets(props.platform.id)
  pickedSrc.value = null
  toast('기본 매핑으로 되돌렸어요')
}

const groupColor = (g) =>
  ({
    기본설정: 'var(--sun)',
    캐릭터: 'var(--pink)',
    '유저 캐릭터': 'var(--lav)',
    커버: 'var(--mint)',
    도입부: 'var(--green)',
    '캐릭터 설정': 'var(--pink)',
    '캐릭터 서사': 'var(--sun)',
    '설정 노트': 'var(--lav)',
    고급설정: 'var(--mint)',
    첫장면: 'var(--green)',
    '캐릭터 소개': 'var(--sun)',
    세계관: 'var(--lav)',
    상세설정: 'var(--mint)',
    스토리: 'var(--green)',
  })[g] || 'var(--ink-soft)'
</script>

<template>
  <div class="mapping-editor">
    <div class="me-help">
      <p class="tiny">
        ① 왼쪽 <b>입력 요소</b>를 클릭해 선택 → ② 오른쪽 <b>입력칸</b>을 클릭하면 연결이 토글돼요.
        ③ <b>적용</b>을 누르면 이 매핑대로 내보내기 값이 다시 채워집니다.
        <span v-if="hasCustom" class="chip pink tiny" style="margin-left: 4px">커스텀 매핑 사용 중</span>
      </p>
      <div class="row" style="gap: 8px">
        <button class="btn btn-sm" @click="resetDefault">매핑 기본값</button>
        <button class="btn btn-primary btn-sm" @click="apply">적용</button>
      </div>
    </div>

    <div class="legend">
      <span class="lg"><i style="background: var(--pink)"></i>캐릭터</span>
      <span class="lg"><i style="background: var(--lav)"></i>관계</span>
      <span class="lg"><i style="background: var(--mint)"></i>세계관</span>
      <span class="lg"><i style="background: var(--sun)"></i>소개글</span>
    </div>

    <div class="filter-row">
      <span class="tiny muted filter-label">입력 요소 유형</span>
      <div class="filter-chips">
        <button class="filter-chip" :class="{ on: activeGroup === 'all' }" @click="pickGroup('all')">전체</button>
        <button
          v-for="group in sourceGroups"
          :key="group"
          class="filter-chip"
          :class="{ on: activeGroup === group }"
          @click="pickGroup(group)"
        >
          {{ group }}
        </button>
      </div>
    </div>

    <div class="graph-scroll">
      <div class="graph" :style="{ width: W + 'px', height: layout.H + 'px' }">
        <svg class="edges" :viewBox="`0 0 ${W} ${layout.H}`" :width="W" :height="layout.H">
          <path
            v-for="(e, i) in layout.edges"
            :key="i"
            :d="edgePath(e)"
            class="edge"
            :class="{ dim: !edgeActive(e) }"
            :style="{ stroke: platform.color }"
          />
        </svg>

        <div
          v-for="s in layout.srcPos"
          :key="s.id"
          class="node src"
          :class="{ picked: pickedSrc === s.id, dim: srcDim(s.id) }"
          :style="{ top: (s.y - NODE_H / 2) + 'px', borderLeftColor: groupColor(s.group) }"
          @click="pickSrc(s.id)"
        >
          {{ s.label }}
        </div>

        <div
          v-for="t in layout.tgtPos"
          :key="t.idx"
          class="node tgt"
          :class="{ linkable: pickedSrc != null, linked: pickedSrc != null && isConnected(t.idx, pickedSrc) }"
          :style="{ top: (t.y - NODE_H / 2) + 'px' }"
          @click="toggleTarget(t.idx)"
        >
          {{ t.target }}
          <span v-if="(t.sources || []).length === 0" class="tiny muted">(비어있음)</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mapping-editor { margin-top: 8px; }
.me-help { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 10px; }
.me-help p { margin: 0; color: var(--ink-soft); line-height: 1.6; }

.legend { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 10px; }
.lg { display: inline-flex; align-items: center; gap: 6px; font-size: .78rem; color: var(--ink-soft); }
.lg i { width: 12px; height: 12px; border-radius: 3px; display: inline-block; }

.filter-row { display: flex; align-items: flex-start; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }
.filter-label { width: 74px; flex-shrink: 0; padding-top: 8px; font-weight: 600; }
.filter-chips { display: flex; gap: 8px; flex-wrap: wrap; }
.filter-chip {
  border: 1.5px solid var(--line-strong);
  background: var(--surface-soft);
  color: var(--ink-soft);
  border-radius: 999px;
  padding: 7px 13px;
  font-size: .8rem;
  font-weight: 600;
  cursor: pointer;
  font-family: var(--font-body);
  transition: all .14s;
}
.filter-chip:hover { transform: translateY(-1px); color: var(--ink); }
.filter-chip.on { background: linear-gradient(135deg, var(--green), var(--pink-strong)); color: #120c09; border-color: transparent; box-shadow: var(--shadow-sm); }

.graph-scroll { overflow-x: auto; }
.graph { position: relative; margin: 0 auto; }
.edges { position: absolute; inset: 0; pointer-events: none; }
.edge { fill: none; stroke-width: 1.8; opacity: 0.6; transition: opacity .15s; }
.edge.dim { opacity: 0.08; }

.node {
  position: absolute;
  height: 34px;
  width: 196px;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 0 12px;
  font-size: .82rem;
  font-weight: 600;
  border-radius: 9px;
  background: var(--surface);
  border: 1.5px solid var(--line-strong);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: opacity .15s, transform .12s, box-shadow .15s, border-color .15s;
}
.node.src { left: 0; border-left-width: 4px; }
.node.tgt { right: 0; justify-content: flex-end; text-align: right; }
.node:hover { transform: translateY(-1px); box-shadow: var(--shadow); }
.node.dim { opacity: 0.3; }
.node.picked { border-color: var(--pink); box-shadow: 0 0 0 3px var(--pink-soft); }
.node.tgt.linkable { border-style: dashed; }
.node.tgt.linked { border-color: var(--ok); border-style: solid; }

</style>
