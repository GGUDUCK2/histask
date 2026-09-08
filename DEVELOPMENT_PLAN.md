# Histask v0.1 Development Plan

작성일: 2026-09-08 (Asia/Seoul)  
기준 디렉터리: `/Users/taeintyang/Documents/study/histask/histask`  
상태: Batch 1–5 완료 / TASK-001–010 및 TASK-023–026 완료, 이후 Suggested Batch 미착수

## 기준 문서와 계획의 적용 범위

- [PRD.md](PRD.md): 제품 범위와 기능의 Source of Truth.
- [AGENTS.md](AGENTS.md): 기술 규칙, 데이터 안전, 개발·검증 방식의 Source of Truth.
- [DESIGN.md](DESIGN.md): UX, 정보 계층, 시각적 방향의 Source of Truth.
- 이번 사용자 지시를 우선하며 세 문서를 함께 적용한다. 이 계획은 세 문서를 대체하거나 제품 범위를 확장하지 않는다. GitHub, 원격 브랜치, 원격 파일은 분석 근거로 사용하지 않았다.
- 이번 변경은 이 문서뿐이다. 소스 구현, 패키지 설치, 설정 변경, commit/push는 수행하지 않았다. 아래 경로·패키지·명령 추가는 모두 이후 구현 작업이다.

### 문서 간 표현 차이의 적용

| 항목 | 적용할 기준 |
| --- | --- |
| PRD의 dashboard summary cards | 필요한 5개 수치는 유지하되 사용자 지시와 DESIGN §15에 따라 compact metrics row로 구현한다. |
| PRD의 Trello-like Kanban | 4개 상태 열과 이동 동작을 의미한다. DESIGN §16–24의 저소음 보드·카드로 구현한다. |
| Card 정보 순서 | 사용자 지시와 DESIGN §18에 따라 Title → Latest WorkLog → Status/Category/Due/Priority → Tags → 상대 시간/로그 수를 기본으로 한다. |
| Sidebar의 Waiting | 사용자 지시와 DESIGN §13에 따라 Today, All Tasks, In Progress, Waiting, Completed 모두 포함한다. |
| Today 예시의 Created 누락 | PRD §22의 포함 조건을 보존한다. Created Today 보조 섹션을 두어 오늘 생성만 된 카드도 찾을 수 있게 한다. |
| 데이터 안전의 Phase 번호 | 9개 Phase 분류는 유지한다. Phase 8의 구현은 앞당겨, 업무 입력 UI를 연결하기 전에 백업·복원 경로를 완성한다. |

## 현재 로컬 프로젝트 분석

### 디렉터리와 구현 상태

```text
histask/
├── AGENTS.md / PRD.md / DESIGN.md
├── README.md
├── package.json / package-lock.json
├── vite.config.ts
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── .oxlintrc.json / .gitignore
├── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx / App.css / index.css
│   └── assets/  (react.svg, vite.svg, hero.png)
├── public/      (favicon.svg, icons.svg)
├── node_modules/  (설치됨, Git 제외)
├── dist/          (기존 빌드 산출물, Git 제외)
└── .git/
```

분석 시작 시 `DEVELOPMENT_PLAN.md`는 없었으며, Git working tree는 clean이었다. 로컬 Git repository임을 확인했다. 원격 접속이나 fetch는 하지 않았다.

| 점검 대상 | 실제 상태 | 계획에 미치는 영향 |
| --- | --- | --- |
| React source | `main.tsx`는 StrictMode/createRoot. `App.tsx`는 Vite 로고·카운터·외부 문서 링크 템플릿 | 업무 기능 없음. Vite 재생성 없이 TASK-010에서 제품 shell로 교체 |
| CSS | 템플릿용 큰 제목, 중앙 정렬, 1126px root 폭, 장식 이미지·여백. OS dark media query 존재 | Histask theme 구현 완료로 보지 않음. TASK-002에서 디자인 토큰 기반으로 정리 |
| Vite | `plugins: [react()]`만 존재 | React plugin 유지. 필요한 Tailwind/PWA 통합만 추가 |
| TypeScript | 프로젝트 references, noEmit, unused 검사. app은 bundler/react-jsx, node 설정은 nodenext | `strict`는 두 설정에 없고 상속도 없음. TASK-001에서 명시적으로 활성화 |
| Oxlint | react/typescript/oxc plugins, hooks error, only-export-components warn | 그대로 유지. ESLint 전환·전역 규칙 무력화 없음 |
| 테스트 | 저장소 내 test/spec 파일·테스트 설정·test script 없음 | TASK-001에서 Vitest/RTL와 실제 실행 테스트 도입 |
| Tailwind | 직접 의존성·CSS 통합·Vite plugin 없음 | TASK-002에서 추가 |
| shadcn/ui | `components.json`, UI components, alias 없음 | TASK-002에서 필요한 primitives만 설정 |
| 도메인·저장소·라우팅 | types/db/repositories/features/router 모두 없음 | 새로운 경로임을 Task별 명시 |
| PWA | manifest/service worker/plugin 없음 | TASK-027에서 추가 |
| Node | `.nvmrc`, `.node-version`, `.npmrc`, package engines/packageManager 선언 없음 | NVM LTS 사용. 임의 patch pinning을 추가하지 않음 |
| Lockfile | `package-lock.json`, lockfileVersion 3 | npm 유지. pnpm/Yarn/Bun 도입 없음 |
| .gitignore | node_modules, dist, dist-ssr, logs, `*.local`, 일반 editor 파일 제외 | 기존 파일 유지. 실제 업무 백업·비밀정보를 commit하지 않음 |
| README | Vite 기본 설명, Oxlint와 선택적 React Compiler 설명 | TASK-030에서 실제 Histask 사용·운영 설명으로 갱신 |
| 기타 문서 | 루트의 세 기준 문서 외 architecture/database 문서 없음 | 필요한 기술 설명은 README 중심으로 작성, 문서 남발 없음 |

### Dependencies / devDependencies

`package.json` 선언과 현재 `npm ls --depth=0`의 설치 상태를 구분한다.

| 구분 | 패키지 | 선언 | 로컬 설치 |
| --- | --- | --- | --- |
| dependencies | react | ^19.2.8 | 19.2.8 |
| dependencies | react-dom | ^19.2.8 | 19.2.8 |
| devDependencies | @types/node | ^24.13.3 | 24.13.3 |
| devDependencies | @types/react | ^19.2.18 | 19.2.18 |
| devDependencies | @types/react-dom | ^19.2.4 | 19.2.7 |
| devDependencies | @vitejs/plugin-react | ^6.1.0 | 6.1.1 |
| devDependencies | oxlint | ^1.79.0 | 1.82.0 |
| devDependencies | typescript | ~6.0.2 | 6.0.3 |
| devDependencies | vite | ^8.2.2 | 8.2.2 |

아래 패키지는 현재 직접 의존성에 없다. 설치 시 현재 Vite/React/TypeScript/Node와의 peer/engine 호환성을 확인하고 npm lockfile에 반영한다. 이 계획은 아직 확인하지 않은 신규 패키지 버전을 고정하거나 호환성을 단정하지 않는다.

| 시점 | 추가 대상과 목적 |
| --- | --- |
| TASK-001 | 개발 의존성: Vitest, @testing-library/react, @testing-library/dom(필요한 peer), @testing-library/jest-dom, @testing-library/user-event, jsdom, fake-indexeddb. UI와 IndexedDB 테스트 기반 |
| TASK-002 | Tailwind CSS와 호환 Vite 통합 패키지, shadcn 초기화 및 필요한 primitive 의존성, class 결합 유틸, 단일 아이콘 체계(Lucide 우선). shadcn은 필요한 소스 컴포넌트를 관리하는 방식으로 사용 |
| TASK-004 | dexie. 반응형 구독은 Dexie liveQuery를 경계 내부에서 사용하며 React 보조 패키지는 실제 필요할 때만 추가 |
| TASK-010 | React Router의 선택한 호환 버전이 요구하는 라우팅 패키지 |
| TASK-013 | 서로 호환되는 dnd-kit core/sortable/utilities 패키지 |
| TASK-027 | 개발 의존성 vite-plugin-pwa와 필요한 정적 manifest/icon 자산 |

기존 stack 초기화, 전면 upgrade, React Compiler, ESLint, Redux, 중복 UI/날짜 라이브러리를 기본 Task로 만들지 않는다.

### 현재 npm scripts와 실제 검증

| Script | 현재 내용 |
| --- | --- |
| dev | `vite` |
| build | `tsc -b && vite build` |
| lint | `oxlint` |
| preview | `vite preview` |
| test / typecheck | 둘 다 없음 |

2026-09-08 실제 실행 결과:

| 실행 | 결과 |
| --- | --- |
| 기존 `$HOME/.nvm/nvm.sh` 로드 후 `nvm use --lts` | PASS: Node v24.15.0 / npm v11.14.1 |
| `npm ls --depth=0` | PASS: 위 로컬 직접 의존성 확인 |
| `npm run lint` | PASS |
| `npm run build -- --outDir /private/tmp/histask-plan-build-20260908` | PASS: TypeScript build 및 Vite production build. 기존 dist 보존을 위해 임시 경로 사용 |
| `npm run test` | 미실행: script와 테스트 환경 없음 |
| `npm run typecheck` | 미실행: 독립 script 없음. 현재 build의 tsc 단계만 검증됨 |

빌드 경고는 외부 outDir을 자동으로 비우지 않는다는 안내였으며 임시 출력 위치 때문에 발생했다. 삭제 옵션을 강제하지 않았다. 이는 현재 템플릿 검증이며 Histask 제품 기능이 완성되었다는 의미가 아니다.

## 구현 공통 계약

### 범위와 안전

- IndexedDB가 모든 업무 데이터의 primary storage다. Backend, 인증, Cloud DB/Sync, 원격 저장, 업무 데이터 전송, analytics/telemetry/error-reporting SaaS는 없다.
- JSON 파일을 사용자가 로컬에 내보내고 로컬 파일을 읽어 복원하는 경로만 제공한다. 이는 요청된 backup/restore이며 업로드·외부 서비스 연동이 아니다.
- DB 오류·migration 오류에 대한 자동 삭제/reset 금지. 다중 테이블 변경은 transaction으로 처리하고 실패를 UI에 전달한다.
- 복원은 `read → parse → validate → prepare → 사용자 교체 확인 → transactional replace` 순서. transaction 안에서 파일 읽기나 외부 비동기 작업을 하지 않는다.
- 삭제는 확인이 필요하다. Category/Tag 삭제로 Card를 삭제하지 않는다. Card 삭제는 WorkLog/CardTag까지 원자적으로 제거한다. 전체 삭제는 정확한 `DELETE` 입력이 있어야 가능하다.
- 사용자 입력은 일반 텍스트로 렌더링한다. 검색 강조에도 `dangerouslySetInnerHTML`을 사용하지 않는다. 테스트/QA는 가상 업무 데이터만 사용한다. production 자동 seed 없음.

### 데이터·조회 의미: 미명시 세부사항에 대한 계획 기본값

다음은 PRD의 기능을 구현 가능하게 만드는 기본값이다. 이후 바꿀 필요가 있다면 기존 데이터와 관련 테스트 영향을 먼저 확인한다.

| 항목 | 계약 |
| --- | --- |
| Status / Priority | TODO, IN_PROGRESS, WAITING, DONE / NONE, LOW, MEDIUM, HIGH. UI label만 별도 관리 |
| 시간 | createdAt/updatedAt/completedAt/archivedAt는 ISO timestamp. dueDate는 시간을 갖지 않는 ISO 달력 날짜 `YYYY-MM-DD`로 취급하여 UTC 변환으로 하루가 이동하지 않게 함 |
| 오늘 | 사용자 로컬 날짜의 시작 이상, 다음 날짜 시작 미만. 고정 24시간 더하기를 피하고 DST/자정 경계를 테스트 |
| 완료 전환 | DONE 진입 시 completedAt 설정, DONE 유지 편집 시 보존, DONE 이탈 시 해제, 재진입 시 새 완료 시각 |
| 최신 WorkLog | createdAt 내림차순, 동률은 id 기반의 안정된 순서. 과거 로그 편집은 createdAt 순서를 바꾸지 않음. 편집·삭제·import 시 내용/개수/최신 항목 재계산 |
| updatedAt | Card 편집·상태/순서 변경·archive와 WorkLog 생성/편집/삭제 시 부모 Card 갱신. WorkLog 생성과 부모 갱신은 반드시 같은 transaction |
| Updated Today | 오늘 createdAt을 가진 WorkLog가 있는 서로 다른 비보관 Card 수. 단순 Card 편집/생성, 과거 WorkLog 편집은 포함하지 않음 |
| Archive | 기본 board/dashboard에서 제외. v0.1 일반 search/Today/date 조회도 비보관 Card 기준으로 통일. 백업은 보관 Card와 모든 관계/로그 포함. Archive 관리/복구 화면은 v0.1 범위 밖 |
| Dashboard 범위 | 활성 search/filter와 독립인 전체 비보관 데이터 5개 지표. Board column count는 현재 표시 결과 수 |
| 정렬 | Manual 기본. Recently Updated 최신순, Created Date 최신순, Due Date 가까운 순(미지정 마지막), Priority HIGH→MEDIUM→LOW→NONE. 동률에는 안정된 id 순서 적용 |
| 수동 이동 | sortOrder는 상태 열 안의 수동 순서. 비수동 정렬에서는 열 내부 drag 재정렬 비활성화 및 이유 표시. 상태 변경은 계속 가능. 필터로 숨은 카드의 상대 순서 보존 |
| 검색·필터 | Card 단위 결과를 중복 제거. 서로 다른 필터는 AND. v0.1 필터는 Category/Tag/Status/Priority 각각 단일 선택과 due date 조건을 조합. 여러 Tag를 Card에 붙이는 기능과 구분 |
| Today / 선택 날짜 | Today는 Due/Created/새 WorkLog/Completed의 OR. 섹션 내 Card는 한 번 표시하고 Updated는 해당 날짜의 최신 로그 요약 제공. 날짜 선택 화면은 Due/Updated/Completed 세 그룹 |
| 로컬 설정 | 테마 선택은 IndexedDB의 작은 settings 저장소에 유지. 업무 backup v1은 PRD의 5개 collection을 대상으로 하고 장치 테마는 import로 덮지 않음. 전체 삭제 시 settings도 지워 System 기본으로 복귀 |

