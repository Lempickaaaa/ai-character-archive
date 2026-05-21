// 플랫폼별 입력 요소 현황 매칭 정의 (기본 매핑)
// 내보내기 고급설정에서 수정하는 매핑의 기본값이다.
// target: { key, target(라벨), sources:[소스id], maxlength?, multiline?, hint? }

// 입력 요소(소스) — 앱의 실제 입력 항목 기준
export const SOURCE_FIELDS = [
  { id: 'projectTitle', label: '기본설정 · 제목', group: '기본설정' },
  { id: 'projectIntro', label: '기본설정 · 설명', group: '기본설정' },
  { id: 'mainName', label: '캐릭터(주 캐릭터) · 이름', group: '캐릭터' },
  { id: 'mainDesc', label: '캐릭터(주 캐릭터) · 설명', group: '캐릭터' },
  { id: 'userName', label: '유저 캐릭터 · 이름', group: '유저 캐릭터' },
  { id: 'userDesc', label: '유저 캐릭터 · 설명', group: '유저 캐릭터' },
  { id: 'coverShort', label: '커버 · 짧은 소개', group: '커버' },
  { id: 'situationExample', label: '상황예시', group: '도입부' },
  { id: 'name', label: '기본설정 · 이름', group: '기본설정' },
  { id: 'gender', label: '기본설정 · 성별', group: '기본설정' },
  { id: 'age', label: '기본설정 · 나이', group: '기본설정' },
  { id: 'charSetting', label: '캐릭터 설정', group: '캐릭터 설정' },
  { id: 'charStory', label: '캐릭터 서사', group: '캐릭터 서사' },
  { id: 'settingNote', label: '설정 노트', group: '설정 노트' },
  { id: 'userProfile', label: '고급설정 · 유저프로필', group: '고급설정' },
  { id: 'userGender', label: '고급설정 · 유저프로필 · 성별', group: '고급설정' },
  { id: 'userAge', label: '고급설정 · 유저프로필 · 나이', group: '고급설정' },
  { id: 'firstScene', label: '첫장면', group: '첫장면' },
  { id: 'openingMessage', label: '오프닝메시지', group: '첫장면' },
  { id: 'charIntroShort', label: '캐릭터 소개 · 한줄 설명', group: '캐릭터 소개' },
  { id: 'charIntroFull', label: '캐릭터 소개 · 캐릭터 소개', group: '캐릭터 소개' },
  { id: 'worldSetting', label: '상세설정 · 세계관', group: '세계관' },
  { id: 'character', label: '상세설정 · 캐릭터', group: '상세설정' },
  { id: 'userProfileName', label: '상세설정 · 유저프로필 · 이름', group: '고급설정' },
  { id: 'userProfileSetting', label: '상세설정 · 유저프로필 · 설정', group: '고급설정' },
  { id: 'introTitle', label: '도입부 · 제목', group: '도입부' },
  { id: 'introContent', label: '도입부 · 내용', group: '도입부' },
  { id: 'introSecret', label: '도입부 · 비밀', group: '도입부' },
  { id: 'characterPrompt', label: '캐릭터 프롬프트', group: '캐릭터' },
  { id: 'characterDetailPast', label: '캐릭터 상세 · 과거', group: '캐릭터' },
  { id: 'keywordBook', label: '키워드북', group: '스토리' },
  { id: 'storyWorld', label: '스토리 · 세계관 설정', group: '스토리' },
]

