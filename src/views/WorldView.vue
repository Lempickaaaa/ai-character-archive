<script setup>
import { addWorldElement, removeWorldElement } from '../store/index.js'
import { WORLD_ELEMENT_SUGGESTIONS } from '../data/constants.js'

const props = defineProps({ project: { type: Object, required: true } })

function addWithKey(key) {
  const e = addWorldElement(props.project.id)
  if (e) e.key = key
}
</script>

<template>
  <div>
    <h2 class="section-title">🗺️ 세계관 설정</h2>
    <p class="section-desc">전체 개요를 먼저 적고, 주요 요소를 키워드 - 값 형식으로 정리해요.</p>

    <div class="card">
      <label class="field" style="margin-bottom: 0">
        <span class="lab">세계관 기본 개요</span>
        <textarea
          v-model="project.world.overview"
          rows="5"
          placeholder="이 세계는 어떤 곳인가요? 시대, 분위기, 큰 흐름을 자유롭게 적어주세요."
        ></textarea>
      </label>
    </div>

    <div class="spread" style="margin-top: 24px">
      <h3 class="section-title" style="font-size: 1.1rem">🔑 주요 요소 (키워드 - 값)</h3>
      <button class="btn btn-lav btn-sm" @click="addWorldElement(project.id)">+ 요소 추가</button>
    </div>

    <div class="suggest-row">
      <span class="tiny muted">빠른 추가:</span>
      <button v-for="s in WORLD_ELEMENT_SUGGESTIONS" :key="s" class="suggest-chip" @click="addWithKey(s)">+ {{ s }}</button>
    </div>

    <div v-if="project.world.elements.length === 0" class="empty card">
      <div class="big">📦</div>
      <p>아직 요소가 없어요. 위 키워드를 눌러 빠르게 추가해보세요!</p>
    </div>

    <div v-for="e in project.world.elements" :key="e.id" class="card el-card">
      <input v-model="e.key" type="text" class="el-key" placeholder="키워드 (예: 마법 체계)" />
      <textarea v-model="e.value" class="el-val" rows="2" placeholder="값 / 설명"></textarea>
      <button class="btn btn-danger btn-sm" @click="removeWorldElement(project.id, e.id)">✕</button>
    </div>
  </div>
</template>

<style scoped>
.suggest-row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin: 12px 0 16px; }
.suggest-chip { border: 1.5px dashed var(--line-strong); background: #fff; color: var(--ink-soft); border-radius: 999px; padding: 5px 12px; font-size: .8rem; cursor: pointer; font-family: var(--font-body); transition: all .15s; }
.suggest-chip:hover { border-color: var(--lav); color: #6b5bb0; background: var(--lav-soft); }

.el-card { display: grid; grid-template-columns: 200px 1fr auto; gap: 12px; align-items: start; padding: 14px 16px; }
.el-key { font-weight: 600; }
@media (max-width: 620px) { .el-card { grid-template-columns: 1fr; } }
</style>
