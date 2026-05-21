# 캐릭터 아카이브 (ai-character-archive)

💫 제타 · 블룸 · 멜팅 · 크랙 · 케이브덕 등 AI 캐릭터챗 유저를 위한 **설정 관리 + 플랫폼별 내보내기** 도구.

캐릭터와 세계관을 한 번 정리하면, 각 플랫폼의 입력칸에 맞춰 바로 복붙할 수 있어요.

## 주요 기능

- **프로젝트 관리** — 여러 세계관/작품을 프로젝트 단위로 관리 (브라우저 자동 저장)
- **캐릭터 설정** — 주요/주변/유저 캐릭터 구분, 성격·외모·과거·특징·말버릇·이벤트 트리거 (주변/유저는 500자 제한)
- **캐릭터 관계성** — `캐릭터 →[관계 유형 · 정도]→ 캐릭터` 형식, 드롭다운 + 슬라이더 입력
- **세계관 설정** — 기본 개요 + 키워드-값 형식의 주요 요소
- **소개글** — 프로젝트 소개 (500자)
- **플랫폼별 내보내기** — 캐릭터/세계관을 5개 플랫폼 입력칸에 자동 배치, 칸별 복사·수정
- **JSON 내보내기** — JSON, Markdown, HTML 형식으로 프로젝트 내보내기 (백업·공유)

## 기술 스택

- Vite + Vue 3 (Composition API)
- Vue Router (페이지별 라우팅)
- 상태 저장: `localStorage` (브라우저 캐시)
- 배포: Vercel

## 로컬 실행

```bash
npm install
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드 (dist/)
npm run preview  # 빌드 결과 미리보기
```

## Vercel 배포

이 저장소를 Vercel에 연결하면 됩니다. SPA 라우팅을 위한 `vercel.json`이 포함되어 있어요.

- Framework Preset: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`

CLI로 배포하려면:

```bash
npm i -g vercel
vercel          # 미리보기 배포
vercel --prod   # 프로덕션 배포
```

## 플랫폼 입력 항목 매핑

각 플랫폼의 캐릭터 생성 입력칸은 `src/data/platforms.js`에 하드코딩되어 있으며(2026-05 기준 웹 조사),
내보내기 화면에서 값은 언제든 직접 수정할 수 있습니다. 플랫폼 UI가 바뀌면 이 파일만 수정하면 됩니다.

## 개발자 전용 피드백 수집

피드백 칸은 공개 댓글이 아니라 개발자에게만 전달되는 비공개 입력입니다. 무료 외부 서비스는 Formspree만 사용하면 충분합니다.
앱은 `time` 과 `message` 만 전송하며, 이메일·연락처 같은 추가 입력은 받지 않습니다.

```javascript
{
	"time": "2026-05-21T12:34:56.789Z",
	"message": "좋아요. 댓글처럼 간단해서 좋네요."
}
```

설정 순서:

1. 프로젝트의 `.env` 파일에 다음 한 줄만 추가하세요:
   ```
   VITE_FEEDBACK_WEBHOOK_URL=https://formspree.io/f/xeedabwv
   ```
2. 앱을 다시 실행하면 피드백 입력값이 Formspree로 전송됩니다.

추천:

- 가장 단순한 방식은 Formspree의 폼 엔드포인트를 `VITE_FEEDBACK_WEBHOOK_URL`에 넣는 것입니다.
- 제출자는 로그인할 필요가 없고, 개발자만 응답을 확인합니다.
- 폼에는 이메일 입력란을 추가하지 말고, 시간과 메시지만 보내세요.
