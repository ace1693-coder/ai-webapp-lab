# AI Webapp Lab

React + TypeScript + Vite로 만든 **할 일 관리(To-Do) 테스트 웹앱**입니다.
로그인·서버·DB·API 키 없이 브라우저 `localStorage`에만 데이터를 저장하며, 새로고침해도 목록이 유지됩니다.

- 저장소: 비공개 GitHub 저장소 `ai-webapp-lab`
- 작업 브랜치: `feat/ai-webapp-lab`
- 라이브 데모: 없음(정적 호스팅 미배포). 아래 실행 방법으로 로컬에서 확인합니다.

## 기능

| 기능 | 동작 |
| --- | --- |
| 할 일 등록 | 입력 후 `Enter` 또는 `추가` 버튼. 최신 항목이 맨 위에 표시 |
| 입력 검증 | 빈 값·공백만 입력하면 등록하지 않고 오류 문구 표시. 앞뒤/연속 공백은 정리, 최대 120자 |
| 할 일 수정 | `수정` 버튼 또는 제목 클릭 → 인라인 편집. `저장`/`Enter`로 저장, `취소`/`Esc`로 되돌림. 빈 값 저장 불가 |
| 완료 처리 | 체크박스로 완료/해제 토글(취소선 표시), 진행 중·완료 개수 실시간 표시 |
| 삭제 | 항목별 `삭제` 버튼, `완료 항목 지우기`로 완료된 것만 일괄 삭제 |
| 새로고침 후 유지 | 모든 변경을 `localStorage`에 즉시 저장, 다시 열면 그대로 복원 |
| 필터 | 전체 / 진행 중 / 완료 |
| 저장소 손상 대응 | 저장값이 깨졌거나 형식이 틀리면 앱이 죽지 않고 걸러 내거나 빈 목록으로 시작 |

데이터는 `localStorage` 키 `ai-webapp-lab.todos.v1`에 `Todo[]` JSON으로 저장됩니다.

```ts
interface Todo {
  id: string;
  title: string;
  done: boolean;
  createdAt: number;
  updatedAt: number;
}
```

## 기술 스택

- React 18.3 (함수형 컴포넌트 + 훅)
- TypeScript 5.6 (`strict`, `noUncheckedIndexedAccess`, `noUnusedLocals` 등 엄격 모드)
- Vite 5.4 (개발 서버·프로덕션 빌드)
- Vitest 2.1 + @testing-library/react (jsdom 환경 자동화 테스트)
- Playwright(선택) — 실제 Chromium으로 프로덕션 빌드를 검증하는 E2E 스크립트

## 실행 방법

Node.js 20 이상이 필요합니다.

```bash
npm install         # 의존성 설치
npm run dev         # 개발 서버 (http://127.0.0.1:5173)
npm run build       # 타입 검사 + 프로덕션 빌드 → dist/
npm run preview     # 빌드 결과 미리보기 (http://127.0.0.1:4173)
npm test            # 자동화 테스트 1회 실행
npm run test:watch  # 워치 모드
npm run typecheck   # 타입 검사만
```

### 브라우저 E2E 검증(선택)

`npm run build` 후, 프로덕션 빌드를 실제 Chromium으로 열어 등록·수정·완료·삭제·새로고침 유지까지 확인합니다.
Playwright는 이 저장소의 의존성에 포함하지 않았으므로 필요할 때만 설치합니다.

```bash
npm i -D playwright
npx playwright install chromium
npm run build
node e2e/browser-check.mjs   # 성공 시 e2e/screenshots/*.png 캡처
```

## 프로젝트 구조

```
ai-webapp-lab/
├── index.html                 # 진입 HTML (#root, lang="ko")
├── vite.config.ts             # Vite + Vitest 설정 (jsdom, setup 파일)
├── tsconfig.json              # 엄격한 TS 설정
├── src/
│   ├── main.tsx               # React 루트 렌더링 (StrictMode)
│   ├── App.tsx                # 화면 구성·필터·상태 요약
│   ├── types.ts               # Todo, TodoFilter 타입
│   ├── styles.css             # 다크 테마 스타일
│   ├── hooks/useTodos.ts      # 추가·수정·토글·삭제·저장 로직 (핵심)
│   ├── lib/storage.ts         # localStorage 읽기/쓰기·검증·복구 (핵심)
│   ├── components/
│   │   ├── TodoForm.tsx       # 등록 폼 + 빈 입력 검증
│   │   └── TodoItem.tsx       # 항목 1개: 토글·인라인 수정·삭제
│   ├── test/setup.ts          # 테스트 초기화 (jest-dom, cleanup)
│   └── __tests__/App.test.tsx # 자동화 테스트 14개
└── e2e/browser-check.mjs      # 실제 브라우저 검증 스크립트(선택)
```

## 테스트 결과

`npm test` — **14개 전부 통과** (Vitest 2.1.9 / jsdom)

- 할 일 등록 시 목록·localStorage 저장
- 여러 건 등록 시 최신 항목이 위에 오는 순서
- 빈 값·공백만 입력 시 등록 차단 + 오류 문구
- 앞뒤/연속 공백 정리
- 수정 반영(목록 + localStorage)
- 수정 저장 `Enter` / 취소 `Esc`
- 수정 값이 비었을 때 저장 차단
- 완료 토글 및 저장, 해제
- 삭제 반영(목록 + localStorage)
- **새로고침(재마운트) 후 등록·수정·완료 상태 유지**
- 전체/진행 중/완료 필터
- 완료 항목 일괄 지우기
- 깨진 localStorage 값 복구
- 형식이 잘못된 항목만 걸러 내고 정상 항목 복구

`node e2e/browser-check.mjs` — 실제 Chromium(프로덕션 빌드) 9개 항목 통과
최초 로드 → 등록 2건 → 빈 입력 차단 → 수정 → 완료 토글 → **새로고침 후 유지(localStorage 2건, 완료 상태 유지)** → 필터 → 삭제 후 새로고침에도 삭제 유지 → 콘솔 오류 0건

## 보안·개인정보

- API 키, 비밀번호, 토큰, 개인정보를 코드·설정에 포함하지 않았습니다.
- 네트워크 요청 없음: 외부 서버로 데이터를 보내지 않고, 모든 데이터는 사용자 브라우저에만 남습니다.
- `.env` 계열 파일과 인증서·키 파일은 `.gitignore`로 커밋을 차단합니다.
- `localStorage`는 같은 브라우저·같은 출처에서만 읽히는 클라이언트 저장소이므로, 민감한 정보(비밀번호 등) 저장 용도로는 쓰지 마세요.

## 알려진 제한

- 데이터는 브라우저 단위라서 기기·브라우저 간 동기화가 없고, 시크릿 모드나 사이트 데이터 삭제 시 사라집니다.
- 다중 사용자·권한·서버 백업은 지원하지 않습니다(테스트 웹앱 범위).
