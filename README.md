# Histask

Histask는 브라우저 로컬 IndexedDB(`Dexie.js`)를 사용하는 Local-first 개인 업무 관리 애플리케이션입니다. 모든 업무 데이터는 외부 서버로 전송되지 않고 사용자 브라우저에만 저장되며, 각 업무 카드에서 **가장 최근 WorkLog 진행 이력**을 즉시 확인할 수 있도록 설계되었습니다.

> 현재 패키지 버전: `0.0.0` (`Histask v0.1` 기능 기준, DB 스키마 `2`, 백업 `schemaVersion: 1` — 앱 내 **Settings → About** 표시와 동일)

---

## 주요 기능 및 단축키

- **Kanban 보드 & Latest WorkLog**: `To Do`, `In Progress`, `Waiting`, `Done` 4개 열에서 카드를 관리하고, 각 카드에서 최신 WorkLog(최대 2줄 + hover/focus 원문 tooltip)를 바로 확인합니다.
- **드래그 및 비드래그 이동**: `@dnd-kit`으로 열 이동과 수동 정렬(`Manual`) 순서를 저장하며, 키보드/비드래그 사용자는 카드의 **Task actions** 메뉴로 상태 변경과 상하 이동을 수행할 수 있습니다.
- **WorkLog 타임라인**: 카드 상세 Drawer에서 최신순(`newest-first`) 진행 이력을 추가·수정·삭제합니다. 입력 중 `Enter`는 줄바꿈, `Ctrl/Cmd + Enter` 또는 **Save** 버튼으로 저장합니다.
- **실시간 Dashboard 지표**: 활성 필터와 독립적으로 비보관 기준 `Total`, `In Progress`, `Waiting`, `Done`, `Updated Today`(오늘 신규 WorkLog를 가진 고유 카드 수)를 표시합니다.
- **검색·조합 필터·정렬**: Global Search(`/`)로 제목·설명·Category·Tag·WorkLog 내용을 부모 카드 단위로 검색하고, Category·Tag·Status·Priority·Due 조건을 AND로 조합해 정렬할 수 있습니다.
- **Today & Mini Calendar**: 사이드바 Mini Calendar에서 날짜별 활동 표시를 확인하고, **Today**(`/#/today`) 및 날짜별 화면(`/#/date/YYYY-MM-DD`)에서 마감(Due)·갱신(Updated)·완료(Completed)·생성(Created) 기준 업무를 조회합니다.
- **테마·다국어 & 전역 단축키**: **Settings**에서 `System` / `Light` / `Dark` 테마와 인터페이스 언어(`System` / `English` / `한국어`)를 전환할 수 있으며, JSON 백업 파일은 드래그·드롭 또는 파일 선택으로 즉시 검증·요약 확인 후 복원할 수 있습니다. 입력창·모달 포커스·IME 조합 중이 아닐 때 `N`(새 카드), `/`(검색 포커스), `Esc`(모달·Drawer 닫기)가 동작합니다.

---

## PWA·오프라인 및 데이터 경계

- **PWA 오프라인 앱 셸**: `vite-plugin-pwa`(Workbox `registerType: 'prompt'`)로 정적 앱 셸(`index.html`, JS/CSS/SVG/PNG/manifest)만 precache합니다. 새 버전이 배포되면 편집 중인 내용을 강제 새로고침으로 덮어쓰지 않고 업데이트 알림 배너로 재적용 시점을 선택할 수 있습니다.
- **데이터 계층 분리**: IndexedDB(`Histask`)는 업무 데이터(Cards, WorkLogs, Categories, Tags, CardTags, Settings) 전용이며, Service Worker 정적 캐시를 데이터베이스 대용으로 사용하지 않습니다.
- **코드 경계**: 화면 계층은 `React UI → features/hooks & services → repositories → Dexie (IndexedDB)` 순으로만 접근하며, 백엔드 API·인증·클라우드 동기화·외부 텔레메트리는 포함하지 않습니다.

---

## Timestamp storage and migration

Business timestamps are stored as fixed-width UTC ISO strings (`YYYY-MM-DDTHH:mm:ss.sssZ`) so IndexedDB date indexes and latest WorkLog ordering use chronological order. Backup import accepts ISO timezone offsets and normalizes timestamps before replacement. Calendar-only `dueDate` values remain unchanged.