### 구조·디자인·검증 공통 규칙

- `React UI → feature hook/service → repository → Dexie` 경계를 지킨다. liveQuery는 repository/service에서 제공하며 화면은 table을 직접 알지 않는다. types와 날짜/필터 계산은 React에서 분리한다.
- 신규 디렉터리는 실제 Task에 필요할 때 생성한다. 모든 폴더를 빈 구조로 먼저 만들거나 범용 storage framework를 만들지 않는다.
- 모든 UI Task는 DESIGN §32–34의 빈 상태/초기 로딩/저장 중/실패/재시도와 §35/39/40의 theme/responsive/focus를 처음부터 포함한다. Phase 9는 전체 재설계 단계가 아니다.
- 토큰은 중립 surface/border/text/accent/semantic color, 4/6/8/12/16/20/24px spacing, control 6px/card 8px/overlay 10px radius를 중심으로 통합한다. 시스템 폰트를 사용한다.
- desktop UI 13px, Card title 14px/600, metadata 12px, tag 11–12px, 일반 아이콘 14–16px를 기준으로 한다. 실제 대비·가독성을 위해 필요한 조정은 이유를 기록한다.
- generic shadcn dashboard, Trello 외형 복제, 대형 지표 카드, rounded-2xl 남용, heavy shadow, gradients, glassmorphism, rainbow tags, oversized typography/cards/whitespace, marketing hero를 사용하지 않는다.
- 기능별 테스트와 시각 검토는 해당 Task에서 완료한다. 모든 UI Task 완료 조건에는 light/dark, 키보드, 긴 한국어/영어 텍스트, 빈 결과, 저장 실패 확인을 공통으로 적용한다.
- Phase/Batch 종료 시 최신 package.json을 확인한 뒤 공통 Gate **G**를 실행한다. Task 완료 표시는 해당 검증을 통과한 뒤에만 가능하며 계획 유지보수가 요청된 경우 상태를 갱신한다. Task ID는 변경하지 않는다.

### 공통 Validation Gate G

TASK-001에서 `test: vitest run`(비 watch), `typecheck: tsc -b` script를 추가하고 최소 하나의 유효한 테스트를 둔다. 기존 lint/build/dev/preview는 유지한다. 그 이후 각 Phase/Batch에서:

```bash
nvm use --lts
npm run lint
npm run test
npm run typecheck
npm run build
```

NVM이 로드되지 않았으면 기존 NVM을 로드한다. 사용할 수 없으면 시스템 변경 없이 호환 runtime 사용 여부와 실제 제한을 기록한다. 환경/설치가 바뀐 경우에만 npm lockfile 기준 설치를 수행한다. 존재하지 않는 script 실행이나 테스트가 0개인 상태를 성공으로 간주하지 않는다. CI가 아직 없으므로 위 명령은 우선 로컬 Gate다.

## Phase 구성과 Task 운용

| Phase | Task | 완료 Gate |
| --- | --- | --- |
| 1 — Foundation & Design System | TASK-001–003 | G + strict/test 기반 및 디자인 토큰 검토 |
| 2 — Database & Repository | TASK-004–005 | G + 재열기·migration 실패·transaction rollback 검증 |
| 3 — Core Domain | TASK-006–009 | G + CRUD/관계/최신 로그/집계 회귀 |
| 4 — App Shell & Main Board | TASK-010–013 | G + compact board/5 metrics/이동 실패 복구 시각·통합 검증 |
| 5 — Card Detail & History | TASK-014–016 | G + 핵심 업무 흐름과 timeline/미리보기 동기화 |
| 6 — Find & Organize | TASK-017–020 | G + 5개 검색 대상·조합 필터·5개 정렬·단축키 |
| 7 — Time Views | TASK-021–022 | G + 달력·Today·자정/DST/월 경계 검증 |
| 8 — Data Safety | TASK-023–026 | G + 백업 왕복·무손상 실패·저장소 상태·DELETE 확인. 아래 구현 순서에 따라 조기 완료 |
| 9 — Release Quality | TASK-027–030 | G + production offline/PWA/접근성/반응형/문서/최종 체크리스트 |

Parallel의 Yes는 **Dependencies 완료 후**, 표시된 독립 경로의 작업과 병행할 수 있다는 뜻이다. 별도 agent 실행 지시가 아니며 동일 package.json/lockfile/라우팅 파일 변경은 직렬 통합한다. 기본 실행은 Implementation Order를 따른다.

## TASK-001 — 기존 toolchain 보완과 테스트 실행 기반

### 상태
완료 (2026-09-08) — Batch 1 Validation Gate 통과

### Phase
Phase 1 — Foundation & Design System

### 목표
현재 Vite 프로젝트를 유지하면서 strict TypeScript와 반복 가능한 테스트 Gate를 확보한다.

### 구현 범위
Vitest/RTL/jsdom/fake-indexeddb 구성, DOM matcher와 cleanup 설정, test/typecheck scripts 추가. app/node TypeScript strict 활성화 및 그로 드러나는 실제 오류 수정. 기존 React 진입점의 렌더링/버튼 상호작용 smoke test 추가(나중에 shell 테스트로 갱신).

### 예상 수정 파일
기존 `package.json`, `package-lock.json`, `tsconfig.app.json`, `tsconfig.node.json`; 예상 신규 `vitest.config.ts`, `src/test/setup.ts`, `src/App.test.tsx`. Oxlint 설정 변경은 테스트 환경에 필요한 최소 범위만.

### Dependencies
None

### Parallel
No

### 기술 고려사항
기존 Vite/React/Oxlint 유지, 신규 패키지 호환성 확인. 테스트용 fake DB는 별도 이름과 lifecycle 사용. strict를 끄거나 any/전역 lint disable로 해결하지 않는다.

### 디자인 고려사항
제품 UI는 이 Task에서 만들지 않는다. 테스트가 템플릿 외형을 제품 디자인으로 고정하지 않게 한다.

### Acceptance Criteria
- 기존 dev/build/lint/preview 유지, test는 watch 없이 종료하고 실제 테스트를 실행한다.
- app/node strict가 켜진 상태로 typecheck와 build가 통과한다.
- React Compiler/ESLint/새 package manager를 도입하지 않는다.

### Test / Validation
G. DOM 상호작용 테스트 실제 통과 확인. 기본 프로젝트 재생성이나 불필요한 dependency upgrade가 없는지 diff 검토.

## TASK-002 — Tailwind·shadcn와 compact 디자인 토큰

### 상태
완료 (2026-09-08) — Batch 1 Validation Gate 및 light/dark 시각 검토 통과

### Phase
Phase 1 — Foundation & Design System

### 목표
모든 화면이 처음부터 같은 밀도·테마·접근성 기반을 사용한다.

### 구현 범위
Tailwind/Vite 통합, shadcn alias/config 및 필요한 Button/Input/Textarea/Select/Dialog/Sheet/Tooltip/Popover 등의 기반 primitive 도입. semantic color·타이포·spacing·radius·focus 토큰 정의. System/Light/Dark 전환과 OS 변경 감지를 제공하는 작은 ThemeProvider 작성(영속화는 TASK-023). 템플릿 전용 전역 CSS 제거/범위 조정.

### 예상 수정 파일
기존 `vite.config.ts`, `tsconfig.app.json`, 필요 시 `tsconfig.json`, `package.json`, `package-lock.json`, `src/index.css`, `src/App.css`; 예상 신규 `components.json`, `src/components/ui/`, `src/utils/cn.ts`, `src/app/ThemeProvider.tsx`와 테스트.

### Dependencies
TASK-001

### Parallel
Yes — TASK-003과 가능. 공통 설정 파일은 이 Task가 담당.

### 기술 고려사항
shadcn 전체 dashboard template을 생성하지 않는다. 단일 icon library, 외부 font CDN 없음. OS media query 구독 cleanup, reduced motion 지원. 장식용 패키지 추가 없음.

### 디자인 고려사항
DESIGN §6–12, §35–42 적용. button 30–34px/input 32–36px, border 중심 구분, 떠 있는 overlay에만 얕은 shadow, 기능적 motion 120–200ms.

### Acceptance Criteria
- light/dark에 semantic token이 대응하고 System 설정이 OS 변화에 반응한다.
- 공통 control에 label/focus/disabled/error 표현이 있고 theme별로 읽을 수 있다.
- 디자인 밀도는 중앙 토큰으로 제어되며 일반 콘텐츠에 대형 radius·shadow·gradient를 사용하지 않는다.

### Test / Validation
G. ThemeProvider OS 변경/cleanup 테스트, dialog focus 복귀 및 tooltip focus 확인. 개발 화면 또는 테스트 harness에서 양 테마의 control/typography를 시각 확인하며 별도 showcase 제품 기능은 만들지 않는다.

## TASK-003 — 도메인 타입·날짜·입력 계약

### 상태
완료 (2026-09-08) — Batch 1 Validation Gate 및 Asia/Seoul·America/New_York 날짜 경계 테스트 통과

### Phase
Phase 1 — Foundation & Design System

### 목표
저장소와 UI가 공유할 데이터·시간 의미를 고정한다.

### 구현 범위
Card/CardStatus/Priority/Category/Tag/CardTag/WorkLog/BackupPayload 타입, 고정 enum label mapping, 입력 검증 함수. ISO timestamp/date-only 검증, 로컬 날짜 구간·정확 시간·상대 시간·due urgency·`isStale(card, days)` 공통 유틸. new Card 기본 TODO/NONE와 빈 title/content 거부 규칙 정의.

### 예상 수정 파일
예상 신규 `src/types/domain.ts`, `src/types/backup.ts`, `src/utils/dates.ts`, `src/services/validation.ts`와 인접 테스트.

### Dependencies
TASK-001

### Parallel
Yes — TASK-002와 가능.

### 기술 고려사항
React와 분리, unknown 입력을 검증하여 좁히기, ISO/로컬 날짜 혼동 금지. 긴 content를 임의 절삭해서 저장하지 않는다. 문자열/필수 필드/enum/유효한 날짜 검증은 CRUD와 backup에 재사용.

### 디자인 고려사항
DESIGN §20/23/24/27의 전체 원문 접근, 우선순위 label, due urgency, 상대/정확 시간 표현을 지원한다. UI 없음.

### Acceptance Criteria
- WorkLog가 Card와 분리된 entity이며 Card에 단일 최신 상태 문자열을 저장하지 않는다.
- 오늘 범위, date-only, 상대 시간, stale 판정에 공유 함수가 있다.
- 타입에 PRD §11/15–17/30의 필드가 누락되지 않는다.

### Test / Validation
G. 공백 입력·잘못된 날짜/enum, 월/연/윤일 경계, 자정, Asia/Seoul 및 DST 시간대 fixture, stale 경계와 미래 시각 테스트.

## TASK-004 — Dexie schema v1과 무손실 versioning

### 상태
완료 (2026-09-08) — Batch 2 Validation Gate 및 schema 재열기·migration rollback 테스트 통과

### Phase
Phase 2 — Database & Repository

### 목표
브라우저 재시작을 견디는 명시적 IndexedDB schema와 업그레이드 원칙을 만든다.

### 구현 범위
Dexie 설치, schema v1의 cards/categories/tags/cardTags/workLogs 및 작은 settings store 정의. CardTag 복합 primary key, status/categoryId/updatedAt/dueDate/sortOrder와 WorkLog cardId/createdAt 조회에 맞는 index 선택. DB 인스턴스 생성·열기·닫기, 구조화된 open/migration 오류 전달.

