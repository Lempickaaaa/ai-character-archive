// 플랫폼별 입력칸 매핑 (웹 조사 기반, 2026-05 기준 / 사이트 내 자유 수정 가능)
// 매핑 규칙:
//   · 관계(relations)  → 캐릭터 설정/프롬프트 쪽에 포함
//   · 세계관(world)    → 플랫폼의 세계관 슬롯에 포함 (제타는 '로어북'이 세계관에 해당)
import { RELATION_TYPES, relationDegreeLabel, BASIC_INFO_FIELDS } from './constants.js'

// 템플릿 변환 함수 - {{user}}, {{char}} 를 실제 캐릭터 이름으로 변환
export function replaceTemplates(text, character, characters) {
  if (!text) return text
  let result = text
  result = result.replace(/\{\{user\}\}/g, '(유저)')
  if (character?.name) {
    result = result.replace(/\{\{char\}\}/g, character.name)
  }
  return result
}

export function basicInfoText(c) {
  if (!c || !c.basic) return ''
  return BASIC_INFO_FIELDS.map((f) => {
    const v = (c.basic[f.key] || '').trim()
    return v ? `${f.label}: ${v}` : ''
  })
    .filter(Boolean)
    .join('\n')
}

export function characterBody(c) {
  if (!c) return ''
  if (c.role !== 'main') return (c.summary || '').trim()
  const parts = []
  if (c.personality) parts.push(`【성격】\n${c.personality.trim()}`)
  if (c.appearance) parts.push(`【외모】\n${c.appearance.trim()}`)
  if (c.past) parts.push(`【과거】\n${c.past.trim()}`)
  if (c.traits) parts.push(`【특징】\n${c.traits.trim()}`)
  if (c.speech) parts.push(`【말버릇】\n${c.speech.trim()}`)
  if (c.eventTrigger) parts.push(`【이벤트 트리거】\n${c.eventTrigger.trim()}`)
  return parts.join('\n\n')
}

// 세계관: 개요 + 키워드-값 요소
export function worldText(world) {
  if (!world) return ''
  const parts = []
  if (world.overview) parts.push(world.overview.trim())
  const els = (world.elements || []).filter((e) => e.key || e.value)
  if (els.length) {
    parts.push(els.map((e) => `· ${e.key || '항목'}: ${e.value || ''}`).join('\n'))
  }
  return parts.join('\n\n')
}

export function relationsText(characterId, relations, characters) {
  const nameOf = (id) => characters.find((c) => c.id === id)?.name || '?'
  const lines = (relations || [])
    .filter((r) => !characterId || r.fromId === characterId || r.toId === characterId)
    .map((r) => {
      const emo = r.emotion ? ` / 감정: ${r.emotion}(${relationDegreeLabel(r.emotionDegree ?? 50)})` : ''
      return `${nameOf(r.fromId)} —[${r.type}, ${relationDegreeLabel(r.degree)}${emo}]→ ${nameOf(r.toId)}`
    })
  return lines.join('\n')
}

function clip(text, max) {
  if (!max || !text) return text || ''
  return text.length > max ? text.slice(0, max) : text
}

function joinBlocks(...blocks) {
  return blocks.filter(Boolean).join('\n\n')
}

function ctxParts(ctx) {
  const { character, characters, relations, world, project } = ctx
  const rel = relationsText(character?.id, relations, characters)
  return {
    name: character?.name || '',
    basic: basicInfoText(character),
    body: characterBody(character),
    world: worldText(world),
    rel,
    relBlock: rel ? `[관계]\n${rel}` : '',
    intro: (project?.intro || '').trim(),
    speech: character?.speech || '',
    personality: character?.personality || character?.summary || '',
    appearance: character?.appearance || '',
    past: character?.past || '',
    first: (character?.firstMeeting || '').trim(),
    example: (character?.exampleDialogue || '').trim(),
  }
}

