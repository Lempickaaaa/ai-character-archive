<script setup>
import { ref, computed } from 'vue'
import { exportProjectJSON, generateProjectMarkdown, generateProjectHTML } from '../store/index.js'
import { copyText, toast } from '../store/toast.js'

const props = defineProps({ project: { type: Object, required: true } })

const activeExportTab = ref('json')
const jsonExport = computed(() => JSON.stringify(exportProjectJSON(props.project.id), null, 2))
const markdownExport = computed(() => generateProjectMarkdown(props.project.id))
const htmlExport = computed(() => generateProjectHTML(props.project.id))

function downloadFile(content, filename, mimeType, message) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  toast(message)
}

function saveJSON() {
  const safeName = (props.project.name || 'project').replace(/[\\/:*?"<>|]/g, '_')
  downloadFile(jsonExport.value, `${safeName}.json`, 'application/json', 'JSON 파일을 저장했어요 ⬇')
}

function saveMarkdown() {
  const safeName = (props.project.name || 'project').replace(/[\\/:*?"<>|]/g, '_')
  downloadFile(markdownExport.value, `${safeName}.md`, 'text/markdown', '마크다운 파일을 저장했어요 ⬇')
}

function saveHTML() {
  const safeName = (props.project.name || 'project').replace(/[\\/:*?"<>|]/g, '_')
  downloadFile(htmlExport.value, `${safeName}.html`, 'text/html', 'HTML 파일을 저장했어요 ⬇')
}
</script>

<template>
  <div>
    <h2 class="section-title">💾 설정집 내보내기</h2>
    <p class="section-desc">프로젝트를 JSON, 마크다운, HTML로 내보낼 수 있어요.</p>

    <!-- 완성본 내보내기 -->
    <div class="card export-panel fade-rise" style="--delay: 60ms">
      <div class="export-tabs">
        <button class="export-tab" :class="{ on: activeExportTab === 'json' }" @click="activeExportTab = 'json'">JSON</button>
        <button class="export-tab" :class="{ on: activeExportTab === 'markdown' }" @click="activeExportTab = 'markdown'">Markdown</button>
        <button class="export-tab" :class="{ on: activeExportTab === 'html' }" @click="activeExportTab = 'html'">HTML</button>
      </div>

      <div v-if="activeExportTab === 'json'" class="export-body">
        <div class="spread" style="margin-bottom: 12px">
          <div>
            <strong>📦 최종 JSON</strong>
            <p class="tiny muted" style="margin: 4px 0 0">전체 설정을 JSON 형식으로 확인하고 저장할 수 있어요.</p>
          </div>
          <div class="row" style="gap: 8px">
            <button class="btn btn-sm" @click="copyText(jsonExport)">복사</button>
            <button class="btn btn-primary btn-sm" @click="saveJSON">JSON 저장</button>
          </div>
        </div>
        <textarea class="code-preview" :value="jsonExport" readonly rows="10"></textarea>
      </div>

      <div v-else-if="activeExportTab === 'markdown'" class="export-body">
        <div class="spread" style="margin-bottom: 12px">
          <div>
            <strong>📄 Markdown</strong>
            <p class="tiny muted" style="margin: 4px 0 0">설정 내용을 마크다운 형식으로 변환해서 확인하고 저장할 수 있어요.</p>
          </div>
          <div class="row" style="gap: 8px">
            <button class="btn btn-sm" @click="copyText(markdownExport)">복사</button>
            <button class="btn btn-primary btn-sm" @click="saveMarkdown">Markdown 저장</button>
          </div>
        </div>
        <textarea class="code-preview" :value="markdownExport" readonly rows="10"></textarea>
      </div>

      <div v-else class="export-body">
        <div class="spread" style="margin-bottom: 12px">
          <div>
            <strong>🌐 HTML</strong>
            <p class="tiny muted" style="margin: 4px 0 0">설정 내용을 HTML 형식으로 변환해서 웹 브라우저나 공개 페이지로 공유할 수 있어요.</p>
          </div>
          <div class="row" style="gap: 8px">
            <button class="btn btn-sm" @click="copyText(htmlExport)">복사</button>
            <button class="btn btn-primary btn-sm" @click="saveHTML">HTML 저장</button>
          </div>
        </div>
        <div class="html-preview">
          <iframe :srcdoc="htmlExport" style="width: 100%; height: 420px; border: 0; display: block;"></iframe>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.export-panel { margin: 16px 0 18px; }
.export-tabs { display: inline-flex; gap: 6px; margin-bottom: 14px; padding: 4px; border-radius: 999px; background: rgba(255, 226, 196, 0.04); border: 1px solid rgba(255, 210, 166, 0.14); }
.export-tab { border: 1px solid transparent; background: transparent; color: var(--ink-soft); border-radius: 999px; padding: 7px 14px; font-family: var(--font-body); font-weight: 700; cursor: pointer; transition: all .15s; }
.export-tab:hover { color: var(--ink); background: var(--surface-soft); }
.export-tab.on { color: #160c06; background: linear-gradient(135deg, var(--green), var(--pink-strong)); box-shadow: var(--shadow-sm); }
.export-body { animation: riseFadeIn .45s cubic-bezier(.2, .8, .2, 1) both; }
.code-preview {
  width: 100%;
  resize: vertical;
  min-height: 220px;
  font-family: ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace;
  font-size: .82rem;
  line-height: 1.55;
  color: var(--ink);
  background: linear-gradient(180deg, rgba(255, 226, 196, 0.04), transparent 28%), var(--surface-alt);
  border: 1px solid rgba(255, 210, 166, 0.14);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
}

.html-preview {
  border: 1px solid rgba(255, 210, 166, 0.14);
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--surface-alt);
}
</style>