### 예상 수정 파일
기존 `package.json`, `package-lock.json`; 예상 신규 `src/db/database.ts`, `src/db/schema.ts`, `src/db/database.test.ts`.

### Dependencies
TASK-003

### Parallel
No

### 기술 고려사항
ID 생성은 로컬 API. version(1)을 명시하고 DB 삭제 fallback 금지. settings는 업무 backup collection과 분리. DB schema version과 backup schemaVersion의 역할을 구분한다. 존재하지 않는 과거 production schema를 가정하지 않는다.

### 디자인 고려사항
UI 없음. migration 실패는 이후 shell에서 구체적 비파괴 오류로 표현할 수 있게 한다(DESIGN §34).

### Acceptance Criteria
- 새 DB 초기화와 v1 재열기가 데이터/관계를 보존한다.
- CardTag 중복 관계가 primary key로 차단된다.
- 향후 변경은 명시적 Dexie migration으로만 추가하며 실패 시 데이터가 남는다.

### Test / Validation
G. fake-indexeddb 생성/재열기/중복 key 테스트. 별도 테스트 DB의 v1→테스트용 다음 version fixture로 데이터 보존과 실패 rollback을 검증한다. 이 fixture를 불필요한 production v2로 추가하지 않는다. 실제 migration이 생기면 해당 migration 회귀 테스트를 필수로 추가한다.

## TASK-005 — Repository 계약·반응형 구독·transaction 경계

### 상태
완료 (2026-09-08) — Batch 2 Validation Gate 및 구독 cleanup·다중 table rollback 테스트 통과

### Phase
Phase 2 — Database & Repository

### 목표
React에서 테이블 구현을 몰라도 읽기·쓰기·실패를 다룰 수 있다.

### 구현 범위
Card/WorkLog/Category/Tag repository 인터페이스와 기본 read 구현, service에서 사용할 transaction 단위, liveQuery 구독 adapter, 공통 오류 분류. 복합 조회에서 매 Card마다 전체 DB를 스캔하지 않는 조회 방식. 기능별 mutation의 실구현은 TASK-006–008에 둔다.

### 예상 수정 파일
예상 신규 `src/repositories/`, `src/services/data-errors.ts`, `src/hooks/useRepositoryQuery.ts`와 테스트; 기존 예정 `src/db/database.ts`.

### Dependencies
TASK-004

### Parallel
No

### 기술 고려사항
무의미한 generic repository framework 금지. DB를 주입해 격리 테스트 가능하게 구성. transaction 안의 오류를 삼키지 않고 commit 후 읽기 구독이 갱신되게 한다.

### 디자인 고려사항
DESIGN §33–34를 위한 loading/pending/error 상태 계약. 보통 읽기에 full-screen spinner를 요구하지 않는다.

### Acceptance Criteria
- UI가 Dexie table에 직접 접근하지 않는 경로가 확립된다.
- 구독/해제와 DB 오류가 명시적으로 처리된다.
- 다중 쓰기 실패 시 일부만 남는 상태가 없다는 테스트가 있다.

### Test / Validation
G. repository read/구독 갱신/cleanup, 실패 주입 rollback 테스트. StrictMode mount/unmount에서 구독이 중복 누적되지 않음 확인.

## TASK-006 — Card CRUD·완료·archive·cascade 삭제

### 상태
완료 (2026-09-08) — Batch 3 Validation Gate 및 재열기·완료 시각·cascade rollback 테스트 통과

### Phase
Phase 3 — Core Domain

### 목표
Card 생명주기와 순서를 안전하게 저장한다.

### 구현 범위
title-only quick create용 service, 필드 수정·조회, 상태 변경/완료 시각, manual sortOrder 변경, archive, 영구 삭제. 태그 관계 변경과 Card 저장의 원자성 확보. Card 삭제는 CardTags/WorkLogs까지 같은 transaction.

### 예상 수정 파일
예상 신규 `src/services/cards.ts`, `src/repositories/cards.test.ts`; 예정 `src/repositories/cards.ts`, `src/types/domain.ts`.

### Dependencies
TASK-005

### Parallel
Yes — TASK-008과 파일 소유권 및 transaction API를 합의한 뒤 가능.

### 기술 고려사항
없는 category/tag 참조 거부, sortOrder 유한값, DONE 진입/이탈 계약 적용. archive는 관계와 history를 지우지 않는다. 삭제 확인 UI는 TASK-014가 담당한다.

### 디자인 고려사항
PRD §14/25와 DESIGN §34/40: archive를 일반 제거 경로로 노출할 수 있도록 삭제와 API를 분리.

### Acceptance Criteria
- Card 필드 CRUD/상태/순서/완료 시각이 재열기 후 유지된다.
- archive가 Card와 WorkLog를 보존하고 기본 조회에서 숨긴다.
- cascade 삭제 성공 시 종속 데이터가 남지 않고 실패 시 모두 복구된다.

### Test / Validation
G. Card CRUD, 필수 title, 잘못된 관계, DONE 유지·이탈·재진입, sort 변화, archive, cascade 및 중간 실패 회귀 테스트.

## TASK-007 — WorkLog CRUD와 최신 이력 계산

### 상태
완료 (2026-09-08) — Batch 3 Validation Gate 및 최신 이력 재계산·부모 갱신 rollback 테스트 통과

### Phase
Phase 3 — Core Domain

### 목표
업무 진행 이력이 독립적으로 보존되고 최신 항목이 항상 정확하다.

### 구현 범위
WorkLog 생성/조회/편집/삭제, 부모 Card.updatedAt과 transaction 결합. createdAt 내림차순 timeline, latest/count projection. 최신·과거 항목 편집과 삭제에 따라 파생 결과 재계산.

### 예상 수정 파일
예상 신규 `src/services/worklogs.ts`, `src/services/worklogs.test.ts`; 예정 `src/repositories/worklogs.ts`.

### Dependencies
TASK-006

### Parallel
Yes — TASK-008과 가능.

### 기술 고려사항
WorkLog canonical history 보존, Card의 mutable progress 필드로 대체 금지. 편집은 createdAt 유지. 없는 Card에 로그 생성 거부. 삭제 확인은 UI에서 담당하되 repository 실패도 전달한다.

### 디자인 고려사항
DESIGN §18/20/26–27: preview와 timeline이 동일한 history를 참조하며 원문/정확 시간을 제공.

### Acceptance Criteria
- 생성과 부모 updatedAt 변경이 둘 다 성공하거나 둘 다 취소된다.
- latest 편집, 과거 편집, latest 삭제, 마지막 로그 삭제, 동일 시각 동률에서 결과가 일관된다.
- WorkLog 원문은 줄 수와 관계없이 저장되고 UI preview에서만 축약한다.

### Test / Validation
G. WorkLog 전체 CRUD, orphan 거부, 부모 갱신 rollback, newest-first/latest/count 및 오래된 로그 편집 순서 유지 테스트.

## TASK-008 — Category·Tag·CardTag와 안전한 삭제

### 상태
완료 (2026-09-08) — Batch 3 Validation Gate 및 관계 무결성·분류 삭제 무손실/rollback 테스트 통과

### Phase
Phase 3 — Core Domain

### 목표
분류를 편집·삭제해도 업무와 이력이 유지된다.

### 구현 범위
Category 생성/rename/color/delete, Tag 생성/rename/color/delete, CardTag attach/detach. Category 삭제 시 연결 Card.categoryId 해제. Tag 삭제 시 해당 CardTag만 함께 제거. 선택 색상은 허용된 낮은 채도 palette 값으로 검증.

### 예상 수정 파일
예상 신규 `src/services/classification.ts`와 테스트; 예정 `src/repositories/categories.ts`, `src/repositories/tags.ts`.

### Dependencies
TASK-005

### Parallel
Yes — TASK-006/007과 별도 파일에서 가능.

### 기술 고려사항
Card는 Category 0/1개, Tag 복수. 참조 무결성, 중복 attach 방지. 연결 해제·삭제는 transaction. 업무 텍스트를 포함하는 remote API 없음.

### 디자인 고려사항
DESIGN §21–22의 절제된 tag/category 색을 지원한다. 삭제 전 영향 설명은 TASK-019에서 구현.

### Acceptance Criteria
- Category 삭제 후 Card/WorkLog 수가 변하지 않고 연결만 해제된다.
- Tag 삭제 후 Card/WorkLog가 유지되며 해당 관계만 제거된다.
- rename/color/attach/detach 결과가 재열기 후에도 일치한다.

### Test / Validation
G. 분류 CRUD, 복수 Tag, 중복 관계, 삭제 후 무참조/무손실, transaction 중간 실패 rollback 테스트.

## TASK-009 — Board projection과 dashboard 집계

### 상태
완료 (2026-09-08) — Batch 3 Validation Gate 및 반응형 projection·5개 지표·자정/재활성화 테스트 통과

### Phase
Phase 3 — Core Domain

### 목표
보드의 최신 WorkLog와 대시보드 수치를 일관된 데이터로 제공한다.

### 구현 범위
Card별 category/tags/latest WorkLog/count/상대시간용 projection. 비보관 Total/In Progress/Waiting/Done/Updated Today 집계. 날짜 경계 변경과 DB 변경에 대한 갱신. UI 필터와 전체 dashboard 범위 분리.

### 예상 수정 파일
예상 신규 `src/services/board-query.ts`, `src/services/dashboard.ts` 및 테스트; 예정 `src/repositories/`의 필요한 조회 함수.

### Dependencies
TASK-006, TASK-007, TASK-008

### Parallel
No

### 기술 고려사항
전체 scan을 Card마다 반복하지 않는다. Updated Today는 WorkLog.createdAt 기반 Set<CardId>. Card 편집/WorkLog 편집을 신규 이력으로 세지 않는다. 자정·탭 재활성화 시 날짜 범위를 갱신한다.

### 디자인 고려사항
DESIGN §15/18–20의 compact metrics 및 latest-first Card에 필요한 정보를 추가 drawer 읽기 없이 제공.

### Acceptance Criteria
- 동일 Card의 오늘 로그가 여러 개여도 Updated Today는 1이다.
- archive/delete/status/WorkLog 변경에 projection과 count가 반응한다.
- 로그 없는 Card도 유지되며 preview/count가 명확하다.

### Test / Validation
G. 5개 지표, 보관 제외, 중복 로그, 자정 경계, 마지막 로그 삭제, 여러 Card projection 테스트. Phase 3 Gate에서 모든 domain safety 회귀를 함께 확인.

## TASK-010 — App shell·라우팅·compact sidebar

### 상태
완료 (2026-09-08) — Batch 5 Validation Gate 및 route/history/mobile focus·실제 브라우저 shell 검토 통과

### Phase
Phase 4 — App Shell & Main Board

### 목표
기본 템플릿을 Histask의 일관된 화면 구조로 교체한다.

### 구현 범위
React Router 추가. Header/New task/Search/Settings 위치, Today/All Tasks/In Progress/Waiting/Completed 탐색, category/tag 영역과 mini calendar 슬롯 구성. 각 기능 Task에서 실제 화면을 연결하며 아직 없는 기능을 작동하는 것처럼 보이지 않게 한다. 기본 오류 경계와 DB open 실패 안내. 템플릿 이미지·외부 커뮤니티 링크·장식 제거.

### 예상 수정 파일
기존 `src/App.tsx`, `src/App.css`, `src/main.tsx`, `src/App.test.tsx`, `index.html`, `package.json`, `package-lock.json`; 예상 신규 `src/app/router.tsx`, `src/components/layout/`, `src/features/settings/SettingsPage.tsx`. 불필요해진 템플릿 assets는 이 범위에서만 정리.

### Dependencies
TASK-002, TASK-009

### Parallel
No

### 기술 고려사항
정적 호스팅 새로고침을 위해 hash routing을 기본 선택해 서버 rewrite 의존성을 없앤다. 경로/상태를 단순하게 유지. 입력은 backup 설정 완료 뒤 TASK-011에서 연결한다.

### 디자인 고려사항
DESIGN §5/13/32–34/39–42: sidebar 232px(220–260px), header 48px, content padding 16–20px, nav row 32–36px. 중립 배경/작은 active accent, tablet collapse/mobile sheet 기본 구조.

### Acceptance Criteria
- 5개 탐색 항목과 Settings 진입이 존재하며 활성 위치가 명확하다.
- desktop sidebar 폭이 기준 내이고 템플릿 hero/대형 typography가 제거된다.
- 오류가 발생해도 자동 DB reset 없이 이유와 재시도 경로를 제공한다.

### Test / Validation
G. route/새로고침/뒤로가기, navigation aria-current, sidebar keyboard/mobile sheet focus 확인. 현 단계 shell 시각 검토를 통과한 뒤 board 구현.

## TASK-011 — Quick add와 Latest WorkLog 중심 Kanban

### Phase
Phase 4 — App Shell & Main Board

