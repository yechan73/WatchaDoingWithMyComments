# Planning

Last reviewed: 2026-06-10

이 문서는 현재 앱 상태를 기준으로, 요청된 Watcha Pedia 브랜딩,
실사용 데이터 흐름, URL 입력 기반 데이터 변환, 포스터 보강, 게임성 개선을
구현 가능한 순서로 정리한다.

## Current Snapshot

- Next.js App Router 기반 퀴즈 앱이 동작한다.
- `src/data/users/*.json`의 로컬 정규화 데이터셋을 자동으로 읽어 홈 화면
  드롭다운에 표시한다.
- `Yechan comments` 데이터셋이 기본 순서의 첫 번째 데이터셋이다.
- 기존 예시 데이터셋은 `starter-comments`로 이름을 바꿨다.
- 홈 화면은 Watcha 로고 이미지, 문제 수, 난이도 설정을 보여준다.
- 브랜드 컬러는 Watcha Pink `#FF0558`와 Watcha Black `#000000`을 중심으로
  사용하고, UI 색상은 Pink, Black, White만 사용한다. 전역 폰트는 Noto Sans KR이다.
- 퀴즈 제한시간은 난이도에 따라 고정된다. 쉬움은 20초, 보통과 어려움은 15초다.
- 문제 풀이 중 홈 화면으로 돌아갈 수 있는 버튼이 있다.
- 정답 공개 시 포스터가 있으면 이미지를 보여주고, 없으면 설계된 빈 상태를
  보여준다.
- 로컬 정규화 스크립트 `scripts/normalize-watcha-comments.ts`는 JSON 또는
  명시적으로 지정한 로컬 HTML 파일을 `QuizItem[]`로 변환한다.

## Non-Negotiable Constraints

- 앱 런타임에서 Watcha API를 호출하지 않는다.
- Watcha 로그인 자동화, 쿠키 재사용, 인증 헤더 저장, HAR 커밋, 우회성
  크롤링을 구현하지 않는다.
- 다른 사람의 비공개 코멘트 데이터는 명시적 동의 없이 사용하지 않는다.
- 원본 데이터는 `data-raw/`에만 두고 기본적으로 커밋하지 않는다.
- 포스터 보강은 로컬 빌드/정규화 단계에서 수행하고, 결과 JSON만 앱에서
  읽는 구조를 우선한다.

## Request Analysis

### 1. Watcha Pedia 로고 적용

현재 홈 타이틀의 `Watcha` 부분은 사용자가 제공한 투명 배경 로고 이미지
`public/brand/watcha-logo.png`를 사용한다. 로고와 심볼에는 Watcha Pink를
우선 적용하고, 전체 UI는 Watcha Black 기반의 어두운 배경 위에 Pink를
강조색으로 사용한다.

Acceptance:

- 홈 첫 화면에서 브랜드가 작은 nav 텍스트가 아니라 명확한 첫 시각 신호로
  보인다.
- `Doing with My Comments`는 한 줄로 표시된다.
- Noto Sans KR이 전역 폰트로 적용된다.

### 2. 예시 표현 제거

사용자에게 보이는 데이터셋 이름과 문서의 현황 표현에서 예시 중심 표현을
제거한다. 테스트/요구사항 문서에 남은 과거 표현은 별도 정리 대상이다.

Acceptance:

- 홈 드롭다운의 기본 데이터셋은 `Yechan comments`다.
- 보조 데이터셋은 `Starter comments`로 표시된다.
- README와 모바일 QA 문서가 현재 앱 상태를 설명한다.

### 3. 프로필 URL 또는 코멘트 URL 입력으로 JSON 생성

완전 자동 수집은 신중하게 나눠야 한다. Watcha Pedia가 로그인 세션 또는
내부 API 응답을 요구하는 경우, 앱이나 스크립트가 쿠키/인증 헤더를 받아서
요청하는 방식은 구현하지 않는다.

허용 가능한 방향:

- 사용자가 저장한 로컬 JSON 파일을 정규화한다.
- 사용자가 저장한 로컬 HTML 파일을 명시적으로 `--input-format html`로
  정규화한다.
- Watcha Pedia 코멘트 URL 패턴은
  `https://pedia.watcha.com/ko/users/{userId}/comments`다. 예:
  `https://pedia.watcha.com/ko/users/VRZv4O9DPqr6y/comments`.
- 렌더링된 코멘트는 현재 `body > main > div[class*="_comments_"] > ul > li`
  형태로 나열되며, 각 `li` 안에서 영화 링크, 제목, 포스터 이미지, 코멘트 링크,
  코멘트 본문을 추출한다.
- 모든 코멘트를 포함하려면 페이지에서 스크롤을 내려 lazy-loaded 항목을 먼저
  로딩한 뒤 HTML을 저장해야 한다.
- URL 입력은 먼저 URL 종류를 판별하고, 필요한 로컬 저장 방법을 안내하는
  import wizard로 시작한다.
- 공개 접근 가능한 정적 HTML만 fetch하는 기능은 별도 검토 후 옵션으로 둔다.

권장 구현:

- `src/app/import/page.tsx`: URL, 파일 업로드, 변환 옵션을 받는 import 화면.
- `scripts/import-watcha-local.ts`: 로컬 파일 검증, 정규화, manifest 업데이트.
- `scripts/normalize-watcha-comments.ts`: URL을 직접 호출하지 않는 핵심 변환기 유지.
- HTML 파서는 기존 `article` 구조와 Watcha Pedia comments list의 `li` 구조를
  모두 지원한다.
