// 전역 상태 + localStorage 캐시 + JSON 입출력
import { reactive, watch } from 'vue'

const STORAGE_KEY = 'ai-character-archive:v1'
export const SCHEMA_VERSION = 1

function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function now() {
  return new Date().toISOString()
}

// ---- 팩토리 ------------------------------------------------------------

export function newBasicInfo() {
  return { age: '', gender: '', job: '', species: '', height: '', birthday: '', affiliation: '', mbti: '' }
}

export function newCharacter(role = 'main') {
  return {
    id: uid('char'),
    role,
    name: '',
    // 기본정보 (모든 역할 공통)
    basic: newBasicInfo(),
    // 주요 캐릭터 상세 필드
    personality: '',
    appearance: '',
    past: '',
    traits: '',
    speech: '',
    eventTrigger: '',
    // 주변/유저 캐릭터 (500자 제한)
    summary: '',
    // 첫 만남 / 예시 대화 (모든 역할 공통)
    firstMeeting: '',
    exampleDialogue: '',
  }
}

// 예전 버전 데이터에 누락된 필드를 채워넣는다.
function migrateCharacter(c) {
  return {
    ...newCharacter(c.role || 'main'),
    ...c,
    basic: { ...newBasicInfo(), ...(c.basic || {}) },
  }
}

export function newRelation(fromId = '', toId = '') {
  return { id: uid('rel'), fromId, toId, type: '친구', degree: 50, emotion: '', emotionDegree: 50 }
}

export function newWorldElement() {
  return { id: uid('we'), key: '', value: '' }
}

export function newProject(name = '새 프로젝트') {
  const ts = now()
  return {
    id: uid('proj'),
    name,
    createdAt: ts,
    updatedAt: ts,
    intro: '', // 1-3 소개글 (500자)
    characters: [],
    relations: [],
    world: { overview: '', elements: [] },
    exportOverrides: {}, // { [platformId]: { [fieldKey]: value } }
  }
}

// ---- 영속화 ------------------------------------------------------------

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { projects: [], activeId: null }
    const parsed = JSON.parse(raw)
    const projects = Array.isArray(parsed.projects) ? parsed.projects : []
    // 예전 버전 데이터 마이그레이션
    projects.forEach((p) => {
      if (Array.isArray(p.characters)) p.characters = p.characters.map(migrateCharacter)
      if (Array.isArray(p.relations)) p.relations = p.relations.map((r) => ({ ...newRelation(r.fromId, r.toId), ...r }))
    })
    return {
      projects,
      activeId: parsed.activeId ?? null,
    }
  } catch (e) {
    console.warn('저장된 데이터를 읽지 못했습니다.', e)
    return { projects: [], activeId: null }
  }
}

export const store = reactive(load())

let saveTimer = null
watch(
  store,
  () => {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ projects: store.projects, activeId: store.activeId }))
      } catch (e) {
        console.warn('자동 저장 실패', e)
      }
    }, 250)
  },
  { deep: true },
)

// ---- 조회 --------------------------------------------------------------

export function getProject(id) {
  return store.projects.find((p) => p.id === id) || null
}

function touch(project) {
  if (project) project.updatedAt = now()
}

// ---- 변경 액션 ----------------------------------------------------------

export function createProject(name) {
  const p = newProject(name && name.trim() ? name.trim() : '새 프로젝트')
  store.projects.unshift(p)
  store.activeId = p.id
  return p
}

export function deleteProject(id) {
  const i = store.projects.findIndex((p) => p.id === id)
  if (i !== -1) store.projects.splice(i, 1)
  if (store.activeId === id) store.activeId = store.projects[0]?.id ?? null
}

export function duplicateProject(id) {
  const src = getProject(id)
  if (!src) return null
  const copy = JSON.parse(JSON.stringify(src))
  copy.id = uid('proj')
  copy.name = `${src.name} (복사본)`
  copy.createdAt = copy.updatedAt = now()
  store.projects.unshift(copy)
  return copy
}

