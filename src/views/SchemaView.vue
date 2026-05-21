<script setup>
import { ref, computed } from 'vue'
import { PLATFORMS } from '../data/platforms.js'
import { SOURCE_FIELDS, PLATFORM_TARGETS } from '../data/schema.js'

defineProps({ project: { type: Object, required: true } })

const activePlatformId = ref(PLATFORMS[0].id)
const activePlatform = computed(() => PLATFORMS.find((p) => p.id === activePlatformId.value))

const hoverSrc = ref(null) // source id
const hoverTgt = ref(null) // target index

// 그래프 레이아웃 (고정 좌표계)
const W = 760
const PAD = 14
const STEP = 46
const NODE_H = 34
const SRC_X = 196 // 좌측 노드 우측 앵커
const TGT_X = W - 196 // 우측 노드 좌측 앵커

const sources = SOURCE_FIELDS

const layout = computed(() => {
  const targets = PLATFORM_TARGETS[activePlatformId.value] || []
  const rows = Math.max(sources.length, targets.length)
  const H = PAD * 2 + rows * STEP
  const srcStep = (H - 2 * PAD) / sources.length
  const tgtStep = (H - 2 * PAD) / targets.length
  const srcPos = sources.map((s, i) => ({ ...s, y: PAD + srcStep * (i + 0.5) }))
  const tgtPos = targets.map((t, j) => ({ ...t, idx: j, y: PAD + tgtStep * (j + 0.5) }))

  const usedSrc = new Set()
  targets.forEach((t) => t.sources.forEach((sid) => usedSrc.add(sid)))

  const edges = []
  tgtPos.forEach((t) => {
    t.sources.forEach((sid) => {
      const s = srcPos.find((x) => x.id === sid)
      if (s) edges.push({ srcId: sid, tgtIdx: t.idx, y1: s.y, y2: t.y })
    })
  })
  return { H, srcPos, tgtPos, usedSrc, edges }
})

function edgePath(e) {
  const x1 = SRC_X
  const x2 = TGT_X
  const cx = (x1 + x2) / 2
  return `M ${x1} ${e.y1} C ${cx} ${e.y1}, ${cx} ${e.y2}, ${x2} ${e.y2}`
}

function edgeActive(e) {
  if (hoverSrc.value == null && hoverTgt.value == null) return true
  return e.srcId === hoverSrc.value || e.tgtIdx === hoverTgt.value
}

function srcActive(sid) {
  if (hoverSrc.value == null && hoverTgt.value == null) return true
  if (hoverSrc.value === sid) return true
  if (hoverTgt.value != null) {
    const t = layout.value.tgtPos.find((x) => x.idx === hoverTgt.value)
    return t ? t.sources.includes(sid) : false
  }
  return layout.value.edges.some((e) => e.srcId === sid && e.srcId === hoverSrc.value)
}

function tgtActive(idx) {
  if (hoverSrc.value == null && hoverTgt.value == null) return true
  if (hoverTgt.value === idx) return true
  if (hoverSrc.value != null) {
    const t = layout.value.tgtPos.find((x) => x.idx === idx)
    return t ? t.sources.includes(hoverSrc.value) : false
  }
  return false
}

const groupColor = (g) =>
  ({ 캐릭터: 'var(--pink)', 관계: 'var(--lav)', 세계관: 'var(--mint)', 소개글: 'var(--sun)' })[g] || 'var(--ink-soft)'
</script>

