// 플랫폼별 입력칸 매핑 (웹 조사 기반, 2026-05 기준 / 사이트 내 자유 수정 가능)
// 매핑 규칙:
//   · 관계(relations)  → 캐릭터(주요) 설정 쪽에 포함
//   · 세계관(world)    → 플랫폼의 세계관 슬롯에 포함 (제타는 '로어북'이 세계관에 해당)
//   · 전체 캐릭터       → 주요 1명은 메인 입력칸, 나머지는 플랫폼별 보조 슬롯
//                         (제타=추가 캐릭터 설정 / 블룸=세계관 / 멜팅=환경설정 / 크랙=키워드북 / 케이브덕=커스텀프롬프트)
import { RELATION_TYPES, relationDegreeLabel, BASIC_INFO_FIELDS, ROLES } from './constants.js'
import { getPlatformTargets } from './schema.js'

const roleLabel = (v) => ROLES.find((r) => r.value === v)?.label || ''

// {{user}} = 유저 캐릭터 이름, {{char}} = 주요(초점) 캐릭터 이름 으로 치환
export function replaceTemplates(text, focal, characters = []) {
  if (!text) return text
  const userChar = characters.find((c) => c.role === 'user')
  const userName = userChar?.name || '유저'
  const charName = focal?.name || '캐릭터'
  return text.replace(/\{\{\s*user\s*\}\}/g, userName).replace(/\{\{\s*char\s*\}\}/g, charName)
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

// 그룹 안에 유효한 키워드-값 쌍이 있는지
function groupHasContent(e) {
  return e.groupName || (e.items || []).some((i) => i.keyword || i.value)
}

// 세계관: 개요 + 키워드 그룹
export function worldText(world) {
  if (!world) return ''
  const parts = []
  if (world.overview) parts.push(world.overview.trim())
  ;(world.elements || []).filter(groupHasContent).forEach((g) => {
    parts.push(worldGroupText(g))
  })
  return parts.join('\n\n')
}

// 단일 키워드 그룹 묶음 (제타 로어북 형식)
//   ■ 그룹명
//   키워드: kw1, kw2, kw3 ...        ← 키워드 나열
//   kw1: 설명1                        ← 키워드별 설명
//   kw2: 설명2
export function worldGroupText(g) {
  const items = (g.items || []).filter((i) => i.keyword || i.value)
  const lines = [`■ ${g.groupName || '키워드 그룹'}`]
  const kws = items.map((i) => i.keyword).filter(Boolean)
  if (kws.length) lines.push(`키워드: ${kws.join(', ')}`)
  items.forEach((i) => {
    if (i.keyword || i.value) lines.push(`${i.keyword || '?'}: ${i.value || ''}`)
  })
  return lines.join('\n')
}

function buildZetaLoreGroupTitle(g) {
  return g.groupName || '키워드 그룹'
}

function buildZetaLoreGroupKeywords(g) {
  const items = (g.items || []).filter((i) => i.keyword || i.value)
  const kws = items.map((i) => i.keyword).filter(Boolean).slice(0, 5)
  return kws.length ? kws.join(', ') : ''
}

function buildZetaLoreGroupDescriptions(g) {
  const items = (g.items || []).filter((i) => i.keyword || i.value).slice(0, 5)
  return items.map((i) => `${i.keyword || '?'}: ${i.value || ''}`).join('\n')
}

function buildZetaLoreGroupBundle(g) {
  const title = buildZetaLoreGroupTitle(g)
  const keywords = buildZetaLoreGroupKeywords(g)
  const descriptions = buildZetaLoreGroupDescriptions(g)
  return {
    title,
    keywords,
    descriptions,
    combined: [
      `■ ${title}`,
      keywords ? `키워드: ${keywords}` : '',
      descriptions,
    ].filter(Boolean).join('\n'),
  }
}

// Zeta-specific lorebook formatting
export function buildZetaLore(world) {
  if (!world) return ''
  const parts = []
  if (world.overview) parts.push(world.overview.trim())
  ;(world.elements || []).filter(groupHasContent).forEach((g) => {
    parts.push([
      `■ ${buildZetaLoreGroupTitle(g)}`,
      `키워드: ${buildZetaLoreGroupKeywords(g)}`,
      buildZetaLoreGroupDescriptions(g),
    ].filter(Boolean).join('\n'))
  })
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

// 보조(주요 1명 외) 캐릭터 한 명 블록
function charBlock(c) {
  const head = `● ${c.name || '(이름 없음)'}${c.role ? ` (${roleLabel(c.role)})` : ''}`
  return [head, basicInfoText(c), characterBody(c)].filter(Boolean).join('\n')
}

function clip(text, max) {
  if (!max || !text) return text || ''
  return text.length > max ? text.slice(0, max) : text
}

function joinBlocks(...blocks) {
  return blocks.filter(Boolean).join('\n\n')
}

function orderFields(platformId, fields) {
  const targets = getPlatformTargets(platformId)
  const targetOrder = new Map(targets.map((target, index) => [target.key, index]))
  const matched = []
  const extras = []

  fields.forEach((field) => {
    if (targetOrder.has(field.key)) matched.push(field)
    else extras.push(field)
  })

  matched.sort((a, b) => targetOrder.get(a.key) - targetOrder.get(b.key))
  return [...matched, ...extras]
}

// ctx = { project, characters, relations, world, focal }
function ctxParts(ctx) {
  const { focal, characters = [], relations = [], world, project } = ctx
  const rel = relationsText(null, relations, characters)
  const supporting = characters.filter((c) => c.id !== focal?.id)
  const supportingText = supporting.map(charBlock).join('\n\n')
  return {
    name: focal?.name || '',
    basic: basicInfoText(focal),
    body: characterBody(focal),
    world: worldText(world),
    rel,
    relBlock: rel ? `[관계]\n${rel}` : '',
    intro: (project?.intro || '').trim(),
    speech: focal?.speech || '',
    personality: focal?.personality || focal?.summary || '',
    appearance: focal?.appearance || '',
    past: focal?.past || '',
    first: (focal?.firstMeeting || '').trim(),
    example: (focal?.exampleDialogue || '').trim(),
    supporting,
    supportingBlock: supportingText ? `[등장 인물]\n${supportingText}` : '',
  }
}

export const PLATFORMS = [
  {
    id: 'zeta',
    name: '제타',
    nameEn: 'zeta',
    emoji: '🪐',
    color: '#7c6cf0',
    note: '주요 캐릭터 외 인물은 추가 캐릭터 설정으로 분리됩니다. 세계관은 로어북(그룹명/키워드5개/설명)에 들어갑니다.',
    docUrl: 'https://zeta-ai.io',
    build(ctx) {
      const p = ctxParts(ctx)
      const fields = [
        { key: 'name', label: '이름', hint: '캐릭터 이름', maxlength: 20, value: p.name },
        { key: 'oneline', label: '한 줄 소개', hint: '캐릭터를 한 문장으로', maxlength: 50, value: p.intro.split('\n')[0] || '' },
        { key: 'setting', label: '캐릭터 설명', hint: '기본정보·성격·외모·과거·특징·말버릇 + 관계', multiline: true, value: joinBlocks(p.basic && `[기본정보]\n${p.basic}`, p.body, p.relBlock) },
        { key: 'first', label: '첫 상황 (도입부)', hint: '대화가 시작되는 첫 장면', multiline: true, value: p.first },
        { key: 'example', label: '예시 대화', hint: '말투를 보여주는 예시 대화', multiline: true, value: p.example },
        { key: 'lorebook', label: '로어북 (세계관)', hint: '그룹명 / 키워드(최대 5개) / 설명 — 5개 초과 시 그룹을 나눠 작성하세요', multiline: true, value: buildZetaLore(ctx.world) },
      ]
      // 제타만: 추가 캐릭터 설정 (보조 캐릭터별 분리)
      p.supporting.forEach((c) => {
        fields.push({ key: `extra_${c.id}`, label: `추가 캐릭터 설정 · ${c.name || '(이름 없음)'}`, hint: '제타는 추가 캐릭터를 별도로 설정할 수 있어요', multiline: true, value: charBlock(c) })
      })
      return orderFields('zeta', fields)
    },
  },
  {
    id: 'bloom',
    name: '블룸',
    nameEn: 'bloom',
    emoji: '🌷',
    color: '#f48ab0',
    note: '주요 캐릭터 외 인물은 세계관에 함께 작성됩니다. 관계는 프롬프트(페르소나)에 포함.',
    docUrl: 'https://bloom-ai.me',
    build(ctx) {
      const p = ctxParts(ctx)
      return orderFields('bloom', [
        { key: 'name', label: '캐릭터 이름', hint: '', maxlength: 20, value: p.name },
        { key: 'info', label: '캐릭터 정보', hint: '나이·직업 등 기본 프로필', multiline: true, value: joinBlocks(p.basic, p.appearance && `외모: ${p.appearance}`) },
        { key: 'prompt', label: '프롬프트 (페르소나)', hint: '성격·말투 지시 + 관계', multiline: true, value: joinBlocks(p.body, p.speech && `(말투: ${p.speech})`, p.relBlock) },
        { key: 'world', label: '세계관', hint: '세계관 + 그 외 등장 인물', multiline: true, value: joinBlocks(p.world, p.supportingBlock) },
        { key: 'first', label: '첫 메시지 (도입부)', hint: '대화 시작 첫 메시지', multiline: true, value: p.first },
        { key: 'example', label: '예시 대화', hint: 'Q/A 형식 예시 대화', multiline: true, value: p.example },
      ])
    },
  },
  {
    id: 'melting',
    name: '멜팅',
    nameEn: 'melting',
    emoji: '🍮',
    color: '#f0a868',
    note: '글자수 제한: 캐릭터 소개 2,500 · 환경 설정 2,000 · 도입부 1,200 · 서사 700 · 설정노트 400(최대 20). 그 외 인물은 환경 설정에 포함.',
    docUrl: 'https://melting.chat',
    build(ctx) {
      const p = ctxParts(ctx)
      const notes = (ctx.world?.elements || [])
        .filter(groupHasContent)
        .slice(0, 20)
        .map((e, i) => ({
          key: `note${i}`,
          label: `설정노트 ${i + 1}`,
          hint: `${e.groupName || '그룹'}`,
          maxlength: 400,
          value: clip(worldGroupText(e), 400),
        }))
      return orderFields('melting', [
        { key: 'name', label: '캐릭터 이름', hint: '', maxlength: 20, value: p.name },
        { key: 'intro', label: '캐릭터 소개', hint: '기본정보·성격·외모·특징 + 관계', maxlength: 2500, multiline: true, value: clip(joinBlocks(p.basic && `[기본정보]\n${p.basic}`, p.body, p.relBlock), 2500) },
        { key: 'env', label: '환경 설정 (세계관)', hint: '세계관 개요 + 그 외 등장 인물', maxlength: 2000, multiline: true, value: clip(joinBlocks(ctx.world?.overview || '', p.supportingBlock), 2000) },
        { key: 'narrative', label: '서사', hint: '과거/배경 서사', maxlength: 700, multiline: true, value: clip(p.past, 700) },
        { key: 'opening', label: '도입부', hint: '첫 장면', maxlength: 1200, multiline: true, value: clip(p.first, 1200) },
        ...notes,
      ])
    },
  },
  {
    id: 'crack',
    name: '크랙',
    nameEn: 'crack',
    emoji: '⚡',
    color: '#5bc7b0',
    note: '제작 6단계. 그 외 인물은 키워드북에 포함. 관계는 캐릭터 설정에 포함.',
    docUrl: 'https://crack.wrtn.ai',
    build(ctx) {
      const p = ctxParts(ctx)
      return orderFields('crack', [
        { key: 'name', label: '프로필 · 이름', hint: '', maxlength: 20, value: p.name },
        { key: 'oneline', label: '프로필 · 한 줄 소개', hint: '', maxlength: 50, value: p.intro.split('\n')[0] || '' },
        { key: 'setting', label: '캐릭터 설정', hint: '기본정보·성격·말투·특징 + 관계', multiline: true, value: joinBlocks(p.basic && `[기본정보]\n${p.basic}`, p.body, p.relBlock) },
        { key: 'start', label: '시작 설정 (첫 인사말/장면)', hint: '대화 시작 장면', multiline: true, value: p.first },
        { key: 'example', label: '예시 대화', hint: '예시 대화 (선택)', multiline: true, value: p.example },
        { key: 'keywordbook', label: '키워드북 (세계관)', hint: '세계관 + 그 외 등장 인물', multiline: true, value: joinBlocks(p.world, p.supportingBlock) },
      ])
    },
  },
  {
    id: 'caveduck',
    name: '케이브덕',
    nameEn: 'caveduck',
    emoji: '🦆',
    color: '#6aa6e8',
    note: '별도 세계관 칸이 없어 세계관·관계·그 외 인물을 커스텀 프롬프트에 함께 넣습니다.',
    docUrl: 'https://caveduck.ai',
    build(ctx) {
      const p = ctxParts(ctx)
      return orderFields('caveduck', [
        { key: 'name', label: '이름', hint: '', maxlength: 20, value: p.name },
        { key: 'basic', label: '기본 정보', hint: '나이·직업·외모·성격 등', multiline: true, value: joinBlocks(p.basic, p.appearance && `외모: ${p.appearance}`, p.personality && `성격: ${p.personality}`) },
        { key: 'prompt', label: '커스텀 프롬프트', hint: '캐릭터 설정 + 관계 + 세계관 + 그 외 인물', multiline: true, value: joinBlocks(p.body, p.relBlock, p.world && `[세계관]\n${p.world}`, p.supportingBlock) },
        { key: 'first', label: '첫 인사 / 첫 만남', hint: '대화 시작 장면', multiline: true, value: p.first },
        { key: 'example', label: '대화 예시', hint: 'Q/A 형식', multiline: true, value: p.example },
        { key: 'lang', label: '작성 언어', hint: '', maxlength: 10, value: '한국어' },
      ])
    },
  },
]

// ---- 매핑 기반 내보내기 (사용자 커스텀 매핑 반영) --------------------------
function exportParts(ctx) {
  const { project, characters = [], relations = [], world } = ctx
  const main = characters.find((c) => c.role === 'main') || characters[0] || null
  const user = characters.find((c) => c.role === 'user') || null
  const supporting = characters.filter((c) => c.id !== main?.id && c.id !== user?.id)
  const groups = (world?.elements || []).filter(groupHasContent)
  const projectTitle = (project?.name || '').trim()
  const projectIntro = (project?.intro || '').trim()
  const mainBasic = basicInfoText(main)
  const userBasic = basicInfoText(user)
  const mainRelations = main ? relationsText(main.id, relations, characters) : relationsText(null, relations, characters)
  const userRelations = user ? relationsText(user.id, relations, characters) : ''
  const worldGroups = groups.map(worldGroupText).join('\n\n')
  const worldSetting = joinBlocks((world?.overview || '').trim(), worldGroups)
  const mainDesc = joinBlocks(mainBasic && `[기본정보]\n${mainBasic}`, characterBody(main), mainRelations ? `[관계]\n${mainRelations}` : '')
  const characterPrompt = joinBlocks(characterBody(main), mainRelations ? `[관계]\n${mainRelations}` : '')
  const characterDetailPast = (main?.past || '').trim()
  const userProfile = joinBlocks(userBasic && `[기본정보]\n${userBasic}`, user?.summary ? `[설정]\n${user.summary.trim()}` : '', userRelations ? `[관계]\n${userRelations}` : '')
  const charIntroShort = projectIntro.split('\n')[0] || main?.summary || main?.name || ''
  const charIntroFull = joinBlocks(projectIntro, mainDesc)
  const situationExample = joinBlocks(main?.firstMeeting || '', main?.exampleDialogue || '')
  const introTitle = projectTitle
  const introContent = joinBlocks(projectIntro, mainDesc, worldSetting)
  const introSecret = joinBlocks(userProfile, supporting.length ? `[등장 인물]\n${supporting.map(charBlock).join('\n\n')}` : '')
  const settingNote = worldGroups

  return {
    projectTitle,
    projectIntro,
    mainName: main?.name || '',
    mainDesc,
    userName: user?.name || '',
    userDesc: userProfile,
    coverShort: charIntroShort,
    situationExample,
    name: main?.name || '',
    gender: main?.basic?.gender || '',
    age: main?.basic?.age || '',
    charSetting: mainDesc,
    charStory: characterDetailPast,
    settingNote,
    userProfile,
    userProfileName: user?.name || '',
    userProfileSetting: userProfile,
    userGender: user?.basic?.gender || '',
    userAge: user?.basic?.age || '',
    firstScene: main?.firstMeeting || '',
    openingMessage: main?.firstMeeting || (main?.exampleDialogue || '').split('\n').find(Boolean) || '',
    charIntroShort,
    charIntroFull,
    worldSetting,
    character: mainDesc,
    introTitle,
    introContent,
    introSecret,
    characterPrompt,
    characterDetailPast,
    keywordBook: worldGroups,
    storyWorld: worldSetting,
    example: main?.exampleDialogue || '',
  }
}

// 외부에서 소스별 현재 값을 얻도록 노출
export function getExportParts(ctx) {
  return exportParts(ctx)
}

function renderSource(id, P) {
  switch (id) {
    case 'projectTitle': return P.projectTitle
    case 'projectIntro': return P.projectIntro
    case 'mainName': return P.mainName
    case 'mainDesc': return P.mainDesc
    case 'userName': return P.userName
    case 'userDesc': return P.userDesc
    case 'coverShort': return P.coverShort
    case 'situationExample': return P.situationExample
    case 'name': return P.name
    case 'gender': return P.gender
    case 'age': return P.age
    case 'charSetting': return P.charSetting
    case 'charStory': return P.charStory
    case 'settingNote': return P.settingNote
    case 'userProfile': return P.userProfile
    case 'userProfileName': return P.userProfileName
    case 'userProfileSetting': return P.userProfileSetting
    case 'userGender': return P.userGender || ''
    case 'userAge': return P.userAge || ''
    case 'firstScene': return P.firstScene
    case 'openingMessage': return P.openingMessage
    case 'charIntroShort': return P.charIntroShort
    case 'charIntroFull': return P.charIntroFull
    case 'worldSetting': return P.worldSetting
    case 'character': return P.character
    case 'introTitle': return P.introTitle
    case 'introContent': return P.introContent
    case 'introSecret': return P.introSecret
    case 'characterPrompt': return P.characterPrompt
    case 'characterDetailPast': return P.characterDetailPast
    case 'keywordBook': return P.keywordBook
    case 'storyWorld': return P.storyWorld
    case 'example': return P.example
    default: return ''
  }
}

function renderFieldValue(target, P) {
  const sources = target.sources || []
  if (target.key === 'settingNote' && sources.includes('settingNote')) {
    return P.settingNote
  }
  const value = sources.map((s) => renderSource(s, P)).filter(Boolean).join('\n\n')
  if (target.key === 'introShort' || target.key === 'cover' || target.key === 'title' || target.key === 'name') {
    return value.split('\n')[0] || value
  }
  return value
}

// platform: PLATFORMS 항목, ctx: { project, characters, relations, world }
// targets: 사용자 커스텀 매핑 배열(없으면 기본 매핑 사용)
export function buildExportFields(platform, ctx, targets) {
  const defaultTargets = getPlatformTargets(platform.id)
  const customTargets = targets && targets.length ? targets : null
  const T = customTargets
    ? [
        ...defaultTargets.map((target) => customTargets.find((item) => item.key === target.key) || target),
        ...customTargets.filter((item) => !defaultTargets.some((target) => target.key === item.key)),
      ]
    : defaultTargets
  const P = exportParts(ctx)
  const out = []
  T.forEach((t) => {
    if (platform.id === 'melting' && t.key === 'settingNote' && (t.sources || []).length) {
      const groups = (ctx.world?.elements || []).filter(groupHasContent)
      groups.slice(0, 20).forEach((g, i) => {
        out.push({
          key: `${t.key}_${i}`,
          label: `${t.target} ${i + 1}`,
          hint: g.groupName || '그룹',
          maxlength: t.maxlength || 40,
          multiline: true,
          value: clip(worldGroupText(g), t.maxlength || 40),
        })
      })
      return
    }
    if (platform.id === 'zeta' && t.key === 'lorebook') {
      const overview = (ctx.world?.overview || '').trim()
      if (overview) {
        out.push({
          key: `${t.key}_overview`,
          label: `${t.target} · 개요`,
          hint: '세계관 개요',
          maxlength: t.maxlength,
          multiline: true,
          value: overview,
        })
      }
      ;(ctx.world?.elements || []).filter(groupHasContent).forEach((g, i) => {
        const bundle = buildZetaLoreGroupBundle(g)
        out.push(
          {
            key: `${t.key}_${i}`,
            label: `${t.target} · ${bundle.title}`,
            hint: '한 묶음으로 보이는 로어북 그룹',
            maxlength: t.maxlength,
            multiline: true,
            bundle,
            value: bundle.combined,
          },
        )
      })
      return
    }
    let value
    value = renderFieldValue(t, P)
    if (t.maxlength) value = clip(value, t.maxlength)
    const multiline = t.multiline ?? !['name', 'gender', 'age', 'title', 'introShort', 'cover'].includes(t.key)
    out.push({ key: t.key, label: t.target, hint: t.hint || '', maxlength: t.maxlength, multiline, value })
  })
  return out
}

export function getPlatform(id) {
  return PLATFORMS.find((p) => p.id === id)
}