### 목표
실제 Card와 최신 진행 상태를 한 화면에서 읽고 빠르게 추가한다.

### 구현 범위
4개 고정 상태 열, count/add, title-only quick add, manual 기본 정렬. TASK-009 projection을 사용하는 Card preview 및 no-log/empty/error 상태. 제목·최신 로그·분류·due/priority·tags·상대 시간·로그 수 표시. tooltip에 축약된 원문과 정확한 시간 접근 제공.

### 예상 수정 파일
예상 신규 `src/features/board/BoardPage.tsx`, `KanbanColumn.tsx`, `TaskCard.tsx`, `QuickAddCard.tsx`, `useBoard.ts`와 테스트; 예정 `src/app/router.tsx`, shell header.

### Dependencies
TASK-010, TASK-026

### Parallel
Yes — TASK-012와 별도 component에서 가능. route 통합은 직렬.

### 기술 고려사항
쓰기 완료 전 성공처럼 표시하지 않으며 중복 제출 방지. Card마다 전체 DB 재조회 금지. drag와 Card open/tooltip trigger의 focus 영역을 구분한다. 상세 열기는 TASK-014에서 연결.

### 디자인 고려사항
DESIGN §16–24: column gap 12px, card gap 8px, header 32–40px, card padding 10–12px/gap 6–8px/radius 8px. 보통 Card 140–160px 안팎을 목표로 하되 긴 제목/접근성 때문에 내용이 손실되지 않게 조정.

### Acceptance Criteria
- Title 바로 다음에 latest WorkLog가 눈에 띄고 최대 2줄이다. 실제 축약 시 hover와 keyboard focus 모두 전체 원문 tooltip을 연다.
- category/status/due/priority, restrained tags, 상대 시간/log count가 하위 계층으로 읽힌다. 로그 없음은 조용한 placeholder.
- title-only 생성이 예상 열/위치에 저장되며 새로고침 후 보존된다.
- 회색 대형 rounded column, heavy card shadow, rainbow tags 없이 4열/가로 스크롤을 제공한다.

### Test / Validation
G. quick add/쓰기 실패/빈 열/무로그/긴 로그 UI 테스트, 양 테마 시각 확인 및 focus tooltip 실제 브라우저 확인. due 미래/오늘/기한 초과/완료와 HIGH/NONE 표현 비교.

## TASK-012 — Compact reactive dashboard

### Phase
Phase 4 — App Shell & Main Board

### 목표
보드 공간을 유지하면서 현재 업무량을 즉시 파악한다.

### 구현 범위
TASK-009의 5개 지표를 단일 metrics row에 연결. 로딩/오류와 숫자 갱신을 간결하게 표시. 지표 label은 PRD 의미를 유지하고 화면 filter와 독립인 전체 비보관 집계임을 일관되게 표현.

### 예상 수정 파일
예상 신규 `src/features/dashboard/MetricsRow.tsx`, `useDashboard.ts`와 테스트; 예정 board/shell layout.

### Dependencies
TASK-010, TASK-009

### Parallel
Yes — TASK-011과 가능.

### 기술 고려사항
집계 논리를 JSX에 복제하지 않는다. 날짜 경계 갱신과 live subscription 공유.

### 디자인 고려사항
DESIGN §9/15: 한 줄 summary 또는 높이 56–72px 내의 낮은 row. 지표 5개가 개별 대형 dashboard card가 되지 않는다. 숫자 강조는 22–24px 이하 기준, shadow/장식 없음.

### Acceptance Criteria
- Total/In Progress/Waiting/Done/Updated Today가 표시되고 쓰기 후 reload 없이 갱신된다.
- 보관 데이터는 모두 제외되고 오늘 여러 로그를 작성한 Card는 한 번 센다.
- desktop에서 지표 영역이 한 compact row이며 좁은 폭에서는 과도한 높이 없이 wrap 가능하다.

### Test / Validation
G. domain 집계와 UI 값 연결, 상태 변경·archive·WorkLog 추가·삭제 갱신 테스트. 1366×768에서 업무 board의 세로 공간과 양 테마를 시각 확인.

## TASK-013 — dnd-kit 이동·수동 순서·실패 rollback

### Phase
Phase 4 — App Shell & Main Board

### 목표
상태/수동 순서를 예측 가능하게 변경하고 저장 실패에서 복구한다.

### 구현 범위
dnd-kit sensors/sortable 적용, 열 간 status와 관련 sortOrder 변경, 열 내 수동 재정렬. 관련 Card들의 변경을 transaction으로 저장. 기존 상태 snapshot과 pending 처리로 실패 시 rollback. drag 없이 상태 변경 및 위/아래 이동을 할 수 있는 메뉴/버튼 제공.

### 예상 수정 파일
기존 `package.json`, `package-lock.json`; 예상 신규 `src/features/board/useBoardDnd.ts`, `src/services/card-order.ts`와 테스트; 예정 KanbanColumn/TaskCard/cards repository.

### Dependencies
TASK-011

### Parallel
Yes — TASK-012와 가능하되 shared board 파일 통합은 직렬.

### 기술 고려사항
빈 열/끝 위치/동률 정리, 빠른 중복 drag, 실패·취소 처리. 비수동 정렬에서는 내부 reorder 제한, 필터링된 목록에서 숨은 Card의 상대 순서 보존 정책을 service에 둔다. TASK-018에서 UI 정책과 함께 검증.

### 디자인 고려사항
DESIGN §37–38/40: 작은 elevation과 원래 자리/target 표시, 과도한 회전·확대 없음. focus/키보드 안내와 결과 알림을 제공.

### Acceptance Criteria
- 열 간 이동 후 status/completedAt/sortOrder가 일관되고 재열기 후 유지된다.
- 내부 reorder 후 전체 열 순서가 저장된다.
- 실패 주입 시 DB와 UI가 이동 전 상태이며 재시도 가능한 오류가 보인다.
- drag 없이도 상태와 수동 순서를 변경할 수 있다.

### Test / Validation
G. 순서 service unit/transaction rollback 테스트, pointer·keyboard·빈 열·취소·숨은 Card scenario 통합 검증. 실제 브라우저 drag를 확인하고 Phase 4 Gate 통과.

## TASK-014 — Card detail drawer와 편집·archive·삭제

### Phase
Phase 5 — Card Detail & History

### 목표
보드 맥락을 유지하며 Card 상세와 모든 필드를 관리한다.

### 구현 범위
우측 drawer, title/description/status/category/tags/priority/dueDate 편집, created/updated/completed metadata, Save/Archive/Delete. category/tag 선택은 기존 entity를 사용하고 신규 분류 관리는 TASK-019. archive와 영구 삭제의 영향 설명·확인, 삭제 후 focus 복귀.

### 예상 수정 파일
예상 신규 `src/features/card-detail/CardDetailDrawer.tsx`, `CardFields.tsx`, `useCardDetail.ts`와 테스트; 예정 TaskCard/router/common confirm UI.

### Dependencies
TASK-011, TASK-008, TASK-026

### Parallel
Yes — TASK-012/013 완료와 독립적으로 가능하나 기본 Batch 순서를 권장.

### 기술 고려사항
저장 중 중복 실행 차단, validation inline, 실패 시 입력 보존. 다른 쓰기/복원으로 열린 Card가 사라지는 상태 처리. UI 직접 Dexie 접근 없음.

### 디자인 고려사항
DESIGN §25/28/34/39–40: desktop 420–520px 우측 drawer, compact field row. title/metadata/description/history/input 구조. mobile은 full 또는 near-full sheet. archive가 일반 제거 동작, delete는 secondary destructive.

### Acceptance Criteria
- PRD의 모든 편집 필드·metadata·actions가 동작하고 저장 결과가 board에 반영된다.
- 취소/확인 전 삭제 없음. 삭제하면 종속 이력과 관계도 제거되고 archive는 보존된다.
- focus trap, Esc, 닫은 뒤 원래 Card로 focus 복귀(삭제 시 인접한 유효 control)가 동작한다.

### Test / Validation
G. 전체 필드 저장/취소/오류·archive/삭제 확인 UI 테스트, 긴 내용 scroll, 양 테마·desktop/mobile drawer focus 확인.

## TASK-015 — WorkLog 입력·history timeline·편집/삭제

### Phase
Phase 5 — Card Detail & History

### 목표
작업 중 진행 이력을 기록하고 수정하면서 board의 최신 상태를 즉시 확인한다.

### 구현 범위
drawer HISTORY newest-first timeline, multiline 입력, Save 및 Ctrl/Cmd+Enter 저장, Enter 줄바꿈. WorkLog 편집/삭제 확인, 정확 시각·상대 날짜·edited 표시, 실패 입력 보존. 생성/수정/삭제 후 최신 preview/count 즉시 갱신.

### 예상 수정 파일
예상 신규 `src/features/worklogs/WorkLogComposer.tsx`, `WorkLogTimeline.tsx`, `WorkLogEntry.tsx`, `useWorkLogs.ts`와 테스트; 예정 CardDetailDrawer.

### Dependencies
TASK-014, TASK-007

### Parallel
No

### 기술 고려사항
IME 조합 중 저장 방지, 중복 저장 차단, 편집 중 createdAt 불변. 원문은 text로 렌더링하고 multiline 유지. 최신/과거/마지막 로그 삭제 모두 처리.

### 디자인 고려사항
DESIGN §26–28: 가는 세로 선/작은 점/작고 muted timestamp의 history timeline. Avatar, 말풍선, reaction, social feed alignment 없음. 본문과 입력은 읽기 쉬운 compact 형태.

### Acceptance Criteria
- Enter는 줄바꿈, Ctrl/Cmd+Enter와 Save는 각각 한 번 저장한다.
- newest-first history이며 과거 항목 수정으로 순서가 바뀌지 않는다.
- 추가/최신 편집/최신 삭제/마지막 삭제 후 board preview와 count가 reload 없이 정확하다.
- 삭제 취소와 저장 실패 시 원래 데이터/사용자 입력을 잃지 않는다.

### Test / Validation
G. RTL로 입력·단축키·IME·취소·실패 검증. timeline→board 갱신 통합 및 긴 한국어/다중 줄/키보드 focus 시각 확인.

## TASK-016 — 핵심 업무 흐름과 복원 후 이력 회귀

### Phase
Phase 5 — Card Detail & History

### 목표
Histask의 핵심 차별점이 화면과 DB 전체에서 유지됨을 증명한다.

### 구현 범위
가상 데이터로 통합 테스트: 생성 → IN_PROGRESS 이동 → WorkLog → board preview → DONE → dashboard. 최신 로그 편집/삭제와 backup export/replace 후 projection 재조회도 포함. 드러난 문제만 해당 feature에서 수정.

### 예상 수정 파일
예상 신규 `src/test/core-workflow.test.tsx`, `src/test/restore-workflow.test.tsx`, `src/test/fixtures.ts`; 문제가 확인된 board/detail/worklogs/backup 경로만 보완.

### Dependencies
TASK-012, TASK-013, TASK-015, TASK-026

### Parallel
No

### 기술 고려사항
repository mock만으로 끝내지 않고 fake-indexeddb와 실제 service 조합으로 검증. fresh mount/reopen 후 일치 여부 확인. 테스트 seed는 production 자동 생성과 분리.

### 디자인 고려사항
DESIGN §18/20/25–27/46: 실제 Card를 열지 않고 진행 상태를 이해할 수 있는지, tooltip/timeline 계층을 시각 평가.

### Acceptance Criteria
- PRD §41 core workflow의 자동 회귀가 통과한다.
- restore 후 열린 drawer/board/metrics가 이전 dataset을 표시하지 않는다.
- 2줄 preview, 원문 tooltip, no-log 상태, history timeline이 양 테마에서 유지된다.

### Test / Validation
G + 실제 브라우저 새로고침과 핵심 흐름 smoke. DB/console 오류와 최신 이력 불일치가 없어야 Phase 5 Gate 통과.

## TASK-017 — 공통 검색·조합 필터·정렬 service

### Phase
Phase 6 — Find & Organize

### 목표
모든 화면에서 같은 조건으로 업무를 찾는다.

### 구현 범위
title/description/category name/tag name/WorkLog content 검색, 대소문자 무시 및 Card별 중복 제거. Category/Tag/Status/Priority/Due date AND 필터. Manual/Recently Updated/Created Date/Due Date/Priority 정렬. match excerpt와 출처를 제공하는 결과 모델.

### 예상 수정 파일
예상 신규 `src/services/card-search.ts`, `card-filters.ts`, `card-sort.ts`, `src/types/card-query.ts`와 테스트; 예정 board query 확장.

### Dependencies
TASK-009

### Parallel
Yes — TASK-019의 UI 구현과 가능.

### 기술 고려사항
필터 모델은 단순 serializable 값. 빈 query는 정상 목록 반환. 매 keystroke마다 DB 전체 scan 대신 구독 데이터 재사용/필요 시 debounce, 수백~수천 Card 규모의 불필요한 반복 방지. 외부 검색 API 없음.