<template>
  <div>
    <h2 class="section-title fade-rise" style="--delay: 0ms">🧬 플랫폼별 입력 요소 현황 매칭</h2>
    <p class="section-desc fade-rise" style="--delay: 40ms">
      입력 요소가 각 플랫폼의 어느 입력칸으로 들어가는지 한눈에 볼 수 있어요. 노드에 마우스를 올리면 연결이 강조돼요.
    </p>

    <!-- 플랫폼 선택 -->
    <div class="select-block fade-rise" style="--delay: 80ms">
      <span class="tiny muted sel-label">플랫폼</span>
      <div class="plat-chips">
        <button
          v-for="p in PLATFORMS"
          :key="p.id"
          class="plat-chip"
          :class="{ on: p.id === activePlatformId }"
          :style="{ '--pc': p.color }"
          @click="activePlatformId = p.id; hoverSrc = null; hoverTgt = null"
        >
          {{ p.emoji }} {{ p.name }}
        </button>
      </div>
    </div>

    <div class="legend fade-rise" style="--delay: 100ms">
      <span class="lg"><i style="background: var(--pink)"></i>캐릭터</span>
      <span class="lg"><i style="background: var(--lav)"></i>관계</span>
      <span class="lg"><i style="background: var(--mint)"></i>세계관</span>
      <span class="lg"><i style="background: var(--sun)"></i>소개글</span>
    </div>

    <div class="card graph-card fade-rise" style="--delay: 140ms" :style="{ '--pc': activePlatform.color }">
      <div class="col-titles" :style="{ width: W + 'px' }">
        <span>입력 요소</span>
        <span class="arrow">→</span>
        <span>{{ activePlatform.emoji }} {{ activePlatform.name }} 입력칸</span>
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
              :style="{ stroke: activePlatform.color }"
            />
          </svg>

          <!-- 소스 노드 -->
          <div
            v-for="s in layout.srcPos"
            :key="s.id"
            class="node src"
            :class="{ dim: !srcActive(s.id) || !layout.usedSrc.has(s.id), unused: !layout.usedSrc.has(s.id) }"
            :style="{ top: (s.y - NODE_H / 2) + 'px', borderLeftColor: groupColor(s.group) }"
            @mouseenter="hoverSrc = s.id"
            @mouseleave="hoverSrc = null"
          >
            {{ s.label }}
          </div>

          <!-- 타깃 노드 -->
          <div
            v-for="t in layout.tgtPos"
            :key="t.idx"
            class="node tgt"
            :class="{ dim: !tgtActive(t.idx) }"
            :style="{ top: (t.y - NODE_H / 2) + 'px' }"
            @mouseenter="hoverTgt = t.idx"
            @mouseleave="hoverTgt = null"
          >
            {{ t.target }}
            <span v-if="t.sources.length === 0" class="tiny muted">(고정값)</span>
          </div>
        </div>
      </div>
    </div>

    <p class="tiny muted" style="margin-top: 12px">
      💡 실제 값과 수정은 <b>플랫폼별 내보내기</b> 탭에서 할 수 있어요. 이 화면은 매핑 구조를 확인하는 용도예요.
    </p>
  </div>
</template>

<style scoped>
.select-block { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
.sel-label { width: 48px; flex-shrink: 0; padding-top: 8px; font-weight: 600; }
.plat-chips { display: flex; gap: 8px; flex-wrap: wrap; }
.plat-chip { border: 1.5px solid var(--line-strong); background: var(--surface-soft); border-radius: 999px; padding: 8px 15px; font-size: .88rem; font-weight: 600; color: var(--ink-soft); cursor: pointer; font-family: var(--font-body); transition: all .14s; }
.plat-chip:hover { transform: translateY(-1px); }
.plat-chip.on { background: var(--pc); color: #fff; border-color: transparent; box-shadow: var(--shadow-sm); }

.legend { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 12px; }
.lg { display: inline-flex; align-items: center; gap: 6px; font-size: .8rem; color: var(--ink-soft); }
.lg i { width: 12px; height: 12px; border-radius: 3px; display: inline-block; }

.graph-card { border-left: 5px solid var(--pc); overflow: hidden; }
.col-titles { display: flex; justify-content: space-between; align-items: center; margin: 0 auto 10px; font-family: var(--font-head); font-size: .9rem; color: var(--ink-soft); max-width: 100%; }
.col-titles .arrow { color: var(--ink-faint); }
.graph-scroll { overflow-x: auto; }
.graph { position: relative; margin: 0 auto; }

.edges { position: absolute; inset: 0; pointer-events: none; }
.edge { fill: none; stroke-width: 1.6; opacity: 0.55; transition: opacity .15s; }
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
  transition: opacity .15s, transform .12s, box-shadow .15s;
  cursor: default;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.node.src { left: 0; border-left-width: 4px; }
.node.tgt { right: 0; justify-content: flex-end; text-align: right; }
.node:hover { transform: translateY(-1px); box-shadow: var(--shadow); }
.node.dim { opacity: 0.28; }
.node.unused { border-style: dashed; }
</style>