export function addCharacter(projectId, role = 'main') {
  const p = getProject(projectId)
  if (!p) return null
  const c = newCharacter(role)
  p.characters.push(c)
  touch(p)
  return c
}

export function removeCharacter(projectId, charId) {
  const p = getProject(projectId)
  if (!p) return
  p.characters = p.characters.filter((c) => c.id !== charId)
  p.relations = p.relations.filter((r) => r.fromId !== charId && r.toId !== charId)
  touch(p)
}

export function addRelation(projectId) {
  const p = getProject(projectId)
  if (!p) return null
  const ids = p.characters.map((c) => c.id)
  const r = newRelation(ids[0] || '', ids[1] || ids[0] || '')
  p.relations.push(r)
  touch(p)
  return r
}

export function removeRelation(projectId, relId) {
  const p = getProject(projectId)
  if (!p) return
  p.relations = p.relations.filter((r) => r.id !== relId)
  touch(p)
}

export function addWorldElement(projectId) {
  const p = getProject(projectId)
  if (!p) return null
  const e = newWorldElement()
  p.world.elements.push(e)
  touch(p)
  return e
}

export function removeWorldElement(projectId, elId) {
  const p = getProject(projectId)
  if (!p) return
  p.world.elements = p.world.elements.filter((e) => e.id !== elId)
  touch(p)
}

export function setExportOverride(projectId, platformId, fieldKey, value) {
  const p = getProject(projectId)
  if (!p) return
  if (!p.exportOverrides) p.exportOverrides = {}
  if (!p.exportOverrides[platformId]) p.exportOverrides[platformId] = {}
  p.exportOverrides[platformId][fieldKey] = value
  touch(p)
}

export function clearExportOverrides(projectId, platformId) {
  const p = getProject(projectId)
  if (!p || !p.exportOverrides) return
  delete p.exportOverrides[platformId]
  touch(p)
}

// ---- JSON 입출력 --------------------------------------------------------

export function exportProjectJSON(id) {
  const p = getProject(id)
  if (!p) return null
  return {
    format: 'ai-character-archive',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: now(),
    project: JSON.parse(JSON.stringify(p)),
  }
}

// 정해진 포맷을 보여주는 빈 템플릿(예시 1개씩 채워진 형태)
export function templateProjectJSON() {
  const mainChar = newCharacter('main')
  mainChar.id = 'char_example_main'
  mainChar.name = '예시 캐릭터'
  mainChar.basic = { age: '17', gender: '여', job: '마법사', species: '엘프', height: '160cm', birthday: '3월 14일', affiliation: '왕립 마법학원', mbti: 'INFP' }
  mainChar.personality = '밝고 장난기 많지만 속은 여림'
  mainChar.appearance = '은빛 단발, 보라색 눈동자'
  mainChar.past = '어린 시절 숲에서 홀로 자람'
  mainChar.traits = '단 것을 좋아함 / 천둥을 무서워함'
  mainChar.speech = '문장 끝에 "~랄까" 를 자주 붙임'
  mainChar.eventTrigger = '비가 오면 과거를 떠올리며 조용해짐'
  mainChar.firstMeeting = '도서관 구석에서 책에 파묻힌 채 처음 마주친다.'
  mainChar.exampleDialogue = '유저: 이름이 뭐야?\n캐릭터: ...루나. 외우기 쉽지, 랄까?'

  const subChar = newCharacter('sub')
  subChar.id = 'char_example_sub'
  subChar.name = '예시 주변인물'
  subChar.basic = { ...newBasicInfo(), age: '20', job: '호위 기사' }
  subChar.summary = '과묵하지만 충직한 호위 기사. (주변/유저 캐릭터는 500자 제한)'
  subChar.firstMeeting = ''
  subChar.exampleDialogue = ''

  return {
    format: 'ai-character-archive',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: now(),
    project: {
      id: 'proj_example',
      name: '예시 프로젝트 (이 값을 수정해 사용하세요)',
      createdAt: now(),
      updatedAt: now(),
      intro: '프로젝트 소개글입니다. (500자 제한)',
      characters: [mainChar, subChar],
      relations: [
        { id: 'rel_example', fromId: 'char_example_main', toId: 'char_example_sub', type: '주종', degree: 80, emotion: '신뢰', emotionDegree: 70 },
      ],
      world: {
        overview: '마법이 흔한 중세 왕국. 정령과 계약한 자만 마법을 쓸 수 있다.',
        elements: [
          { id: 'we_example_1', key: '마법 체계', value: '정령 계약 기반' },
          { id: 'we_example_2', key: '수도', value: '아스텔' },
        ],
      },
      exportOverrides: {},
    },
  }
}