### 디자인 고려사항
DESIGN §30–31: Card title → matching excerpt → category/tags 결과 계층에 필요한 정보 제공. 스타일 구현은 TASK-018.

### Acceptance Criteria
- 5개 검색 대상 모두 부모 Card 결과로 반환되고 여러 matching log여도 Card 중복 없음.
- 다섯 종류 filter가 함께 작동하고 default/manual 및 각 sort 방향이 공통 계약과 일치한다.
- archived Card 제외, 날짜 미지정·동률·빈 query에서도 안정된 결과.

### Test / Validation
G. 검색 대상별 match, 한국어/대소문자, 중복 log, 복합 AND/0결과, 날짜 범위·미지정, 5종 정렬과 안정성 테스트. fixture 데이터로 반복 조회 비용 점검.

## TASK-018 — Global search·filter bar·sort UI

### Phase
Phase 6 — Find & Organize

### 목표
현재 조건을 잃지 않고 보드·목록을 빠르게 좁힌다.

### 구현 범위
Header global search, Card 기반 결과/상세 열기, compact filter controls 및 active chips/Clear all, sort selector. sidebar navigation/category/tag 선택과 공통 filter 연결. 검색과 filter 동시 적용. non-manual sort에서 reorder 제한/상태 변경 경로 안내.

### 예상 수정 파일
예상 신규 `src/features/search/`, `src/features/filters/`; 예정 header/sidebar/BoardPage/useBoard/router.

### Dependencies
TASK-017, TASK-013, TASK-014

### Parallel
Yes — TASK-019와 가능. Sidebar 공통 변경은 직렬 통합.

### 기술 고려사항
표시 조건과 query service를 공유하고 초기화 시 sidebar 선택도 일치시킨다. 입력 echo/검색 강조에 HTML injection 없음. drag 중 조건 변경은 취소/재계산으로 stale index를 사용하지 않는다.

### 디자인 고려사항
DESIGN §30–34: 작고 가벼운 search, 결과 title→excerpt→분류 순서, compact chips, 활성 조건일 때 Clear all. 큰 filter 카드·영구적으로 과도한 search 폭 없음.

### Acceptance Criteria
- 검색/필터/정렬이 함께 적용되고 선택 조건과 실제 결과가 일치한다.
- no tasks와 no matches가 구분되며 후자는 clear action을 제공한다.
- 정렬·필터 중 상태 이동/수동 순서 처리에서 숨은 Card가 손실되거나 임의 재정렬되지 않는다.
- 키보드로 결과를 열고 돌아올 수 있다.

### Test / Validation
G. search/filter/Clear all/sort/navigation 통합, non-manual reorder 제한, filtered drag persistence 테스트. 양 테마·좁은 화면 filter wrap·긴 excerpt 시각 확인.

## TASK-019 — Category·Tag 관리 화면

### Phase
Phase 6 — Find & Organize

### 목표
업무를 보존하면서 분류와 여러 Tag 연결을 관리한다.

### 구현 범위
compact 관리 dialog/popover에서 생성/rename/color/delete. Card 상세의 Category/복수 Tag 선택·해제 연계. 삭제 전 Card 보존/관계 해제 설명, 취소 및 실패 처리. 삭제된 분류를 가리키는 active filter 정리.

### 예상 수정 파일
예상 신규 `src/features/categories/`, `src/features/tags/`; 예정 sidebar/CardFields/filter state.

### Dependencies
TASK-008, TASK-014, TASK-017

### Parallel
Yes — TASK-018과 UI 경로를 나누어 가능.

### 기술 고려사항
모든 쓰기는 classification service. form 검증, 중복 제출 방지. 사용자 지정 색상의 낮은 채도 표현과 저장 값 검증을 일치시킨다.

### 디자인 고려사항
DESIGN §13/21–22/40/42: compact rows, Category 작은 색 점/label, Tag subtle border와 낮은 채도. Card 전체 category 배경색 금지.

### Acceptance Criteria
- Category/Tag create/rename/color/delete와 Card attach/detach가 UI에서 가능하다.
- 삭제 확인 문구가 데이터 영향을 정확히 설명하고 Card/WorkLog가 유지된다.
- 변경한 이름/색/관계가 board/search/filter에 즉시 반영된다.

### Test / Validation
G. CRUD form/삭제 확인/취소, 관계 보존 UI 통합, 삭제된 active filter 처리, keyboard dialog focus 및 tag 대비 검증.

## TASK-020 — 전역 단축키와 입력 focus 규칙

### Phase
Phase 6 — Find & Organize

### 목표
타이핑을 방해하지 않으면서 자주 쓰는 동작을 키보드로 실행한다.

### 구현 범위
N new Card, / search focus, Esc 최상위 drawer/dialog 닫기. WorkLog Ctrl/Cmd+Enter와 중복 충돌 없는 shortcut hook. input/textarea/contenteditable/select-like/combobox 및 IME 조합에서 전역 문자 shortcut 억제.

### 예상 수정 파일
예상 신규 `src/hooks/useKeyboardShortcuts.ts`와 테스트; 예정 shell/search/QuickAddCard/CardDetailDrawer/WorkLogComposer.

### Dependencies
TASK-015, TASK-018, TASK-019

### Parallel
No

### 기술 고려사항
기본 브라우저 shortcut 불필요하게 가로채지 않음. overlay stack과 focus 복귀, listener cleanup. save shortcut은 해당 WorkLog editor에만 적용.

### 디자인 고려사항
DESIGN §30/40: focus 위치가 보이고 icon-only 기능에 label/tooltip 존재. 키보드 힌트는 작은 보조 표기로 제한.

### Acceptance Criteria
- N, /, Esc와 WorkLog save가 필요한 문맥에서만 동작한다.
- 한국어 IME와 select-like 입력 중 의도치 않은 Card 생성/검색 전환이 없다.
- 중첩 overlay에서 Esc 한 번이 최상위만 닫고 유효한 trigger로 focus가 복귀한다.

### Test / Validation
G. 각 입력 종류/contenteditable/combobox/IME/중첩 overlay 회귀 및 실제 keyboard-only 흐름. Phase 6 Gate 통과.

## TASK-021 — 날짜 조회와 Mini Calendar

### Phase
Phase 7 — Time Views

### 목표
한 달의 업무 흔적에서 특정 날짜의 업무로 이동한다.

### 구현 범위
dueDate/completedAt/WorkLog.createdAt 기반 월별 indicator 조회, 현재 월/이전·다음 월/날짜 선택. 선택 날짜 Due/Updated/Completed 그룹 query와 view, Card 상세 연결. sidebar 미니 달력 실제 구현.

### 예상 수정 파일
예상 신규 `src/services/date-work.ts`, `src/features/calendar/MiniCalendar.tsx`, `DateWorkView.tsx`와 테스트; 예정 sidebar/router.

### Dependencies
TASK-003, TASK-009, TASK-014, TASK-020

### Parallel
No

### 기술 고려사항
ISO date-only와 timestamp 구간을 분리, 월 경계/DST/윤년. 로그 날짜에 속한 최신 excerpt를 사용하고 Card 전체 latest와 혼동하지 않는다. dates는 keyboard grid 탐색 지원.

### 디자인 고려사항
DESIGN §14/29/40: 선택일 accent-soft, today subtle ring/text, activity 작은 dot. scheduling heatmap/큰 색 block 없음. 결과는 compact list/timeline.

### Acceptance Criteria
- 현재 월과 월 이동이 맞으며 indicator가 due/completed/log 자료와 일치한다.
- 날짜 선택으로 Due/Updated/Completed가 나타나고 같은 섹션의 Card 중복이 없다.
- today/selected/activity가 구분되고 색 외 label/접근 가능한 날짜 이름이 있다.

### Test / Validation
G. 월·연·윤일·자정·DST, 로그 여러 개의 중복 제거, archived 제외 테스트. keyboard 월 이동/날짜 선택 및 sidebar 220–260px 내부 시각 확인.

## TASK-022 — Today의 Due·Created·Updated·Completed

### Phase
Phase 7 — Time Views

### 목표
오늘 예정·생성·진행·완료한 업무를 빠짐없이 모아 본다.

### 구현 범위
TASK-021 날짜 service를 재사용한 Today list/timeline. Due Today, Updated Today, Completed Today 및 Created Today 보조 섹션. 오늘 생성만 된 Card도 포함. 날짜 경계/탭 복귀 시 갱신, Card 상세 연결.

### 예상 수정 파일
예상 신규 `src/features/today/TodayPage.tsx`, `useToday.ts`와 테스트; 예정 `src/services/date-work.ts`, router.

### Dependencies
TASK-021

### Parallel
Yes — TASK-027의 독립 PWA 설정과 가능하나 기본 순서를 권장.

### 기술 고려사항
Today 포함 조건은 OR, 섹션 내는 Card별 1행. Updated는 오늘 작성 로그를 근거로 하며 단순 Card 편집과 구분. 같은 Card가 서로 다른 이유의 섹션에 나타날 수는 있다.

### 디자인 고려사항
DESIGN §29/32–34: 시간 중심 list/timeline, 시간+진행 요약+Card 맥락. 전체 Kanban을 복제하지 않으며 Created는 필요한 작은 보조 그룹으로 배치.

### Acceptance Criteria
- due/created/new WorkLog/completed 각각 단독 조건으로도 Today에서 찾을 수 있다.
- 같은 섹션에 중복 Card가 없고 모든 항목에서 상세를 열 수 있다.
- 자정 이후 재로딩 없이 오늘 날짜와 그룹이 바뀐다.

### Test / Validation
G. 4가지 포함 조건 각각/교집합, 생성만 된 Card, 과거 로그 편집, 로그 삭제, 자정 및 날짜 화면과의 일관성 테스트. 양 테마 list 시각 확인 후 Phase 7 Gate.

## TASK-023 — Persistent Storage와 로컬 설정

### 상태
완료 (2026-09-08) — Batch 5 Validation Gate 및 Storage API 분기·테마 재열기/OS 연동 테스트 통과

### Phase
Phase 8 — Data Safety (조기 구현)

### 목표
브라우저 저장 상태를 정확히 알리고 테마 선택을 보존한다.

### 구현 범위
Storage API 지원 여부와 persisted 상태 조회, 사용자가 실행하는 persist 요청, 허용/거절/미지원/실패 상태. settings repository에 System/Light/Dark 저장, 초기 로드와 OS 변경 동작 연결. Settings의 Data/Application/About 기본 영역과 app version/IndexedDB/schema version 표시.

### 예상 수정 파일
예상 신규 `src/services/storage-status.ts`, `src/repositories/settings.ts`, `src/features/settings/StorageStatus.tsx`, `ThemeSettings.tsx`와 테스트; 예정 SettingsPage/ThemeProvider.

### Dependencies
TASK-010, TASK-004

### Parallel
Yes — TASK-024/025의 service 작업과 가능(권장 순서에서는 그 뒤).

### 기술 고려사항
미지원/거절도 정상 사용 가능, API error를 permanent success로 표시하지 않는다. persistence는 영구 보존 보장이 아니며 같은 브라우저/profile/origin의 저장소임을 설명. 시스템 설정에는 업무 데이터가 필요하지 않다.

### 디자인 고려사항
DESIGN §31/34–35/40/42: 작고 명확한 상태 row, 조용한 설명, 과도한 경고 banner 없음. theme control은 다른 compact control과 일관.

### Acceptance Criteria
- 지원/미지원/거절/허용/오류 상태가 실제 결과와 맞고 데이터는 유지된다.
- Theme 선택이 재열기 후 보존되며 System만 OS 변경을 따른다.
- Settings에 version/storage/schema 정보가 실제 값으로 표시된다.

### Test / Validation
G. Storage API 각 분기 mock, preference 재열기/OS 변경, DB 불가 상태 테스트. 실제 브라우저 요청/상태와 테마 시각 확인.

## TASK-024 — Backup export와 전체 payload validation

### 상태
완료 (2026-09-08) — Batch 4 Validation Gate 및 전체 snapshot·invalid corpus·export/validate 왕복 테스트 통과

### Phase
Phase 8 — Data Safety (Core Domain 직후 조기 구현)

### 목표
모든 업무 데이터를 일관되게 내보내고 불완전한 백업을 쓰기 전에 차단한다.

### 구현 범위
read transaction에서 5개 collection 전체 snapshot(archived 포함), app/schemaVersion/exportedAt envelope와 filename 생성. JSON parse 및 unknown 기반 전체 검증, import 준비용 새로운 안전한 객체 배열 생성. UI 없이 export/validation service부터 완성.

### 예상 수정 파일
예상 신규 `src/services/backup/export.ts`, `validate.ts`, `prepare.ts`, `backup.test.ts`; 예정 `src/types/backup.ts`, repositories read boundary.

### Dependencies
TASK-009

### Parallel
Yes — TASK-010 shell 작업과 가능. 기본 순서에서는 먼저 수행.

