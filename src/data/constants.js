// 공통 상수 정의

// 캐릭터 역할
export const ROLES = [
  { value: 'main', label: '주요 캐릭터', emoji: '⭐', desc: '글자 수 제한 없이 상세하게 설정합니다.' },
  { value: 'sub', label: '주변 캐릭터', emoji: '🌸', desc: '설정 500자 제한' },
  { value: 'user', label: '유저 캐릭터', emoji: '🙋', desc: '설정 500자 제한 · 내가 연기할 캐릭터' },
]

export const NON_MAIN_LIMIT = 500
export const INTRO_LIMIT = 500

// 캐릭터 기본정보 항목 (모든 역할 공통)
export const BASIC_INFO_FIELDS = [
  { key: 'age', label: '나이', placeholder: '17세 / 불명' },
  { key: 'gender', label: '성별', placeholder: '여 / 남 / 기타' },
  { key: 'job', label: '직업', placeholder: '마법사, 학생…' },
  { key: 'species', label: '종족/출신', placeholder: '엘프, 인간…' },
  { key: 'height', label: '키', placeholder: '160cm' },
  { key: 'birthday', label: '생일', placeholder: '3월 14일' },
  { key: 'affiliation', label: '소속', placeholder: '왕립학원…' },
  { key: 'mbti', label: 'MBTI', placeholder: 'INFP' },
]

// 관계 유형 (드롭다운)
export const RELATION_TYPES = [
  '연인', '짝사랑', '첫사랑', '약혼/부부',
  '친구', '소꿉친구', '동료', '동급생',
  '가족', '형제자매', '부모-자식', '친척',
  '스승-제자', '선후배', '상사-부하',
  '라이벌', '앙숙', '적대', '원수',
  '주종', '계약관계', '협력자', '거래상대',
  '낯선 사이', '기타',
]

// 관계 시 감정 유형 (방향성: from → to 가 느끼는 감정)
export const EMOTION_TYPES = [
  '호감', '애정', '사랑', '신뢰', '존경', '동경',
  '우정', '연민', '보호욕', '의존', '집착', '그리움',
  '질투', '경쟁심', '열등감', '경계', '불신', '두려움',
  '분노', '적개심', '증오', '죄책감', '미안함', '무관심', '복잡미묘',
]

// 관계 정도 슬라이더 라벨 (0~100)
export function relationDegreeLabel(v) {
  if (v <= 15) return '매우 약함'
  if (v <= 35) return '약함'
  if (v <= 65) return '보통'
  if (v <= 85) return '강함'
  return '매우 강함'
}

// 세계관 키워드 그룹 추천 (그룹명 placeholder 용)
export const WORLD_ELEMENT_SUGGESTIONS = [
  '시대/배경', '장소', '주요 세력', '마법/기술 체계',
  '종족', '계급/신분', '경제', '종교/신앙',
  '주요 사건', '규칙/금기', '분위기', '용어',
]

// 제타 로어북 기준: 키워드 그룹당 최대 5개
export const WORLD_KEYWORDS_MAX = 5

// 템플릿 태그
export const TEMPLATE_TAGS = [
  { tag: '{{user}}', label: '유저 캐릭터', desc: '자동으로 "(유저)"로 표시됨' },
  { tag: '{{char}}', label: '주요 캐릭터', desc: '선택한 캐릭터의 이름으로 자동 변환됨' },
]
