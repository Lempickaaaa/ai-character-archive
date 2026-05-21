<script setup>
import { ref, computed } from 'vue'
import { exportProjectJSON, importProjectJSON } from '../store/index.js'
import { copyText, toast } from '../store/toast.js'

const props = defineProps({ project: { type: Object, required: true } })

const jsonText = computed(() => JSON.stringify(exportProjectJSON(props.project.id), null, 2))
const importText = ref('')
const importError = ref('')

function download() {
  const blob = new Blob([jsonText.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const safe = (props.project.name || 'project').replace(/[\\/:*?"<>|]/g, '_')
  a.href = url
  a.download = `${safe}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  toast('JSON 파일을 내려받았어요 ⬇')
}

function onFile(ev) {
  const file = ev.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    importText.value = String(reader.result || '')
  }
  reader.readAsText(file)
  ev.target.value = ''
}

function doImport() {
  importError.value = ''
  try {
    const p = importProjectJSON(importText.value)
    importText.value = ''
    toast(`'${p.name}' 불러오기 완료 ✶`)
  } catch (e) {
    importError.value = e.message || '불러오기에 실패했어요.'
  }
}
</script>

<template>
  <div>
    <h2 class="section-title">💾 설정집 내보내기 / 불러오기</h2>
    <p class="section-desc">기본적으로 브라우저에 자동 저장돼요. JSON으로 백업하거나, 정해진 포맷의 JSON을 불러와 편집할 수 있어요.</p>

    <!-- 내보내기 -->
    <div class="card">
      <div class="spread" style="margin-bottom: 12px">
        <strong>📤 현재 프로젝트 내보내기</strong>
        <div class="row" style="gap: 8px">
          <button class="btn btn-sm" @click="copyText(jsonText)">복사</button>
          <button class="btn btn-primary btn-sm" @click="download">JSON 다운로드</button>
        </div>
      </div>
      <textarea class="code" :value="jsonText" readonly rows="12"></textarea>
    </div>

    <!-- 불러오기 -->
    <div class="card" style="margin-top: 16px">
      <div class="spread" style="margin-bottom: 12px">
        <div>
          <strong>📥 JSON 불러오기 (새 프로젝트로 추가)</strong>
          <p class="tiny muted" style="margin: 4px 0 0">format: "ai-character-archive" 포맷이어야 해요.</p>
        </div>
        <label class="btn btn-sm" style="cursor: pointer">
          파일 선택
          <input type="file" accept="application/json,.json" style="display: none" @change="onFile" />
        </label>
      </div>
      <textarea
        class="code"
        v-model="importText"
        rows="8"
        placeholder='여기에 JSON을 붙여넣거나 위에서 파일을 선택하세요.'
      ></textarea>
      <p v-if="importError" class="err">⚠ {{ importError }}</p>
      <div style="margin-top: 12px; text-align: right">
        <button class="btn btn-lav" :disabled="!importText.trim()" @click="doImport">불러오기</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.code { font-family: ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace; font-size: .82rem; line-height: 1.5; background: var(--surface-alt); color: #5a4a66; }
.err { color: var(--danger); font-size: .85rem; font-weight: 600; margin: 10px 0 0; }
</style>