### 기술 고려사항
검증 대상: app/version, 필수 배열, 필드 타입/필수값, enum, ISO timestamp/date-only, finite sortOrder, entity ID 중복, CardTag 중복, Category/Tag/Card/WorkLog 참조 무결성. optional timestamp 및 알려진 status/completedAt 계약도 검증. 미지원 version은 명시적으로 거부. JSON 복사/검증 중 current DB 변경 없음.

### 디자인 고려사항
UI 없음. DESIGN §34에 맞는 사용자 오류 분류(형식/버전/필드/관계)를 준비하고 raw stack이나 전체 업무 payload를 오류 문구에 노출하지 않는다.

### Acceptance Criteria
- export에 모든 업무 collection·원문·관계·archived 데이터가 포함된다.
- filename은 `histask-backup-YYYY-MM-DD.json`, envelope는 PRD §30과 일치한다.
- payload 마지막 항목이 잘못되어도 전체 실패하며 DB write 호출이 0이다.
- 정상 export는 같은 validator를 통과하고 장치 테마를 업무 backup 필수 필드로 강제하지 않는다.

### Test / Validation
G. empty/populated/archived export, concurrent write 중 일관된 snapshot, 각 invalid field/ID/관계/중복/미지원 version corpus. 검증 전후 DB 동일성과 export→validate 왕복 테스트.

## TASK-025 — Transactional restore와 전체 삭제 service

### 상태
완료 (2026-09-08) — Batch 4 Validation Gate 및 replace/delete rollback·재열기·파생 조회 갱신 테스트 통과

### Phase
Phase 8 — Data Safety (UI 이전 조기 구현)

### 목표
복원·전체 삭제가 부분 성공으로 데이터를 손상시키지 않는다.

### 구현 범위
검증·준비 완료 payload만 받는 replace service, 모든 업무 table clear+bulk insert 단일 readwrite transaction. export/import schema 호환 경계 명시. 전체 데이터 삭제도 단일 transaction으로 구현하고 settings를 포함. import 후 구독 데이터 전체 갱신.

### 예상 수정 파일
예상 신규 `src/services/backup/import.ts`, `src/services/delete-all-data.ts`, `src/services/backup/import.test.ts`; 예정 db/repository transaction helpers.

### Dependencies
TASK-024

### Parallel
No

### 기술 고려사항
v0.1은 Replace만 제공, merge 없음. 임의 타입 assertion으로 validation을 우회하지 못하는 service 계약. 파일 read/parse/준비는 transaction 이전에 완료. import는 settings 보존, Delete All은 settings까지 삭제. 테스트 DB 외 DB 자체 delete API를 recovery로 사용하지 않는다.

### 디자인 고려사항
DESIGN §34/40: confirm UI가 호출하는 mutation 경계를 분리한다. 성공은 commit 이후에만 알리며 실패 시 이전 데이터 보존 사실을 정확히 전달한다.

### Acceptance Criteria
- 유효 payload가 전체 업무 dataset을 교체하고 이전 행이 남지 않는다.
- clear 후 insert 중간 실패에도 이전 5개 collection이 모두 복구된다.
- invalid payload는 replace에 진입하지 않는다. 삭제 중 오류도 전체 rollback한다.
- import 후 latest/count/dashboard projection이 새 dataset에서 다시 계산된다.

### Test / Validation
G. populated→다른 dataset, empty import, 중간 table insert 실패, duplicate/orphan 검증 실패, 재열기, archive 보존, theme 보존 및 전체 삭제/settings reset 테스트.

## TASK-026 — Settings의 백업·복원·DELETE 확인 UI

### 상태
완료 (2026-09-08) — Batch 5/Phase 8 Validation Gate 및 local export/import·무변경 실패·확인/focus 테스트 통과

### Phase
Phase 8 — Data Safety (업무 입력 UI 이전 완료)

### 목표
사용자가 업무 입력을 시작하기 전에 로컬 백업과 안전한 복원 경로를 쓸 수 있다.

### 구현 범위
Export Backup local download, Import Backup file input/읽기/parse/validate/prepare, 검증된 파일의 collection 수·교체 영향 표시 후 확인. Delete All Data에 정확한 DELETE 입력 요구. 취소/오류/저장 중/성공 안내, 버튼 중복 실행 차단. 교체 완료 후 열린 Card/선택/파생 UI 상태 정리.

### 예상 수정 파일
예상 신규 `src/features/settings/BackupControls.tsx`, `ImportBackupDialog.tsx`, `DeleteAllDataDialog.tsx`와 테스트; 예정 SettingsPage/common confirm UI.

### Dependencies
TASK-023, TASK-025

### Parallel
No

### 기술 고려사항
파일은 브라우저 로컬에서만 읽고 fetch/upload하지 않는다. 파일 선택만으로 변경하지 않는다. valid preview는 검증한 동일 payload를 확인 후 사용하며 다른 파일 선택 시 확인 상태를 초기화. Object URL cleanup, write lock/pending, quota 실패 안내.

### 디자인 고려사항
DESIGN §32–34/40/42: compact Data section, 명확한 교체/삭제 영향, destructive action 구분, focus-managed dialog. 일반 작업 전체를 과도한 경고로 덮지 않는다.

### Acceptance Criteria
- export 파일을 로컬에서 다시 읽어 모든 업무 데이터를 복원할 수 있다.
- invalid backup은 명확한 사유를 표시하고 DB는 불변이다.
- 유효 파일 전체 검증 이후에만 Replace 확인이 가능하며 취소 시 무변경이다.
- 정확한 DELETE 이전에 전체 삭제 버튼 비활성, 실행 후 DB/settings/UI가 일치한다.
- Storage 상태/Application/About까지 연결되어 Phase 8 사용자 경로가 완성된다.

### Test / Validation
G. 파일 읽기 실패/invalid/미지원 version/확인 취소/replace 성공·실패, DELETE 대소문자·미입력·취소, download MIME/filename 및 focus 테스트. 실제 브라우저 로컬 파일 round trip 확인 후 Phase 8 Gate. TASK-016에서 board/drawer 연결 이후 추가 회귀 검증.

## TASK-027 — Installable PWA와 offline app shell

### Phase
Phase 9 — Release Quality

### 목표
최초 로드 이후 네트워크 없이 앱을 시작하고 설치할 수 있다.

### 구현 범위
vite-plugin-pwa 통합, manifest(name/short_name/start_url/scope/display/theme/background/icons), 로컬 icon 자산, 정적 app shell precache, service worker 등록. 갱신 시 편집 중 강제 reload하지 않는 update 안내. hash route 시작/새로고침과 offline fallback 검증.

### 예상 수정 파일
기존 `vite.config.ts`, `package.json`, `package-lock.json`, `index.html`, `public/`; 예상 신규 `src/app/pwa.ts`, 필요한 작은 update UI 및 manifest/icon 자산.

### Dependencies
TASK-010, TASK-026

### Parallel
Yes — TASK-021/022와 설정 변경을 분리하면 가능.

### 기술 고려사항
PWA cache에는 static assets만 저장, 사용자 payload는 IndexedDB. CDN font/remote task API 없음. cache 갱신이 DB migration/reset을 대신하지 않는다. 서비스 워커 검증은 production build의 localhost 또는 적절한 secure context에서 수행.

### 디자인 고려사항
DESIGN §8/33–37: 자체 font/icon, compact update 안내, 저장 중 내용 보호, 장식 animation 없음. 앱 icon도 작업 도구 성격에 맞추며 별도 브랜드 프로젝트로 확대하지 않는다.

### Acceptance Criteria
- manifest와 필요한 icons가 로컬에서 제공되고 지원 브라우저에서 install 가능하다.
- 최초 로드/활성화 후 offline 시작·route refresh가 된다.
- service worker update 뒤 IndexedDB 업무 데이터가 남고 편집 중 자동 새로고침을 강요하지 않는다.
- cache/network에 업무 데이터가 없다.

### Test / Validation
G. production preview에서 manifest/install/service worker lifecycle, offline restart, app update 전후 데이터 보존 확인. dev-server 접속 성공만으로 통과하지 않는다.

## TASK-028 — 실제 브라우저 offline·데이터 안전 통합 QA

### Phase
Phase 9 — Release Quality

### 목표
메모리 mock 밖의 브라우저 환경에서도 Local-first 전체 흐름이 동작함을 확인한다.

### 구현 범위
가상 업무 데이터를 사용한 production preview/설치 PWA QA. 네트워크 차단 후 PRD §35 전체 동작, refresh/reopen/새 앱 버전, local backup 왕복 검증. network inspector로 사용자 업무 데이터 전송이 없는지 확인. 발견한 실제 버그에 회귀 테스트 추가.

### 예상 수정 파일
예상 신규 또는 갱신 `src/test/`의 필요한 회귀 테스트; 버그가 확인된 feature/service/PWA 파일만 수정. 재현 절차는 예정 README QA 부분에 간결히 기록.

### Dependencies
TASK-016, TASK-020, TASK-022, TASK-027

### Parallel
No

### 기술 고려사항
fake-indexeddb는 실제 storage eviction/permission/service worker를 대체하지 못한다. offline 검증은 모든 창을 닫았다가 다시 여는 경우까지 포함. 무효 import/쓰기 실패는 current dataset 보존을 대조한다.

### 디자인 고려사항
DESIGN §32–35/46: offline이 일상 사용 상태이므로 불필요한 차단 banner 없음. 오류는 해당 동작 위치에서 명확히 표시하며 보드 계층을 유지.

### Acceptance Criteria
- offline 시작, Card/WorkLog/Category/Tag CRUD, search/filter/sort/drag, dashboard/calendar/Today, backup export, Settings 접근이 모두 된다.
- 추가로 offline local restore와 재열기 후 데이터 일치도 확인한다.
- 불필요한 runtime 외부 요청이나 업무 데이터 전송, 차단성 console 오류가 없다.
- 새 PWA asset version 이후 기존 업무 데이터/이력이 유지된다.

### Test / Validation
G + 실제 지원 desktop 브라우저에서 offline checklist. 설치/브라우저별 제약은 수행 환경과 함께 기록하고 미실행 항목을 PASS로 처리하지 않는다.

## TASK-029 — 반응형·테마·접근성 전체 일관성 검토

### Phase
Phase 9 — Release Quality

### 목표
기존 화면을 유지하면서 모든 크기·입력 방식에서 작업 가능하게 마무리한다.

### 구현 범위
desktop/tablet/mobile 전 화면 검토, layout/focus/contrast/scroll 관련 실제 결함 수정. Theme 영속화/OS 전환, tooltip/overlay/drag 대체 동작, reduced motion, 긴 텍스트, 빈 데이터/다량 가상 데이터 QA. 필요 시 합의된 breakpoint/token만 조정.

### 예상 수정 파일
예정 `src/index.css`, `src/components/layout/`, `src/components/ui/`, 문제가 확인된 `src/features/`와 접근성 회귀 테스트.

### Dependencies
TASK-028

### Parallel
No

### 기술 고려사항
기능/저장소 전면 재작성 금지. keyboard tab order/aria-live/label/overlay stack 확인. 수백~수천 Card fixture에서 명백한 반복 scan/렌더만 bounded 개선. 접근성을 위해 필요한 mobile target 크기 조정은 compact desktop 규칙과 구분.

### 디자인 고려사항
DESIGN §5–47 전체 review. desktop sidebar+board+420–520px drawer, tablet sidebar collapse와 가로 board, mobile sidebar sheet/near-full detail. 4열을 화면 폭에 억지로 축소하지 않음.

### Acceptance Criteria
- 1440×900 및 1366×768 desktop, 768×1024 tablet, 390×844 mobile에서 핵심 CRUD·검색·backup 접근 가능.
- desktop sidebar 220–260px/compact metrics/card hierarchy가 유지되고 mobile은 의도된 board 가로 스크롤 외 페이지 넘침 없음.
- 일반 텍스트 대비 4.5:1, 큰 텍스트 및 필요한 비텍스트 UI 대비 3:1을 기준으로 확인. focus ring/키보드 tooltip/비색상 status/aria label/focus 복귀 충족.
- 양 테마와 System에서 같은 정보 계층, timeline 유지. DESIGN 금지 스타일이 없다.

### Test / Validation
G. 실제 viewport screenshot/시각 검토, keyboard-only 핵심 흐름, screen reader 기본 이름/역할/순서 확인. 새로운 자동 접근성 도구는 실제 필요 시 의존성 정책에 따라 도입하고 수동 검토를 대체하지 않는다.

## TASK-030 — 문서·최종 release Gate

### Phase
Phase 9 — Release Quality

### 목표
실제 구현과 검증 결과가 일치하는 v0.1 사용·개발 안내를 완성한다.