// 정해진 포맷을 검증하고 프로젝트로 변환
export function parseProjectJSON(text) {
  let data
  try {
    data = JSON.parse(text)
  } catch (e) {
    throw new Error('JSON 형식이 올바르지 않습니다.')
  }
  const proj = data.project || data
  if (!proj || typeof proj !== 'object') throw new Error('project 필드를 찾을 수 없습니다.')
  if (typeof proj.name !== 'string') throw new Error('필수 필드(name)가 없습니다.')

  // 정규화 — 누락 필드 기본값 채우기
  const base = newProject(proj.name)
  const merged = {
    ...base,
    ...proj,
    id: uid('proj'),
    createdAt: proj.createdAt || now(),
    updatedAt: now(),
    intro: typeof proj.intro === 'string' ? proj.intro : '',
    characters: Array.isArray(proj.characters)
      ? proj.characters.map((c) => ({ ...migrateCharacter(c), id: c.id || uid('char') }))
      : [],
    relations: Array.isArray(proj.relations)
      ? proj.relations.map((r) => ({ ...newRelation(), ...r, id: r.id || uid('rel') }))
      : [],
    world: {
      overview: proj.world?.overview || '',
      elements: Array.isArray(proj.world?.elements)
        ? proj.world.elements.map((e) => ({ ...newWorldElement(), ...e, id: e.id || uid('we') }))
        : [],
    },
    exportOverrides: proj.exportOverrides && typeof proj.exportOverrides === 'object' ? proj.exportOverrides : {},
  }
  return merged
}

export function importProjectJSON(text) {
  const proj = parseProjectJSON(text)
  store.projects.unshift(proj)
  store.activeId = proj.id
  return proj
}

// ---- 마크다운/HTML 내보내기 -----------------------------------------------

export function generateProjectMarkdown(projectId) {
  const p = getProject(projectId)
  if (!p) return ''
  
  const lines = []
  lines.push(`# ${p.name}`)
  lines.push('')
  
  if (p.intro) {
    lines.push(p.intro)
    lines.push('')
  }
  
  // 캐릭터
  if (p.characters.length > 0) {
    lines.push('## 🧸 캐릭터')
    lines.push('')
    p.characters.forEach((c) => {
      const roleLabel = { main: '주요', sub: '주변', user: '유저' }[c.role] || ''
      lines.push(`### ${c.name} ${roleLabel}`)
      lines.push('')
      
      if (c.basic && Object.values(c.basic).some(v => v)) {
        lines.push('**기본정보**')
        Object.entries(c.basic).forEach(([key, val]) => {
          if (val) {
            const labels = { age: '나이', gender: '성별', job: '직업', species: '종족/출신', height: '키', birthday: '생일', affiliation: '소속', mbti: 'MBTI' }
            lines.push(`- ${labels[key] || key}: ${val}`)
          }
        })
        lines.push('')
      }
      
      if (c.personality) {
        lines.push('**성격**')
        lines.push(c.personality)
        lines.push('')
      }
      if (c.appearance) {
        lines.push('**외모**')
        lines.push(c.appearance)
        lines.push('')
      }
      if (c.past) {
        lines.push('**과거**')
        lines.push(c.past)
        lines.push('')
      }
      if (c.traits) {
        lines.push('**특징**')
        lines.push(c.traits)
        lines.push('')
      }
      if (c.speech) {
        lines.push('**말버릇**')
        lines.push(c.speech)
        lines.push('')
      }
      if (c.summary && c.role !== 'main') {
        lines.push('**설정**')
        lines.push(c.summary)
        lines.push('')
      }
      if (c.firstMeeting) {
        lines.push('**첫 만남**')
        lines.push(c.firstMeeting)
        lines.push('')
      }
    })
  }
  
  // 세계관
  if (p.world && (p.world.overview || (p.world.elements && p.world.elements.length > 0))) {
    lines.push('## 🌍 세계관')
    lines.push('')
    if (p.world.overview) {
      lines.push(p.world.overview)
      lines.push('')
    }
    if (p.world.elements && p.world.elements.length > 0) {
      p.world.elements.forEach((e) => {
        if (e.key || e.value) {
          lines.push(`- **${e.key || '항목'}**: ${e.value || ''}`)
        }
      })
      lines.push('')
    }
  }
  
  // 관계
  if (p.relations && p.relations.length > 0) {
    lines.push('## 💕 관계')
    lines.push('')
    p.relations.forEach((r) => {
      const from = p.characters.find(c => c.id === r.fromId)?.name || '?'
      const to = p.characters.find(c => c.id === r.toId)?.name || '?'
      const emo = r.emotion ? ` / ${r.emotion}` : ''
      lines.push(`- **${from}** —[${r.type}]→ **${to}**${emo}`)
    })
    lines.push('')
  }
  
  return lines.join('\n')
}