Database version 2 atomically normalizes existing version 1 timestamps, preserving task content, relationships, and settings. If normalization fails, the upgrade rolls back without resetting or deleting the database. Backup `schemaVersion` remains **1**: existing backup files remain compatible. Database and backup versions are independent.

---

## 로컬 개발 및 검증 환경

### Node.js 런타임 (`.nvmrc`)

Vite 8(`^20.19.0 || >=22.12.0`), Vitest 5(`^22.12.0 || ^24.0.0 || >=26.0.0`), Oxlint 등 프로젝트 의존성과의 호환성 및 Cloudflare Pages 빌드 환경의 일관성을 위해 루트 `.nvmrc`에 LTS 메이저 버전인 `24`를 지정합니다.

```bash
nvm use --lts
npm ci
npm run typecheck
npm run lint
npm run test
npm run build
```

---

## Cloudflare Pages 배포 및 운영 가이드

Histask는 별도의 백엔드 서버나 외부 데이터베이스 없이 정적 빌드 산출물(`dist/`)만으로 동작하므로 Cloudflare Pages 무료 플랜에서 비용 없이 운영할 수 있습니다.

### 1. Cloudflare Pages 프로젝트 생성 및 GitHub 연결 방법

Cloudflare 계정에 로그인한 뒤 관리자 대시보드에서 다음 순서로 설정합니다.

