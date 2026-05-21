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