### 구현 범위
README를 Histask 목적, NVM/npm 실행·검증, 로컬 저장/profile/origin, 백업·복원/DELETE, PWA/offline/설치/업데이트, 테마/단축키, 데이터 경계·schema/migration 원칙으로 갱신. package version 표시와 문서 일치. Coverage Matrix/Final Checklist를 구현과 대조. 범위 변경 없이 필요한 최종 결함만 수정.

### 예상 수정 파일
기존 `README.md`, release version 정리가 필요한 경우 `package.json`/`package-lock.json`; 명시적으로 계획 유지보수가 요청된 경우 `DEVELOPMENT_PLAN.md`. 구조 설명이 README로 부족한 경우에만 `ARCHITECTURE.md` 또는 `DATABASE.md` 추가. 기준 문서의 요구사항을 구현에 맞추어 낮추지 않는다.

### Dependencies
TASK-029

### Parallel
No

### 기술 고려사항
성공한 실제 명령/브라우저/OS/제약을 기록. 미검증 항목·알려진 blocking 오류가 남으면 release 완료 표시 금지. production 자동 seed/외부 analytics/비밀정보/실제 업무 fixture 없음 확인. commit/push는 별도 요청 시에만 수행.

### 디자인 고려사항
DESIGN §46의 15개 질문과 §44 금지 항목을 최종 확인하되 여기서 처음 디자인을 적용하는 방식은 금지. 문서는 실제 화면 label과 동작을 따른다.

### Acceptance Criteria
- README만으로 환경 준비/실행/검증/로컬 backup/restore/offline 사용을 재현할 수 있다.
- PRD와 Design coverage의 필수 항목이 구현·테스트에 모두 연결된다.
- Final Acceptance Checklist 완료 증거가 있고 build/lint/type/test 및 실제 브라우저 QA에 blocker가 없다.
- 실제 수행 내용·주요 변경 파일·각 검증 명령 결과·실제 남은 문제를 완료 보고한다.

### Test / Validation
G를 최종 실행. 문서 명령과 실제 scripts 일치, production preview smoke 및 앞서 검증한 offline/design 결과 검토. 변경이 있으면 영향을 받는 테스트/QA만 추가 반복하고 Phase 9 Gate 종료.

## Implementation Order

Phase는 기능 분류이며 번호가 실행 순서를 강제하지 않는다. 데이터 손실 위험을 먼저 낮추기 위해 Phase 8 service 및 Settings를 앞당긴다. 순서 변경 이유는 backup을 마지막 장식 기능으로 남기지 않으면서 shell 구현 전에는 순수 service를 검증할 수 있기 때문이다.

```text
TASK-001 → TASK-002 → TASK-003                 Foundation
→ TASK-004 → TASK-005                         DB / Repository
→ TASK-006 → TASK-007 → TASK-008 → TASK-009   Core Domain / WorkLog
→ TASK-024 → TASK-025                         Backup 검증 / 원자적 복원
→ TASK-010 → TASK-023 → TASK-026              Shell / Storage / Data Safety UI
→ TASK-011 → TASK-012 → TASK-013              Board / Metrics / Drag
→ TASK-014 → TASK-015 → TASK-016              Detail / Timeline / Core regression
→ TASK-017 → TASK-018 → TASK-019 → TASK-020   Search / Filter / Classification / Keys
→ TASK-021 → TASK-022                         Calendar / Today
→ TASK-027 → TASK-028                         PWA / Offline QA
→ TASK-029 → TASK-030                         Cross-screen quality / Release docs
```

- TASK-026 완료 전 업무 입력 board를 연결하지 않는다. 실제 사용자 데이터로 시험하기 전 export/import 왕복을 가상 dataset으로 검증한다.
- TASK-007/009에서 최신 이력 계산을 먼저 검증하고 TASK-011에서 바로 preview를 구현한다. TASK-015/016에서 화면 동기화까지 완성하여 이후 기능의 기준점으로 유지한다.
- Phase 1/2/3 Gate는 해당 group 종료 시 실행. Phase 8 Gate는 TASK-026, Phase 4 Gate는 TASK-013, Phase 5 Gate는 TASK-016, Phase 6 Gate는 TASK-020, Phase 7 Gate는 TASK-022, Phase 9 Gate는 TASK-030 완료 시 실행한다.
- 병행할 경우에도 Dependencies를 생략하지 않는다. 각 Batch 안의 화살표는 직렬 순서이며 Yes인 Task만 파일 충돌 없이 병행할 수 있다.

## Suggested Codex Batches

각 Batch는 2–4개 Task다. Validation의 G는 앞서 정의한 NVM LTS + 실제 lint/test/typecheck/build 전부를 의미한다. Batch는 구현과 해당 검증까지 포함하며 실패 시 다음 Batch로 넘기지 않는다.

| Batch | 목표 | 포함 Task (권장 내부 순서) | 주요 결과 | Validation | 다음 Batch 진입 조건 |
| --- | --- | --- | --- | --- | --- |
| 1 — Foundation | 기존 toolchain 보완과 공통 설계 계약 | TASK-001 → TASK-002 → TASK-003 | strict/tests, Tailwind/shadcn/tokens, types/dates | G + 양 테마 primitive·날짜 경계; Phase 1 Gate | 실제 test script와 타입/디자인 기반이 검증됨 |
| 2 — Data boundary | schema와 안전한 repository 기반 | TASK-004 → TASK-005 | v1 schema, 구독/transaction 경계 | G + DB 재열기/migration 실패/rollback; Phase 2 Gate | 데이터 보존 및 오류 전달 확인 |
| 3 — Core Domain | Card/WorkLog/분류의 일관성 | TASK-006 → TASK-007 → TASK-008 → TASK-009 | CRUD, 관계 삭제, 최신 로그, dashboard query | G + 핵심 domain 회귀; Phase 3 Gate | latest/count/unique-card 및 무손실 삭제 규칙 통과 |
| 4 — Restore foundation | UI 이전 백업 안전성 확보 | TASK-024 → TASK-025 | 전체 export/validation/transactional replace/delete | G + invalid corpus/왕복/실패 rollback | 유효 파일만 교체하고 오류 시 원본 보존 |
| 5 — Safe application entry | shell과 데이터 보호 사용자 경로 | TASK-010 → TASK-023 → TASK-026 | compact shell, persistence/theme/settings, backup/DELETE UI | G + local file round trip/확인 취소/focus; Phase 8 Gate | 업무 입력 전에 backup/restore 접근 가능 |
| 6 — Board | 진행 상태를 즉시 읽는 업무 보드 | TASK-011 → TASK-012 → TASK-013 | quick add/latest preview/5 metrics/drag | G + density/tooltip/drag rollback; Phase 4 Gate | 저장·이동과 최신 진행 표시 검증 |
| 7 — History workflow | 실제 업무 이력 작성 흐름 완성 | TASK-014 → TASK-015 → TASK-016 | drawer, WorkLog timeline, 핵심 flow 회귀 | G + create→progress→log→done 및 restore 후 preview; Phase 5 Gate | 기능·DB·시각적 WorkLog 계층 모두 일치 |
| 8 — Find & Organize | 검색·조건·분류·키보드 사용성 | TASK-017 → TASK-018 → TASK-019 → TASK-020 | 공통 query, compact filter/search, 분류 CRUD, shortcuts | G + 5개 검색 대상/AND/sort/IME/focus; Phase 6 Gate | sidebar·search·filter·drag 정책 일치 |
| 9 — Time Views | 날짜와 오늘의 업무 확인 | TASK-021 → TASK-022 | mini calendar/date groups/Today | G + today 4조건/월·자정·DST; Phase 7 Gate | Created-only 포함, 섹션 중복 방지, 날짜 일관 |
| 10 — Offline | 설치/단절 환경 신뢰성 | TASK-027 → TASK-028 | PWA static shell 및 offline 전체 기능 검증 | G + production install/restart/update/network 검사 | 실제 브라우저에서 업무 데이터 보존과 offline 사용 확인 |
| 11 — Release | 전 화면 품질과 운영 문서 | TASK-029 → TASK-030 | 반응형/a11y/theme 마무리, README, 최종 QA | G + viewport/keyboard/contrast 및 Final Checklist; Phase 9 Gate | 필수 요구 미완료·blocking 오류 없음, v0.1 완료 보고 가능 |

## PRD Coverage Matrix

아래는 필수 제품 범위 전체를 기능 단위로 연결한다. PRD의 예시 모델은 필수 필드/관계로 반영하며 선택적 미래 기능은 Task로 만들지 않는다.

| PRD 요구사항 | 근거 | Task |
| --- | --- | --- |
| Local-first / no backend/auth/external data | §1–6 | TASK-004, TASK-005, TASK-024–028, TASK-030 |
| 지정 stack / NVM / npm / Oxlint / Compiler 제외 | §5 | TASK-001, TASK-002, TASK-004, TASK-010, TASK-013, TASK-027 |
| Main layout / navigation / Settings 접근 | §7–8 | TASK-010, TASK-023, TASK-026, TASK-029 |
| Card 모델 / 고정 Status / Priority / ISO 시간 | §10–11 | TASK-003, TASK-004, TASK-006 |
| Card quick creation / CRUD / detail fields / metadata | §13–14 | TASK-006, TASK-011, TASK-014, TASK-016 |
| Archive 제외 / cascade delete | §25 | TASK-006, TASK-009, TASK-014, TASK-017, TASK-024 |
| WorkLog 독립 entity / CRUD / 부모 updatedAt | §6.3/15 | TASK-003, TASK-007, TASK-015, TASK-016 |
| Latest WorkLog / 2줄 / hover+focus tooltip / no-log | §12 | TASK-007, TASK-009, TASK-011, TASK-015, TASK-016 |
| WorkLog newest-first / Enter newline / Ctrl·Cmd save / delete confirm | §15 | TASK-007, TASK-015, TASK-020 |
| Category CRUD / Card 0–1 / 삭제 시 해제 | §16 | TASK-008, TASK-014, TASK-019 |
| Tag CRUD/color / 다중 연결 / 관계만 삭제 | §17 | TASK-008, TASK-014, TASK-019 |
| Dashboard 5 metrics / reactive / archive 제외 | §9/25 | TASK-009, TASK-012, TASK-016 |
| Updated Today unique Card / 신규 WorkLog 기준 | §9 | TASK-009, TASK-012, TASK-016 |
| Search title/description/category/tag/WorkLog → parent Card | §18 | TASK-017, TASK-018 |
| Category/Tag/Status/Priority/Due 조합 필터 / clear | §19 | TASK-017, TASK-018, TASK-019 |
| 5개 sorting / manual 기본 / recently updated | §20/24 | TASK-006, TASK-013, TASK-017, TASK-018 |
| isStale(card, days), stale UI 확대 없음 | §24 | TASK-003 |
| dnd-kit 열 이동/내부 순서/영속/실패 rollback | §21 | TASK-006, TASK-013, TASK-018 |
| Today Due/Created/새 WorkLog/Completed 포함 | §22 | TASK-003, TASK-021, TASK-022 |
| Mini calendar 월 탐색/활동/선택일 Due·Updated·Completed | §23 | TASK-021, TASK-022 |
| Dexie / schema v1 / indexes / repository / migration | §26–28 | TASK-004, TASK-005, TASK-006–008 |
| Persistent Storage 확인·요청·한계 표시 | §29 | TASK-023, TASK-026 |
| JSON 전체 export / filename / archive 포함 | §30 | TASK-024, TASK-026, TASK-028 |
| Backup 전체 validation 전 무변경 / Replace only / transaction | §31 | TASK-024, TASK-025, TASK-026, TASK-016 |
| Delete All / DELETE 확인 | §32 | TASK-025, TASK-026 |
| Settings Data/Application/About/version/schema | §33 | TASK-023, TASK-026, TASK-030 |
| System/Light/Dark 및 로컬 선택 보존 | §36 | TASK-002, TASK-023, TASK-029 |
| PWA install / static offline shell / IndexedDB 분리 | §34 | TASK-027, TASK-028 |
| Offline start/CRUD/search/filter/drag/dashboard/calendar/export/settings | §35 | TASK-028 |
| N, /, Esc, Ctrl·Cmd+Enter / 타이핑 방해 금지 | §37 | TASK-015, TASK-020, TASK-029 |
| Focus/aria/tooltip/contrast/dialog/non-color status | §38 | TASK-002, TASK-011, TASK-013–015, TASK-020, TASK-029 |
| Empty / no matches / clear filter | §39 | TASK-010–012, TASK-018, TASK-021–022 |
| Failed write/import/schema/migration 오류 / 자동 reset 금지 | §40 | TASK-004–008, TASK-013–015, TASK-024–026, TASK-028 |
| 최소 domain tests / integration workflow | §41 | TASK-001, TASK-003–009, TASK-013, TASK-016–018, TASK-024–025 |
| 개발 seed 선택 사항 / production 자동 seed 금지 | §42 | TASK-016, TASK-028, TASK-030 (test fixtures만 기본 계획) |
| v0.1 Definition of Done | §44 | TASK-028–030 및 아래 Final Acceptance Checklist |
| Non-goals / 미래 후보 제외 | §4/45 | 전 Task 범위 제한. Archive browser 등 미래 화면 없음 |