1. [Cloudflare Dashboard](https://dash.cloudflare.com/)에 로그인합니다.
2. 좌측 메뉴에서 **Compute (Workers & Pages)** → **Workers & Pages**를 선택합니다.
3. 우측 상단 **Create** 버튼을 클릭하고 상단 탭에서 **Pages** 탭을 선택합니다.
4. **Import an existing Git repository**(기존 Git 저장소 가져오기)에서 **Get started**를 클릭합니다.
5. GitHub 계정을 연결하고 대상 저장소인 **`GGUDUCK2/histask`**를 선택한 뒤 **Begin setup**을 클릭합니다.

### 2. 빌드 설정값 (Build Settings)

프로젝트 설정 화면에서 아래와 같이 입력합니다.

| 항목 | 설정값 | 비고 |
| --- | --- | --- |
| **Project name** | `histask` | 기본 도메인 `histask.pages.dev` (이미 사용 중이면 고유 이름 지정) |
| **Production branch** | `main` | `main` 브랜치 푸시 시 Production 배포 |
| **Framework preset** | `React (Vite)` (또는 `Vite`) | 선택 시 빌드 명령/출력 폴더 자동 입력 |
| **Build command** | `npm run build` | `tsc -b && vite build` 실행 |
| **Build output directory** | `dist` | 정적 빌드 결과물 디렉터리 |
| **Root directory** | `/` (비워둠) | 저장소 루트 기준 |
| **Node.js 버전** | `.nvmrc` (`24`) 자동 인식 | 필요 시 환경 변수 `NODE_VERSION` = `24` 추가 가능 |

입력 후 **Save and Deploy**를 클릭하면 최초 빌드가 시작됩니다.

### 3. Production 브랜치 및 GitHub 자동 배포 흐름

GitHub 통합이 연결되면 별도의 GitHub Actions 워크플로 없이 다음 흐름으로 자동 배포됩니다.

1. 로컬에서 코드를 수정하고 검증(`npm run typecheck && npm run lint && npm run test && npm run build`)합니다.
2. `main` 브랜치에 커밋을 푸시(`git push origin main`)합니다.
3. Cloudflare Pages가 푸시 이벤트를 감지해 자동으로 `npm clean-install` 및 `npm run build`를 수행합니다.
4. 빌드가 성공하면 `dist/` 산출물을 Production 도메인(`https://histask.pages.dev`)에 즉시 배포합니다.
5. 만약 타입 오류나 빌드 실패가 발생하면 배포가 중단되며, **기존 정상 운영 중인 Production 배포가 그대로 유지**됩니다.

### 4. Preview 배포 사용 방법

- `main` 이외의 기능 개발 브랜치(예: `feat/board-ui`)를 GitHub에 푸시하거나 Pull Request를 생성하면 Cloudflare Pages가 자동으로 **Preview 배포 URL**(`https://<해시>.histask.pages.dev` 또는 `https://<브랜치명>.histask.pages.dev`)을 생성합니다.
- **데이터 격리 주의**: 브라우저의 IndexedDB는 **Origin(프로토콜 + 도메인 + 포트)** 단위로 격리됩니다. 따라서 Preview 서브도메인의 IndexedDB와 Production 도메인(`https://histask.pages.dev`)의 IndexedDB는 완전히 분리되어 서로의 데이터를 덮어쓰지 않습니다.
- Preview 배포 설정을 제어하려면 Cloudflare Dashboard → **Workers & Pages** → **`histask`** → **Settings** → **Builds & deployments** → **Preview deployments**에서 활성화 여부를 관리할 수 있습니다.

### 5. 라우팅 및 개인 운영 보안 설정

- **클라이언트 라우팅**: Histask는 정적 호스팅 새로고침 안정성을 위해 `createHashRouter`(`/#/all`, `/#/today`, `/#/in-progress`, `/#/waiting`, `/#/completed`, `/#/settings`)를 사용하며, 동시에 Cloudflare Pages는 최상위 `404.html`이 없을 때 모든 경로를 `/index.html`(`200 OK`)로 전달하는 기본 SPA fallback을 제공합니다.
- **보안 헤더 및 검색엔진 노출 방지 (`noindex`)**:
  - `index.html`의 `<meta name="robots" content="noindex, nofollow" />`와 `public/_headers`의 `X-Robots-Tag: noindex, nofollow`가 함께 적용되어 검색엔진 크롤러의 색인을 방지합니다.
  - `public/_headers`를 통해 `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `Permissions-Policy`가 응답 헤더에 자동 포함됩니다.
  - **중요**: `noindex` 설정은 검색엔진 색인만 제한할 뿐 **인증(Authentication)이나 접근 통제(Access Control)를 의미하지 않습니다.** 모든 업무 데이터는 서버가 아닌 방문자 본인의 브라우저 IndexedDB에만 저장되므로 제3자가 URL에 접속하더라도 사용자의 업무 데이터를 볼 수는 없지만, 앱 화면 자체에 대한 접근 제한이 필요한 경우 **Cloudflare Zero Trust (Access)** 무료 플랜의 이메일 OTP 정책을 해당 Pages 도메인에 연결할 수 있습니다.

### 6. 배포 실패 시 확인할 항목

Cloudflare Dashboard → **Deployments** → 실패한 배포의 **View build** 로그에서 다음 항목을 확인합니다.

1. **Node.js 버전 확인**: 빌드 로그 상단에서 Node.js 24(또는 22.13+ 이상)가 사용되었는지 확인합니다. 만약 구버전 빌드 이미지가 사용되어 `.nvmrc`가 인식되지 않는다면:
   - **Settings** → **Build** → **Build system version**이 최신(v2 이상)인지 확인하거나,
   - **Settings** → **Variables and Secrets**에 `NODE_VERSION` = `24`를 추가합니다.
2. **타입 검사 및 빌드 오류**: `npm run build`는 `tsc -b && vite build`를 실행하므로 TypeScript 엄격 검사 오류가 있으면 빌드가 실패합니다. 로컬에서 `npm run typecheck` 및 `npm run build`를 먼저 실행해 원인을 해결합니다.
3. **`package-lock.json` 동기화**: 의존성을 변경한 경우 반드시 `package-lock.json`이 함께 커밋되었는지 확인합니다.

### 7. 이전 배포로 되돌리는 방법 (Rollback)

배포 후 문제가 발견되면 코드를 되돌리지 않고도 Cloudflare 관리자 화면에서 즉시 이전 버전으로 롤백할 수 있습니다.

1. Cloudflare Dashboard → **Workers & Pages** → **`histask`** → **Deployments** 탭으로 이동합니다.
2. 정상 동작했던 이전 Production 배포 항목 우측의 **`⋮` (더보기 메뉴)**를 클릭합니다.
3. **Rollback to this deployment**를 클릭하고 확인하면 수 초 내에 해당 버전으로 복원됩니다.
4. **참고**: 정적 앱 코드는 이전 버전으로 되돌아가지만, 사용자 브라우저의 IndexedDB 데이터는 삭제되지 않고 그대로 보존됩니다. (단, DB 스키마 버전을 올린 배포 이후 구버전 코드로 롤백하는 경우 구버전 코드가 상위 DB 버전을 열지 못할 수 있으므로 스키마 변경 배포 전에는 반드시 JSON 백업을 먼저 내보내야 합니다.)

### 8. 데이터 백업과 복원 방법

Histask의 모든 업무 데이터는 서버가 아닌 **현재 사용 중인 기기·브라우저 프로필·도메인의 IndexedDB(`Histask`)**에 저장됩니다.

- **백업 내보내기 (Export)**:
  1. 우측 상단 톱니바퀴 아이콘(**Settings**, `/#/settings`)으로 이동합니다.
  2. **Data** 섹션의 **Export backup**에서 **Export** 버튼을 클릭합니다.
  3. `histask-backup-YYYY-MM-DD.json` 파일이 로컬 PC에 다운로드됩니다. (모든 Card, WorkLog, Category, Tag, CardTag 및 보관된 카드 포함)
- **백업 복원하기 (Import)**:
  1. **Settings** → **Data** 섹션의 **Import backup**에서 백업 JSON 파일을 선택합니다.
  2. 파일 형식·스키마·참조 무결성 검증이 통과되면 카드 및 WorkLog 개수가 표시되고 **Review** 버튼이 활성화됩니다.
  3. **Review**를 클릭한 뒤 확인 대화상자에서 **Replace data**를 클릭하면 단일 트랜잭션으로 전체 데이터가 안전하게 교체됩니다. (검증 실패 시 기존 데이터는 일절 변경되지 않습니다.)
- **브라우저 저장소 보호 요청**:
  - **Settings** → **Data** → **Browser storage**에서 **Request persistence** 버튼을 클릭해 브라우저가 저장 공간 부족 시 임의로 IndexedDB를 정리하지 않도록 요청할 수 있습니다. (단, 브라우저 캐시/사이트 데이터 수동 삭제 시에는 지워질 수 있으므로 주기적인 JSON 백업을 권장합니다.)
- **전체 데이터 영구 삭제**:
  - **Settings** → **Data** → **Delete all data** → **Delete…**에서 확인 문구 `DELETE`를 정확히 입력해야 모든 카드, WorkLog, Category, Tag, CardTag 및 로컬 테마 설정이 단일 트랜잭션으로 삭제됩니다. (삭제 시 테마는 `System` 기본값으로 복귀합니다.)

### 9. 도메인 변경 시 데이터 마이그레이션 주의사항

브라우저 보안 정책(Same-Origin Policy)에 따라 IndexedDB는 **정확한 도메인(Origin)**에 귀속됩니다.

- `http://localhost:5173` ↔ `https://histask.pages.dev` ↔ 향후 연결할 커스텀 도메인(예: `https://app.histask.com`)은 모두 **서로 다른 IndexedDB 저장소**를 가집니다.
- 도메인을 변경하거나 다른 PC/브라우저로 이동할 때 데이터가 자동으로 이전되지 않으므로 반드시 다음 절차를 따릅니다.
  1. **기존 도메인**(예: `https://histask.pages.dev/#/settings`)에 접속해 **Export backup**으로 최신 `histask-backup-YYYY-MM-DD.json` 파일을 다운로드합니다.
  2. **새 도메인**(예: `https://app.histask.com/#/settings`)에 접속해 **Import backup**으로 방금 받은 JSON 파일을 선택하고 **Review** → **Replace data**로 복원합니다.
  3. 새 도메인에서 데이터가 정상적으로 표시되는지 확인하기 전까지 기존 도메인의 브라우저 사이트 데이터를 삭제하지 마십시오.

### 10. 향후 유료(커스텀) 도메인 연결 방법

추후 개인 브랜딩이나 공개 베타/SaaS 전환을 위해 커스텀 도메인을 연결하려면 다음 순서를 따릅니다.

1. **기존 도메인에서 JSON 백업 내보내기**: 도메인 전환 후 데이터를 옮길 수 있도록 현재 사용 중인 `*.pages.dev`에서 JSON 백업을 먼저 저장합니다.
2. Cloudflare Dashboard → **Workers & Pages** → **`histask`** → **Custom domains** 탭으로 이동합니다.
3. **Set up a custom domain** 버튼을 클릭하고 사용할 도메인(예: `histask.example.com` 또는 `example.com`)을 입력합니다.
4. 도메인 DNS가 Cloudflare에 등록되어 있다면 CNAME 레코드가 자동 생성되며, 외부 등록기관을 사용 중이라면 안내되는 CNAME 레코드(`<서브도메인> CNAME histask.pages.dev`)를 DNS 설정에 추가합니다.
5. SSL/TLS 인증서가 자동 발급(Active)되면 새 도메인으로 접속해 9번 절차에 따라 JSON 백업을 복원합니다.