export const PLATFORMS = [
  {
    id: 'zeta',
    name: '제타',
    nameEn: 'zeta',
    emoji: '🪐',
    color: '#7c6cf0',
    note: '관계는 캐릭터 설명에, 세계관은 로어북(2026.2 추가)에 들어갑니다.',
    docUrl: 'https://zeta-ai.io',
    build(ctx) {
      const p = ctxParts(ctx)
      return [
        { key: 'name', label: '이름', hint: '캐릭터 이름', maxlength: 20, value: p.name },
        { key: 'oneline', label: '한 줄 소개', hint: '캐릭터를 한 문장으로', maxlength: 50, value: p.intro.split('\n')[0] || '' },
        { key: 'setting', label: '캐릭터 설명', hint: '기본정보·성격·외모·과거·특징·말버릇 + 관계', multiline: true, value: joinBlocks(p.basic && `[기본정보]\n${p.basic}`, p.body, p.relBlock) },
        { key: 'first', label: '첫 상황 (도입부)', hint: '대화가 시작되는 첫 장면', multiline: true, value: p.first },
        { key: 'example', label: '예시 대화', hint: '말투를 보여주는 예시 대화', multiline: true, value: p.example },
        { key: 'lorebook', label: '로어북 (세계관)', hint: '세계관 개요 + 키워드 요소', multiline: true, value: p.world },
      ]
    },
  },
  {
    id: 'bloom',
    name: '블룸',
    nameEn: 'bloom',
    emoji: '🌷',
    color: '#f48ab0',
    note: '관계는 프롬프트(페르소나)에, 세계관에 들어갑니다.',
    docUrl: 'https://bloom-ai.me',
    build(ctx) {
      const p = ctxParts(ctx)
      return [
        { key: 'name', label: '캐릭터 이름', hint: '', maxlength: 20, value: p.name },
        { key: 'info', label: '캐릭터 정보', hint: '나이·직업 등 기본 프로필', multiline: true, value: joinBlocks(p.basic, p.appearance && `외모: ${p.appearance}`) },
        { key: 'prompt', label: '프롬프트 (페르소나)', hint: '성격·말투 지시 + 관계', multiline: true, value: joinBlocks(p.body, p.speech && `(말투: ${p.speech})`, p.relBlock) },
        { key: 'world', label: '세계관', hint: '세계관 정보', multiline: true, value: p.world },
        { key: 'first', label: '첫 메시지 (도입부)', hint: '대화 시작 첫 메시지', multiline: true, value: p.first },
        { key: 'example', label: '예시 대화', hint: 'Q/A 형식 예시 대화', multiline: true, value: p.example },
      ]
    },
  },
  {
    id: 'melting',
    name: '멜팅',
    nameEn: 'melting',
    emoji: '🍮',
    color: '#f0a868',
    note: '글자수 제한: 캐릭터 소개 2,500 · 환경 설정 2,000 · 도입부 1,200 · 서사 700 · 설정노트 400(최대 20). 관계는 캐릭터 소개에 포함.',
    docUrl: 'https://melting.chat',
    build(ctx) {
      const p = ctxParts(ctx)
      const notes = (ctx.world?.elements || [])
        .filter((e) => e.key || e.value)
        .slice(0, 20)
        .map((e, i) => ({
          key: `note${i}`,
          label: `설정노트 ${i + 1}`,
          hint: `${e.key || '항목'}`,
          maxlength: 400,
          value: clip(`${e.key ? e.key + ': ' : ''}${e.value || ''}`, 400),
        }))
      return [
        { key: 'name', label: '캐릭터 이름', hint: '', maxlength: 20, value: p.name },
        { key: 'intro', label: '캐릭터 소개', hint: '기본정보·성격·외모·특징 + 관계', maxlength: 2500, multiline: true, value: clip(joinBlocks(p.basic && `[기본정보]\n${p.basic}`, p.body, p.relBlock), 2500) },
        { key: 'env', label: '환경 설정 (세계관)', hint: '세계관 개요/배경', maxlength: 2000, multiline: true, value: clip(ctx.world?.overview || '', 2000) },
        { key: 'narrative', label: '서사', hint: '과거/배경 서사', maxlength: 700, multiline: true, value: clip(p.past, 700) },
        { key: 'opening', label: '도입부', hint: '첫 장면', maxlength: 1200, multiline: true, value: clip(p.first, 1200) },
        ...notes,
      ]
    },
  },
  {
    id: 'crack',
    name: '크랙',
    nameEn: 'crack',
    emoji: '⚡',
    color: '#5bc7b0',
    note: '제작 6단계. 관계는 캐릭터 설정에, 세계관은 키워드북에 들어갑니다.',
    docUrl: 'https://crack.wrtn.ai',
    build(ctx) {
      const p = ctxParts(ctx)
      return [
        { key: 'name', label: '프로필 · 이름', hint: '', maxlength: 20, value: p.name },
        { key: 'oneline', label: '프로필 · 한 줄 소개', hint: '', maxlength: 50, value: p.intro.split('\n')[0] || '' },
        { key: 'setting', label: '캐릭터 설정', hint: '기본정보·성격·말투·특징 + 관계', multiline: true, value: joinBlocks(p.basic && `[기본정보]\n${p.basic}`, p.body, p.relBlock) },
        { key: 'start', label: '시작 설정 (첫 인사말/장면)', hint: '대화 시작 장면', multiline: true, value: p.first },
        { key: 'example', label: '예시 대화', hint: '예시 대화 (선택)', multiline: true, value: p.example },
        { key: 'keywordbook', label: '키워드북 (세계관)', hint: '세계관 키워드-값', multiline: true, value: p.world },
      ]
    },
  },
  {
    id: 'caveduck',
    name: '케이브덕',
    nameEn: 'caveduck',
    emoji: '🦆',
    color: '#6aa6e8',
    note: '관계는 커스텀 프롬프트에 포함. 케이브덕은 별도 세계관 칸이 없어 세계관도 프롬프트에 함께 넣습니다.',
    docUrl: 'https://caveduck.ai',
    build(ctx) {
      const p = ctxParts(ctx)
      return [
        { key: 'name', label: '이름', hint: '', maxlength: 20, value: p.name },
        { key: 'basic', label: '기본 정보', hint: '나이·직업·외모·성격 등', multiline: true, value: joinBlocks(p.basic, p.appearance && `외모: ${p.appearance}`, p.personality && `성격: ${p.personality}`) },
        { key: 'prompt', label: '커스텀 프롬프트', hint: '캐릭터 설정 + 관계 + 세계관', multiline: true, value: joinBlocks(p.body, p.relBlock, p.world && `[세계관]\n${p.world}`) },
        { key: 'first', label: '첫 인사 / 첫 만남', hint: '대화 시작 장면', multiline: true, value: p.first },
        { key: 'example', label: '대화 예시', hint: 'Q/A 형식', multiline: true, value: p.example },
        { key: 'lang', label: '작성 언어', hint: '', maxlength: 10, value: '한국어' },
      ]
    },
  },
]

export function getPlatform(id) {
  return PLATFORMS.find((p) => p.id === id)
}