export function generateProjectHTML(projectId) {
  const md = generateProjectMarkdown(projectId)
  const escaped = md.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  
  let html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>캐릭터 설정 · AI 캐릭터 아카이브</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f8f9fa; }
    .container { max-width: 900px; margin: 0 auto; padding: 40px 20px; }
    h1 { font-size: 2.2rem; color: #222; margin: 0 0 20px; }
    h2 { font-size: 1.5rem; color: #333; margin: 30px 0 15px; border-bottom: 3px solid #f0a8c8; padding-bottom: 8px; }
    h3 { font-size: 1.2rem; color: #555; margin: 18px 0 10px; }
    h4 { font-size: 1rem; color: #666; margin: 10px 0 6px; font-weight: 600; }
    p { margin-bottom: 12px; white-space: pre-wrap; word-break: break-word; }
    ul { margin-left: 20px; margin-bottom: 15px; }
    li { margin-bottom: 8px; }
    strong { color: #222; font-weight: 600; }
    .section { background: #fff; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #f0a8c8; }
    .intro { font-size: 1.05rem; color: #555; padding: 15px; background: #fdf6f8; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #f48ab0; }
    .char-section { background: #fafbfc; padding: 15px; margin: 12px 0; border-radius: 6px; }
    .char-info { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin: 10px 0; }
    .info-item { background: #fff; padding: 10px; border-radius: 4px; font-size: 0.9rem; }
    footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 0.85rem; }
  </style>
</head>
<body>
  <div class="container">`
  
  // 마크다운을 HTML로 변환 (간단한 변환)
  const lines = md.split('\n')
  let inList = false
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    
    if (!line.trim()) {
      if (inList) { html += '</ul>'; inList = false; }
      continue
    }
    
    if (line.startsWith('# ')) {
      html += `<h1>${line.slice(2)}</h1>`
    } else if (line.startsWith('## ')) {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<h2>${line.slice(3)}</h2>`
    } else if (line.startsWith('### ')) {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<h3>${line.slice(4)}</h3>`
    } else if (line.startsWith('**') && line.endsWith('**')) {
      html += `<h4>${line.slice(2, -2)}</h4>`
    } else if (line.startsWith('- ')) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += `<li>${line.slice(2)}</li>`
    } else {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<p>${line}</p>`
    }
  }
  
  if (inList) html += '</ul>'
  
  html += `
    <footer>
      <p>AI 캐릭터 아카이브 · <a href="https://github.com" style="color: #f48ab0; text-decoration: none;">GitHub</a></p>
    </footer>
  </div>
</body>
</html>`
  
  return html
}