// 플랫폼별 타깃 입력칸 + 어떤 소스가 들어가는지 (기본값)
export const PLATFORM_TARGETS = {
  zeta: [
    { key: 'title', target: '기본설정 · 제목', sources: ['projectTitle'], maxlength: 50 },
    { key: 'desc', target: '기본설정 · 설명', sources: ['projectIntro'], multiline: true },
    { key: 'mainName', target: '캐릭터(주 캐릭터) · 이름', sources: ['mainName'], maxlength: 20 },
    { key: 'mainDesc', target: '캐릭터(주 캐릭터) · 설명', sources: ['mainDesc'], multiline: true },
    { key: 'userName', target: '유저 캐릭터 · 이름', sources: ['userName'], maxlength: 20 },
    { key: 'userDesc', target: '유저 캐릭터 · 설명', sources: ['userDesc'], multiline: true },
    { key: 'situation', target: '상황예시', sources: ['situationExample'], multiline: true },
    { key: 'cover', target: '커버 · 짧은 소개', sources: ['coverShort'], maxlength: 50 },
    { key: 'lorebook', target: '로어북 (세계관)', sources: ['keywordBook', 'worldSetting'], multiline: true },
  ],
  melting: [
    { key: 'name', target: '기본설정 · 이름', sources: ['name'], maxlength: 20 },
    { key: 'gender', target: '기본설정 · 성별', sources: ['gender'], maxlength: 12 },
    { key: 'age', target: '기본설정 · 나이', sources: ['age'], maxlength: 12 },
    { key: 'charSetting', target: '캐릭터 설정', sources: ['charSetting'], multiline: true },
    { key: 'charStory', target: '캐릭터 서사', sources: ['charStory'], multiline: true },
    { key: 'settingNote', target: '설정 노트', sources: ['settingNote'], multiline: true },
    { key: 'userName', target: '고급설정-유저프로필 · 이름', sources: ['userProfileName'], maxlength: 20 },
    { key: 'userGender', target: '고급설정-유저프로필 · 성별', sources: ['userGender'], maxlength: 12 },
    { key: 'userAge', target: '고급설정-유저프로필 · 나이', sources: ['userAge'], maxlength: 12 },
    { key: 'userDesc', target: '고급설정-유저프로필 · 설명', sources: ['userProfileSetting'], multiline: true },
    { key: 'opening', target: '첫장면 · 오프닝메시지', sources: ['openingMessage'], multiline: true },
    { key: 'introShort', target: '캐릭터 소개 · 한줄 설명', sources: ['charIntroShort'], maxlength: 50 },
    { key: 'introFull', target: '캐릭터 소개 · 캐릭터 소개', sources: ['charIntroFull'], multiline: true },
  ],
  bloom: [
    { key: 'name', target: '기본설정(캐릭터) · 이름', sources: ['mainName'], maxlength: 20 },
    { key: 'gender', target: '기본설정(캐릭터) · 성별', sources: ['gender'], maxlength: 12 },
    { key: 'age', target: '기본설정(캐릭터) · 나이', sources: ['age'], maxlength: 12 },
    { key: 'introShort', target: '기본설정(캐릭터) · 한줄소개', sources: ['charIntroShort'], maxlength: 50 },
    { key: 'introFull', target: '기본설정(캐릭터) · 소개', sources: ['charIntroFull'], multiline: true },
    { key: 'world', target: '상세설정 · 세계관', sources: ['worldSetting'], multiline: true },
    { key: 'character', target: '상세설정 · 캐릭터', sources: ['character'], multiline: true },
    { key: 'userName', target: '상세설정 · 유저프로필 · 이름', sources: ['userProfileName'], maxlength: 20 },
    { key: 'userSetting', target: '상세설정 · 유저프로필 · 설정', sources: ['userProfileSetting'], multiline: true },
    { key: 'firstMeet', target: '도입부 · 첫만남', sources: ['firstScene'], multiline: true },
    { key: 'firstLine', target: '도입부 · 첫대사', sources: ['openingMessage'], multiline: true },
  ],
  caveduck: [
    { key: 'title', target: '도입부 · 제목', sources: ['introTitle'], maxlength: 40 },
    { key: 'content', target: '도입부 · 내용', sources: ['introContent'], multiline: true },
    { key: 'secret', target: '도입부 · 비밀', sources: ['introSecret'], multiline: true },
  ],
  crack: [
    { key: 'name', target: '캐릭터 · 이름', sources: ['mainName'], maxlength: 20 },
    { key: 'introShort', target: '캐릭터 · 한줄 소개', sources: ['charIntroShort'], maxlength: 50 },
    { key: 'intro', target: '캐릭터 · 인트로', sources: ['charIntroFull'], multiline: true },
    { key: 'example', target: '캐릭터 · 예시 대화', sources: ['example'], multiline: true },
    { key: 'prompt', target: '캐릭터 · 캐릭터 프롬프트', sources: ['characterPrompt'], multiline: true },
    { key: 'detail', target: '캐릭터 · 상세(과거)', sources: ['characterDetailPast'], multiline: true },
    { key: 'world', target: '스토리 · 세계관 설정', sources: ['storyWorld', 'worldSetting'], multiline: true },
    { key: 'keywordBook', target: '스토리 · 키워드북', sources: ['keywordBook'], multiline: true },
  ],
}

export const PLATFORM_MAPPING = PLATFORM_TARGETS

export function getPlatformTargets(platformId) {
  return PLATFORM_TARGETS[platformId] || []
}

// 깊은 복사본 (편집용)
export function cloneTargets(platformId) {
  return JSON.parse(JSON.stringify(getPlatformTargets(platformId)))
}
