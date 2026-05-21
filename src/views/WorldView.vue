<script setup>
import { addWorldElement, removeWorldElement, addWorldItem, removeWorldItem } from '../store/index.js'
import { WORLD_ELEMENT_SUGGESTIONS, WORLD_KEYWORDS_MAX } from '../data/constants.js'

const props = defineProps({ project: { type: Object, required: true } })

function addWithName(name) {
  const e = addWorldElement(props.project.id)
  if (e) e.groupName = name
}
</script>

<template>
  <div>
    <h2 class="section-title fade-rise" style="--delay: 0ms">🗺️ 세계관 설정</h2>
    <p class="section-desc fade-rise" style="--delay: 40ms">
      전체 개요를 적고, 주요 요소를 <b>키워드 그룹</b>으로 정리해요. (그룹명 · 키워드–설명 쌍 최대 {{ WORLD_KEYWORDS_MAX }}개)
    </p>

    <div class="card fade-rise" style="--delay: 80ms">
      <label class="field" style="margin-bottom: 0">
        <span class="lab">세계관 기본 개요</span>
        <textarea
          v-model="project.world.overview"
          rows="5"
          placeholder="이 세계는 어떤 곳인가요? 시대, 분위기, 큰 흐름을 자유롭게 적어주세요."
        ></textarea>
      </label>
    </div>

    <div class="spread fade-rise" style="margin-top: 24px; --delay: 120ms">
      <h3 class="section-title" style="font-size: 1.1rem">🔑 주요 요소 (키워드 그룹)</h3>
      <button class="btn btn-lav btn-sm" @click="addWorldElement(project.id)">+ 그룹 추가</button>
    </div>

    <p class="hint-box fade-rise" style="--delay: 140ms">
      💡 제타 로어북 기준이에요. <b>키워드 : 설명</b> 형태로 입력하면, 내보낼 때 키워드 나열 + 키워드별 설명으로 묶여 들어가요.
      한 그룹에 키워드는 최대 {{ WORLD_KEYWORDS_MAX }}개까지 — 더 필요하면 <b>그룹을 나눠</b>(그룹1 · 그룹2…) 작성하길 권장해요.
    </p>

    <div class="suggest-row fade-rise" style="--delay: 160ms">
      <span class="tiny muted">빠른 추가:</span>
      <button v-for="s in WORLD_ELEMENT_SUGGESTIONS" :key="s" class="suggest-chip" @click="addWithName(s)">+ {{ s }}</button>
    </div>

    <div v-if="project.world.elements.length === 0" class="empty card fade-rise" style="--delay: 180ms">
      <div class="big">📦</div>
      <p>아직 그룹이 없어요. 위 키워드를 눌러 빠르게 추가해보세요!</p>
    </div>

    <div
      v-for="(e, index) in project.world.elements"
      :key="e.id"
      class="card el-card fade-rise"
      :style="{ '--delay': `${180 + index * 70}ms` }"
    >
      <div class="el-head">
        <input v-model="e.groupName" type="text" class="el-group" placeholder="그룹명 (예: 마법 체계)" />
        <button class="btn btn-danger btn-sm" @click="removeWorldElement(project.id, e.id)">✕</button>
      </div>

      <div class="kw-label tiny muted">
        키워드–설명 <span class="kw-count">({{ e.items.length }}/{{ WORLD_KEYWORDS_MAX }})</span>
      </div>

      <div class="kw-list">
        <div v-for="(it, ki) in e.items" :key="ki" class="kw-pair">
          <input v-model="it.keyword" type="text" class="kw-key" :placeholder="`키워드 ${ki + 1}`" />
          <span class="kw-sep">:</span>
          <input v-model="it.value" type="text" class="kw-val" placeholder="설명" />
          <button v-if="e.items.length > 1" class="kw-x" title="삭제" @click="removeWorldItem(project.id, e.id, ki)">×</button>
        </div>
      </div>

      <button
        v-if="e.items.length < WORLD_KEYWORDS_MAX"
        class="kw-add"
        @click="addWorldItem(project.id, e.id)"
      >+ 키워드–설명 추가</button>
    </div>
  </div>
</template>

<style scoped>
.hint-box { background: var(--lav-soft); color: var(--ink-soft); border-radius: var(--radius-sm); padding: 11px 14px; font-size: .82rem; margin: 0 0 14px; line-height: 1.6; }
.suggest-row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin: 0 0 16px; }
.suggest-chip {
  border: 1.5px solid rgba(255, 226, 196, 0.22);
  background: linear-gradient(135deg, rgba(106, 166, 232, 0.18), rgba(91, 199, 176, 0.14));
  color: var(--ink);
  border-radius: 999px;
  padding: 5px 12px;
  font-size: .8rem;
  cursor: pointer;
  font-family: var(--font-body);
  transition: all .15s;
}
.suggest-chip:hover {
  border-color: rgba(255, 229, 209, 0.42);
  background: linear-gradient(135deg, rgba(106, 166, 232, 0.26), rgba(216, 131, 66, 0.18));
  color: var(--ink);
  transform: translateY(-1px);
}

.el-card { padding: 16px 18px; }
.el-head { display: flex; gap: 10px; align-items: center; margin-bottom: 14px; }
.el-group { font-weight: 700; font-family: var(--font-head); }

.kw-label { margin-bottom: 8px; }
.kw-count { color: var(--lav); font-weight: 700; }
.kw-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
.kw-pair { display: flex; align-items: center; gap: 8px; }
.kw-key { flex: 0 0 32%; min-width: 110px; font-weight: 600; }
.kw-sep { color: var(--ink-faint); font-weight: 700; }
.kw-val { flex: 1; min-width: 120px; }
.kw-x { border: none; background: transparent; color: var(--ink-faint); cursor: pointer; font-size: 1.1rem; line-height: 1; padding: 2px 4px; flex-shrink: 0; }
.kw-x:hover { color: var(--danger); }
.kw-add {
  border: 1.5px solid rgba(255, 226, 196, 0.2);
  background: linear-gradient(135deg, rgba(224, 169, 123, 0.18), rgba(216, 131, 66, 0.14));
  color: var(--ink);
  border-radius: var(--radius-sm);
  padding: 8px 14px;
  font-size: .82rem;
  font-weight: 600;
  cursor: pointer;
  font-family: var(--font-body);
  transition: all .15s;
}
.kw-add:hover {
  border-color: rgba(255, 229, 209, 0.38);
  background: linear-gradient(135deg, rgba(224, 169, 123, 0.28), rgba(216, 131, 66, 0.22));
  color: var(--ink);
}
</style>