- 변환 결과 미리보기: 총 항목 수, 제외된 스포일러/부적절 항목 수, 포스터
  누락 수, 긴 제목 후보를 보여준다.

Acceptance:

- 사용자가 코멘트 JSON 또는 저장 HTML을 넣으면 `src/data/users/*.json`이 생성된다.
- 생성 직후 manifest가 업데이트되어 앱 드롭다운에 표시된다.
- 쿠키, 인증 헤더, HAR, 세션 토큰을 입력받거나 저장하지 않는다.

### 4. 포스터 이미지 보강

현재 Watcha Pedia 원본 데이터에 `content.poster`가 있으면 그대로 사용한다.
누락된 포스터는 TMDB 보강 스크립트를 추가하는 방향이 가장 안전하다.

TMDB 공식 문서 기준으로 API 사용에는 계정의 API 키 또는 Bearer 토큰이
필요하고, 영화 검색은 `/3/search/movie`를 사용한다. 이미지 URL은
`base_url`, `file_size`, `file_path`를 조합해 만든다.

권장 구현:

- `scripts/enrich-posters-tmdb.ts` 추가.
- 입력: `src/data/users/*.json`
- 출력: 같은 JSON에 `posterUrl`, 선택적으로 `aliases`, `tmdbId`를 보강.
- 환경 변수: `TMDB_READ_ACCESS_TOKEN` 또는 `TMDB_API_KEY`.
- 검색 파라미터: `query`, `year`, `language=ko-KR`, `include_adult=false`.
- 캐시: `data-raw/tmdb-cache.json`에 검색 결과를 저장하고 커밋하지 않는다.
- 충돌 처리: 동일 제목 후보가 여러 개면 자동 선택하지 않고 review 파일을 만든다.

Acceptance:

- 포스터가 비어 있는 항목만 보강한다.
- 기존 Watcha CDN 포스터가 있으면 덮어쓰지 않는다.
- API 키는 `.env.local`에만 두고 커밋하지 않는다.
- 보강 후 `npm test`, `npm run lint`, `npm run build`가 통과한다.

### 5. 게임 느낌 강화

이미 적용된 변경:

- 난이도별 고정 제한시간 추가.
- 제한시간 종료 시 자동 오답 처리.
- 정답 공개 포스터 빈 상태 개선.

다음 후보:

- 카드 flip 애니메이션: 문제면은 코멘트, 공개면은 포스터와 정답.
- 콤보/스트릭: 연속 정답 수와 보너스 점수.
- 시간 보너스: 남은 시간이 많을수록 추가 점수.
- 결과 화면 확장: 최고 콤보, 평균 응답 시간, 가장 아까운 오답.
- 긴 제목 방어: 너무 긴 제목은 공개 영역에서 줄 수와 크기를 안정적으로 제한.
- 모바일 QA: 360px 폭에서 포스터, 타이머, 입력창이 겹치지 않는지 확인.

Acceptance:

- 5문제 게임이 1분 안에 리듬감 있게 끝난다.
- 모바일과 데스크톱에서 타이머와 입력창이 겹치지 않는다.
- 정답 공개 후 다음 문제로 넘어가는 흐름이 키보드로도 자연스럽다.

## Recommended Sprint Order

### P0. 지금 반영한 UI 정리 검증

- 로고 이미지, 데이터셋 순서, 난이도별 제한시간을 빌드로 검증한다.
- 모바일 폭에서 텍스트 겹침을 확인한다.

### P1. Import Wizard

- `/import` 화면을 만든다.
- URL 입력은 먼저 분석과 안내까지만 제공한다.
- 파일 업로드 또는 로컬 파일 경로 기반 변환을 우선 완성한다.
- 변환 결과를 미리보기하고 manifest 업데이트 여부를 선택하게 한다.

### P2. TMDB Poster Enrichment

- 공식 API 키를 `.env.local`에서 읽는 로컬 스크립트를 만든다.
- 포스터 누락 항목만 검색한다.
- 불확실한 매칭은 review JSON으로 분리한다.

### P3. Gameplay Pass

- 카드 flip, 콤보, 시간 보너스, 결과 화면 통계를 추가한다.
- `near` 판정의 점수 정책을 확정한다.
- 긴 코멘트/긴 제목/포스터 없음 케이스를 QA한다.

### P4. Documentation And Data Safety

- README에 import wizard와 TMDB 보강 명령을 추가한다.
- `docs/DATASET_GUIDE.md`에 URL 입력이 실제로 무엇을 하고 무엇을 하지 않는지
  명확히 적는다.
- 공개 배포 전 normalized JSON에 개인 정보나 동의 없는 데이터가 없는지 확인한다.

## Open Questions

- 공식 Watcha Pedia 로고 파일을 직접 제공할 수 있는가?
- URL 입력은 "자동 다운로드"까지 원하는가, 아니면 "URL 분석 후 로컬 파일 변환
  안내"가 우선인가?
- TMDB API 키를 사용할 수 있는가?
- `near` 판정을 정답으로 볼지, 별도 부분 점수로 볼지 결정이 필요하다.