## Design Coverage Matrix

| 디자인 요구사항 | DESIGN 근거 | Task / 검증 포인트 |
| --- | --- | --- |
| Design Tokens / 중립 semantic colors | §6–7/10–12/41 | TASK-002, TASK-029: 중앙 토큰, border 중심, 과도한 radius/shadow 없음 |
| System fonts / 작은 typography / 단일 icon / restrained motion | §8–9/36–37/42 | TASK-002, TASK-027, TASK-029: 외부 font 없음, 13px UI/14px title/작은 icons |
| Compact Sidebar / header / content | §5/13 | TASK-010, TASK-019, TASK-029: 220–260px sidebar/48px header/32–36px nav |
| Compact Dashboard | §15 | TASK-012: 5개 수치 한 줄 또는 56–72px 낮은 row |
| Low-noise Kanban / drag feedback | §16/38 | TASK-011, TASK-013: 가벼운 열, 명확한 drop target, 미세 elevation |
| Latest WorkLog hierarchy / 2-line tooltip | §2/17–20 | TASK-009, TASK-011, TASK-015–016: 제목 다음 진행/hover+focus 원문 |
| Restrained Tags / Category / Priority / Due | §21–24 | TASK-011, TASK-019: 저채도 tag, 작은 category 색, 적절한 HIGH/overdue 강조 |
| WorkLog Timeline | §26–27 | TASK-015, TASK-016: newest-first 선/점/시간, avatar·bubble·reaction 없음 |
| Card Drawer / compact editing | §25/28 | TASK-014, TASK-015, TASK-029: 420–520px, dense field rows, 모바일 sheet |
| Mini Calendar | §14 | TASK-021: selected/today/activity 구분, 작은 점, 업무 날짜 navigation |
| Today list/timeline | §29 | TASK-022: 시간 중심, Created-only 누락 없음, full Kanban 복제 없음 |
| Search result hierarchy / compact filters | §30–31 | TASK-017–018, TASK-020: title/excerpt/분류, active chip/Clear all |
| Empty / Loading / Error | §32–34 | TASK-010–015, TASK-018–019, TASK-021–026: 최소 empty 안내/inline pending/구체적 실패 |
| Dark Mode / System / Light | §35 | TASK-002, TASK-023, TASK-029: 저장/OS 변경, 대비와 border 보존 |
| Responsive | §39 | TASK-010–011, TASK-014, TASK-018, TASK-029: collapse/sheet/board horizontal scroll |
| Accessibility | §40 | TASK-002, TASK-011, TASK-013–015, TASK-020–021, TASK-026, TASK-029: focus/tooltip/labels/contrast/destructive confirm |
| 금지 스타일 / 전체 review | §43–47 | 모든 UI Task + TASK-029–030: generic dashboard/Trello clone/hero/gradient/glass/rainbow/과한 여백 없음 |

## Final Acceptance Checklist

구현 전이므로 아래는 모두 미체크 상태다. 계획 작성 완료와 제품 구현 완료를 혼동하지 않는다.

### Build

- [ ] NVM LTS 환경과 npm lockfile을 사용하고 기존 Vite/React/TypeScript/Oxlint를 유지한다.
- [ ] 실제 `npm run lint`, `npm run test`, `npm run typecheck`, `npm run build`가 통과한다.
- [ ] TypeScript strict, 유효한 자동 테스트, production build가 있으며 차단성 console 오류가 없다.
- [ ] React Compiler/ESLint 전환/불필요한 대규모 dependency upgrade가 없다.

### Data

- [ ] Card/WorkLog/Category/Tag/CardTag가 개별 entity로 IndexedDB에 저장된다.
- [ ] schema v1 재열기·migration 보존/실패 테스트와 repository/transaction 경계가 있다.
- [ ] Card CRUD/status/sort/completion/archive 동작이 새로고침 후 유지된다.
- [ ] Category 삭제는 연결만 해제, Tag 삭제는 관계만 제거, Card 삭제는 WorkLog/CardTag cascade이며 실패 시 rollback한다.
- [ ] timestamp/date-only/로컬 today 의미가 일관되고 stale helper가 있다.
- [ ] 업무 데이터 전송, backend, 인증, cloud storage, analytics/telemetry/remote logging, 자동 DB reset이 없다.

### Board

- [ ] 4개 고정 열, quick title create, edit/archive/delete가 가능하다.
- [ ] 열 이동/내부 순서/비수동 정렬/필터링 중 이동 정책이 명확하고 재열기 후 유지된다.
- [ ] drag 실패는 UI/DB 양쪽을 이전 상태로 복구하며 drag 없는 대체 조작이 있다.
- [ ] 기본 board에서 archived Card가 제외된다.

### WorkLog

- [ ] 독립 history CRUD, 부모 updatedAt transaction, newest-first 순서가 맞다.
- [ ] Board에서 최신 로그가 제목 다음 계층에 보이고 최대 2줄이며 hover/focus 원문 tooltip이 된다.
- [ ] create/edit/delete/import 후 최신 preview/count가 즉시 재계산된다.
- [ ] 마지막 로그 삭제 후 no-log placeholder, 과거 로그 편집 시 생성 순서 유지가 맞다.
- [ ] Enter 줄바꿈, Ctrl/Cmd+Enter·Save 저장, IME 보호, 삭제 확인과 실패 입력 보존이 된다.

### Dashboard

- [ ] 비보관 Total/In Progress/Waiting/Done/Updated Today 5개가 반응형으로 정확하다.
- [ ] Updated Today는 오늘 새 WorkLog를 가진 Card를 한 번만 센다.
- [ ] 자정/탭 복귀 시 갱신하고 compact metrics row가 board 공간을 과도하게 소비하지 않는다.

### Search / Filter

- [ ] title/description/category/tag/WorkLog 검색이 부모 Card 단위이며 중복이 없다.
- [ ] Category/Tag/Status/Priority/Due 필터가 AND로 결합되고 Clear all이 실제 상태를 초기화한다.
- [ ] 5개 정렬, Manual default, Recent 기준 Card.updatedAt이 맞다.
- [ ] Category/Tag 이름·색·삭제·복수 Tag 연결 UI가 동작하며 검색/분류에 즉시 반영된다.

### Calendar / Today

- [ ] Mini Calendar 현재 월/월 이동/선택일과 due/completed/log indicator가 맞다.
- [ ] 날짜 선택 시 Due/Updated/Completed의 관련 Card를 찾는다.
- [ ] Today에서 due/created/새 WorkLog/completed 단독 조건 Card가 모두 포함된다.
- [ ] 섹션 내 중복 제거, 자정·월·윤일·DST 경계 및 상대/정확 시간 표시가 일관된다.

### Backup

- [ ] Storage API 상태/요청/미지원/거절/오류를 설명하고 영구 보존을 보장한다고 표현하지 않는다.
- [ ] export가 모든 업무 collection과 보관 이력을 포함하며 filename/envelope가 맞다.
- [ ] 전체 parse/validation/prepare 이후 확인을 거쳐 Replace transaction을 수행한다.
- [ ] invalid/incompatible/duplicate/orphan payload와 중간 쓰기 실패에서 기존 데이터가 그대로 남는다.
- [ ] 정상 export→import→재열기의 관계/원문/순서/최신 preview가 일치한다.
- [ ] Delete All은 정확한 DELETE 입력과 확인이 필요하고 모든 data/settings가 원자적으로 삭제된다.

### Offline / PWA

- [ ] 지원 브라우저에서 PWA 설치 및 최초 로드 후 offline 재시작/새로고침이 된다.
- [ ] offline Card/WorkLog/Category/Tag CRUD, search/filter/drag, dashboard/calendar/Today, export/Settings가 된다.
- [ ] local restore도 offline에서 검증되었고 static cache가 사용자 DB를 대체하지 않는다.
- [ ] PWA update 시 편집 강제 reload나 IndexedDB 손실이 없고 runtime 업무 데이터 외부 요청이 없다.

### Design

- [ ] compact/professional/information-dense/low-noise/desktop-first 계층을 전체 화면에서 유지한다.
- [ ] tokens/typography/spacing/radius/neutral border/작은 icons가 일관된다.
- [ ] Latest WorkLog, restrained tags, timeline, compact drawer/metrics/sidebar가 DESIGN 기준과 일치한다.
- [ ] generic shadcn dashboard, Trello 외형 복제, 대형 metric/card/text, heavy shadow, gradient, glassmorphism, rainbow tags, 과도한 여백이 없다.
- [ ] System/Light/Dark와 로컬 설정 보존이 되고 외부 font CDN에 의존하지 않는다.

### Accessibility

- [ ] focus ring, aria label, semantic buttons, 색 외 상태 표시와 충분한 대비가 있다.
- [ ] tooltip이 keyboard focus로 열리고 drawer/dialog focus trap·Esc·복귀가 된다.
- [ ] N / 검색 / Esc / Ctrl·Cmd+Enter가 올바른 문맥에서 동작하고 입력·IME를 방해하지 않는다.
- [ ] calendar·dropdown·삭제 확인·drag 대체 동작을 키보드로 수행할 수 있다.

### Responsive

- [ ] desktop에서 sidebar+board+우측 drawer가 업무 밀도를 유지한다.
- [ ] tablet sidebar collapse, mobile sidebar sheet와 near-full detail sheet가 작동한다.
- [ ] 작은 화면에서도 핵심 CRUD/검색/backup 접근이 가능하고 4열은 가로 스크롤로 유지된다.
- [ ] 긴 제목/로그/태그, 빈 상태, 다량 가상 데이터에서 잘림·가림·focus 접근 불가가 없다.

### Documentation

- [ ] README가 실제 npm scripts, NVM, 실행/검증, 저장 방식/한계, backup/restore/DELETE를 설명한다.
- [ ] PWA/offline/update, themes/shortcuts, schema/migration/repository 경계 설명이 실제 구현과 일치한다.
- [ ] PRD/Design coverage가 구현/테스트에 연결되고 미실행 검증을 성공으로 기록하지 않았다.
- [ ] production 자동 seed, 실제 업무 fixture/backup commit, 요청 없는 commit/push가 없다.

## 계획 자체 검토

이 항목은 **계획 문서의 검토 결과**이며 위 구현 체크리스트의 완료를 의미하지 않는다.

| 검토 질문 | 결과와 근거 |
| --- | --- |
| 1. PRD 요구사항 모두 연결? | PRD Coverage Matrix로 핵심 기능·설정·키보드·isStale·created-only Today·offline 전체 목록까지 연결했다. 선택적 seed는 테스트 fixture로 한정했다. |
| 2. AGENTS 위반 없음? | NVM/npm/Oxlint/strict/repository/transaction/no-reset/local-first와 Task별 테스트/Gate를 명시했다. 소스 구현·설치·commit을 이번 변경에서 제외했다. |
| 3. DESIGN이 UI 완료 조건에 반영됨? | 각 UI Task에 조항과 수치·정보 계층·focus/테마 조건을 넣었으며 Matrix와 최종 review가 있다. |
| 4. 로컬 실제 상태 반영? | 실제 package/lockfile/scripts/config/source/.gitignore/NVM/문서를 읽고 현재 lint/build 결과를 기록했다. 원격 상태를 사용하지 않았다. |
| 5. 완료된 설정을 재작업하지 않음? | Vite/React/Oxlint/npm을 유지하며 빠진 strict/test/Tailwind/shadcn/제품 계층만 추가하도록 했다. |
| 6. WorkLog 우선순위 충분? | TASK-007/009로 data correctness를 조기에 검증하고 첫 board TASK-011에서 latest preview를 제공한다. TASK-015/016에서 history와 통합한다. |
| 7. 데이터 손실 위험을 낮추는 순서? | migration/관계 삭제 테스트를 앞에 두고 TASK-024/025/023/026을 board 입력보다 앞당겼다. |
| 8. Batch 실행 가능? | 11개 Batch를 각 2–4개 Task로 구성하고 선행 조건/검증/진입 조건을 명시했다. |
| 9. Task 크기 적절? | data/domain/UI/회귀의 경계로 분할했다. export+validation과 restore는 실패 의미가 달라 분리했으며 사소한 파일별 Task는 만들지 않았다. |
| 10. 마지막 UI 전면 교체 위험 없음? | TASK-002에서 tokens를 먼저 적용하고 각 UI Task에서 density/light/dark/focus를 검증한다. TASK-029는 발견된 결함만 보완한다. |

제외 범위: Login/Signup, Backend API, Cloud DB/Sync, Multi-user/Collaboration, File attachment, Slack/Teams/Email/Google Calendar integration, AI, Recurring Task/Sub Task, Custom Status/Fields, Time Tracking/Gantt, Analytics/Telemetry, Electron/Tauri. Archive browser, merge import, stale dashboard 등 PRD의 미래 후보도 구현 Task에 포함하지 않았다.
