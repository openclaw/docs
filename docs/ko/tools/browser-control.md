---
read_when:
    - 로컬 제어 API를 통해 에이전트 브라우저 스크립팅 또는 디버깅
    - '`openclaw browser` CLI 참조 찾기'
    - 사용자 지정 브라우저 자동화를 스냅샷 및 refs와 함께 추가하기
summary: OpenClaw 브라우저 제어 API, CLI 참조 및 스크립팅 작업
title: 브라우저 제어 API
x-i18n:
    generated_at: "2026-06-27T18:11:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ccfd1ec996b0fc211e2aefa0554e0fa5c7b0899ca981836134a3741b38bf7600
    source_path: tools/browser-control.md
    workflow: 16
---

설정, 구성, 문제 해결은 [브라우저](/ko/tools/browser)를 참조하세요.
이 페이지는 로컬 제어 HTTP API, `openclaw browser` CLI, 스크립팅 패턴(스냅샷, 참조, 대기, 디버그 흐름)에 대한 참조입니다.

## 제어 API(선택 사항)

로컬 통합 전용으로 Gateway는 작은 loopback HTTP API를 노출합니다.
이 독립 실행형 서버는 옵트인 방식입니다. HTTP 엔드포인트를 사용하려면
Gateway 서비스 환경에서 환경 변수 `OPENCLAW_EAGER_BROWSER_CONTROL_SERVER=1`을 설정하고
Gateway를 다시 시작하세요. 이 변수가 없어도 브라우저 제어 런타임은 CLI와
에이전트 도구를 통해 계속 작동하지만, loopback 제어 포트에서 수신 대기하는 것은 없습니다.

- 상태/시작/중지: `GET /`, `POST /start`, `POST /stop`
- 탭: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- 스냅샷/스크린샷: `GET /snapshot`, `POST /screenshot`
- 작업: `POST /navigate`, `POST /act`
- 후크: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- 다운로드: `POST /download`, `POST /wait/download`
- 권한: `POST /permissions/grant`
- 디버깅: `GET /console`, `POST /pdf`
- 디버깅: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- 네트워크: `POST /response/body`
- 상태: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- 상태: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- 설정: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

모든 엔드포인트는 `?profile=<name>`을 허용합니다. `POST /start?headless=true`는
지속 저장된 브라우저 구성을 변경하지 않고 로컬 관리 프로필에 대해
일회성 헤드리스 실행을 요청합니다. attach-only, 원격 CDP, 기존 세션 프로필은
OpenClaw가 해당 브라우저 프로세스를 실행하지 않으므로 이 재정의를 거부합니다.

탭 엔드포인트에서 `targetId`는 호환성 필드 이름입니다. `GET /tabs` 또는
`POST /tabs/open`의 `suggestedTargetId`를 전달하는 것을 권장합니다. `t1` 같은
레이블과 `tabId` 핸들도 허용됩니다. 원시 CDP 대상 ID와 고유한 원시
대상 ID 접두사도 계속 작동하지만, 이는 변동될 수 있는 진단용 핸들입니다.

공유 비밀 Gateway 인증이 구성된 경우 브라우저 HTTP 라우트에도 인증이 필요합니다.

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` 또는 해당 비밀번호를 사용하는 HTTP Basic 인증

참고:

- 이 독립 실행형 loopback 브라우저 API는 신뢰할 수 있는 프록시 또는
  Tailscale Serve ID 헤더를 사용하지 **않습니다**.
- `gateway.auth.mode`가 `none` 또는 `trusted-proxy`이면, 이 loopback 브라우저
  라우트는 ID를 포함하는 해당 모드를 상속하지 않습니다. loopback 전용으로 유지하세요.

### `/act` 오류 계약

`POST /act`는 라우트 수준 검증과 정책 실패에 대해 구조화된 오류 응답을 사용합니다.

```json
{ "error": "<message>", "code": "ACT_*" }
```

현재 `code` 값:

- `ACT_KIND_REQUIRED`(HTTP 400): `kind`가 없거나 인식되지 않습니다.
- `ACT_INVALID_REQUEST`(HTTP 400): 작업 페이로드 정규화 또는 검증에 실패했습니다.
- `ACT_SELECTOR_UNSUPPORTED`(HTTP 400): 지원되지 않는 작업 종류와 함께 `selector`가 사용되었습니다.
- `ACT_EVALUATE_DISABLED`(HTTP 403): 구성에 의해 `evaluate`(또는 `wait --fn`)가 비활성화되어 있습니다.
- `ACT_TARGET_ID_MISMATCH`(HTTP 403): 최상위 또는 배치된 `targetId`가 요청 대상과 충돌합니다.
- `ACT_EXISTING_SESSION_UNSUPPORTED`(HTTP 501): 기존 세션 프로필에서는 작업이 지원되지 않습니다.

다른 런타임 실패는 여전히 `code` 필드 없이 `{ "error": "<message>" }`를 반환할 수 있습니다.

### Playwright 요구 사항

일부 기능(이동/작업/AI 스냅샷/역할 스냅샷, 요소 스크린샷,
PDF)에는 Playwright가 필요합니다. Playwright가 설치되어 있지 않으면 해당 엔드포인트는
명확한 501 오류를 반환합니다.

Playwright 없이도 계속 작동하는 항목:

- ARIA 스냅샷
- 탭별 CDP WebSocket을 사용할 수 있을 때의 역할 스타일 접근성 스냅샷(`--interactive`, `--compact`,
  `--depth`, `--efficient`). 이는 검사와 참조 탐색을 위한 폴백이며, Playwright가 기본
  작업 엔진으로 유지됩니다.
- 탭별 CDP WebSocket을 사용할 수 있을 때 관리형 `openclaw` 브라우저의 페이지 스크린샷
- `existing-session` / Chrome MCP 프로필의 페이지 스크린샷
- 스냅샷 출력에서 가져온 `existing-session` 참조 기반 스크린샷(`--ref`)

여전히 Playwright가 필요한 항목:

- `navigate`
- `act`
- Playwright의 네이티브 AI 스냅샷 형식에 의존하는 AI 스냅샷
- CSS 선택자 요소 스크린샷(`--element`)
- 전체 브라우저 PDF 내보내기

요소 스크린샷은 `--full-page`도 거부합니다. 라우트는 `fullPage is
not supported for element screenshots`를 반환합니다.

`Playwright is not available in this gateway build`가 표시되면 패키징된
Gateway에 핵심 브라우저 런타임 의존성이 없는 것입니다. OpenClaw를 다시 설치하거나 업데이트한 뒤
Gateway를 다시 시작하세요. Docker의 경우 아래와 같이 Chromium 브라우저 바이너리도 설치하세요.

#### Docker Playwright 설치

Gateway가 Docker에서 실행되는 경우 `npx playwright`는 피하세요(npm 재정의 충돌).
커스텀 이미지의 경우 Chromium을 이미지에 포함하세요.

```bash
OPENCLAW_INSTALL_BROWSER=1 ./scripts/docker/setup.sh
```

기존 이미지의 경우 대신 번들된 CLI를 통해 설치하세요.

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

브라우저 다운로드를 유지하려면 `PLAYWRIGHT_BROWSERS_PATH`(예:
`/home/node/.cache/ms-playwright`)를 설정하고 `/home/node`가
`OPENCLAW_HOME_VOLUME` 또는 바인드 마운트를 통해 유지되도록 하세요. OpenClaw는 Linux에서
유지된 Chromium을 자동 감지합니다. [Docker](/ko/install/docker)를 참조하세요.

## 작동 방식(내부)

작은 loopback 제어 서버가 HTTP 요청을 받고 CDP를 통해 Chromium 기반 브라우저에 연결합니다. 고급 작업(클릭/입력/스냅샷/PDF)은 CDP 위의 Playwright를 통해 수행됩니다. Playwright가 없으면 Playwright가 필요 없는 작업만 사용할 수 있습니다. 에이전트는 로컬/원격 브라우저와 프로필이 내부에서 자유롭게 바뀌는 동안 하나의 안정적인 인터페이스를 봅니다.

## CLI 빠른 참조

모든 명령은 특정 프로필을 대상으로 지정하는 `--browser-profile <name>`과 기계 판독 가능한 출력을 위한 `--json`을 허용합니다.

<AccordionGroup>

<Accordion title="Basics: status, tabs, open/focus/close">

```bash
openclaw browser status
openclaw browser start
openclaw browser start --headless # one-shot local managed headless launch
openclaw browser stop            # also clears emulation on attach-only/remote CDP
openclaw browser tabs
openclaw browser tab             # shortcut for current tab
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="Inspection: screenshot, snapshot, console, errors, requests">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # or --ref e12
openclaw browser screenshot --labels
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --urls
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="Actions: navigate, click, type, drag, wait, evaluate">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # or e12 for role refs
openclaw browser click-coords 120 340        # viewport coordinates
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser upload media://inbound/file.pdf
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser evaluate --fn 'const title = document.title; return title;'
openclaw browser evaluate --timeout-ms 30000 --fn 'async () => { await window.ready; return true; }'
openclaw browser highlight e12
openclaw browser trace start
openclaw browser trace stop
```

</Accordion>

<Accordion title="State: cookies, storage, offline, headers, geo, device">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # --clear to remove
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

참고:

- `upload`와 `dialog`는 **준비** 호출입니다. 선택기/대화 상자를 트리거하는 클릭/키 입력 전에 실행하세요. 작업이 모달을 열면 작업 응답에 `blockedByDialog`와 `browserState.dialogs.pending`이 포함됩니다. 직접 응답하려면 해당 `dialogId`를 전달하세요. OpenClaw 외부에서 처리된 대화 상자는 `browserState.dialogs.recent` 아래에 표시됩니다.
- `click`/`type`/기타 작업에는 `snapshot`의 `ref`(숫자 `12`, 역할 참조 `e12`, 또는 실행 가능한 ARIA 참조 `ax12`)가 필요합니다. CSS 선택자는 작업에서 의도적으로 지원되지 않습니다. 보이는 viewport 위치가 유일하게 신뢰할 수 있는 대상일 때는 `click-coords`를 사용하세요.
- 다운로드와 추적 경로는 OpenClaw 임시 루트 `/tmp/openclaw{,/downloads}`(폴백: `${os.tmpdir()}/openclaw/...`)로 제한됩니다.
- `upload`는 OpenClaw 임시 업로드 루트의 파일과
  OpenClaw가 관리하는 인바운드 미디어를 허용합니다. 관리형 인바운드 미디어는
  `media://inbound/<id>`, 샌드박스 상대 경로 `media/inbound/<id>`, 또는 관리형
  인바운드 미디어 디렉터리 내부의 확인된 경로로 참조할 수 있습니다. 중첩 미디어 참조,
  경로 순회, 심볼릭 링크, 하드 링크, 임의의 로컬 경로는 여전히 거부됩니다.
- `upload`는 `--input-ref` 또는 `--element`를 통해 파일 입력을 직접 설정할 수도 있습니다.

안정적인 탭 ID와 레이블은 OpenClaw가 대체 탭을 증명할 수 있을 때 Chromium 원시 대상 교체 후에도 유지됩니다.
예를 들어 URL이 같거나, 양식 제출 후 단일 이전 탭이 단일 새 탭이 되는 경우입니다. 원시 대상 ID는 여전히 변동될 수 있으므로 스크립트에서는 `tabs`의 `suggestedTargetId`를 권장합니다.

스냅샷 플래그 한눈에 보기:

- `--format ai`(Playwright 사용 시 기본값): 숫자 ref(`aria-ref="<n>"`)가 포함된 AI 스냅샷.
- `--format aria`: `axN` ref가 포함된 접근성 트리. Playwright를 사용할 수 있으면 OpenClaw가 후속 작업에서 사용할 수 있도록 backend DOM ids로 ref를 라이브 페이지에 바인딩합니다. 그렇지 않으면 출력을 검사 전용으로 취급하세요.
- `--efficient`(또는 `--mode efficient`): 압축 역할 스냅샷 프리셋. 이를 기본값으로 만들려면 `browser.snapshotDefaults.mode: "efficient"`를 설정하세요([Gateway 구성](/ko/gateway/configuration-reference#browser) 참조).
- `--interactive`, `--compact`, `--depth`, `--selector`는 `ref=e12` ref가 포함된 역할 스냅샷을 강제합니다. `--frame "<iframe>"`은 역할 스냅샷의 범위를 iframe으로 제한합니다.
- Playwright 사용 시 `--labels`는 ref 라벨이 오버레이된 스크린샷
  (`MEDIA:<path>` 출력)과 각 ref의 경계 상자가 포함된 `annotations`
  배열을 추가합니다. `screenshot`에서는 Playwright 기반 라벨이
  `--full-page`, `--ref`, `--element`와 함께 동작합니다. `snapshot`에서는
  함께 제공되는 스크린샷이 viewport 전용으로 유지됩니다.
  existing-session/chrome-mcp 프로필은 페이지 스크린샷에 오버레이 라벨을
  렌더링하지만 `annotations`를 반환하지 않으며 Playwright
  full-page/ref/element 프로젝션 헬퍼를 사용하지 않습니다. Playwright나
  chrome-mcp가 없으면 라벨이 지정된 스크린샷을 사용할 수 없습니다.
- `--urls`는 발견된 링크 대상 URL을 AI 스냅샷에 추가합니다.

## 스냅샷 및 ref

OpenClaw는 두 가지 "스냅샷" 스타일을 지원합니다.

- **AI 스냅샷(숫자 ref)**: `openclaw browser snapshot`(기본값, `--format ai`)
  - 출력: 숫자 ref가 포함된 텍스트 스냅샷.
  - 작업: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - 내부적으로 ref는 Playwright의 `aria-ref`를 통해 확인됩니다.

- **역할 스냅샷(`e12` 같은 역할 ref)**: `openclaw browser snapshot --interactive`(또는 `--compact`, `--depth`, `--selector`, `--frame`)
  - 출력: `[ref=e12]`(및 선택적 `[nth=1]`)가 포함된 역할 기반 목록/트리.
  - 작업: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - 내부적으로 ref는 `getByRole(...)`을 통해 확인됩니다(중복 항목에는 `nth()` 추가).
  - 오버레이된 `e12` 라벨이 포함된 스크린샷을 포함하려면 `--labels`를
    추가하세요. Playwright 기반 프로필에서는 ref별 경계 상자 메타데이터
    (`annotations[]`)도 반환됩니다.
  - 링크 텍스트가 모호하고 에이전트에 구체적인 이동 대상이 필요할 때
    `--urls`를 추가하세요.

- **ARIA 스냅샷(`ax12` 같은 ARIA ref)**: `openclaw browser snapshot --format aria`
  - 출력: 구조화된 노드로 된 접근성 트리.
  - 작업: 스냅샷 경로가 Playwright와 Chrome backend DOM ids를 통해 ref를
    바인딩할 수 있으면 `openclaw browser click ax12`가 동작합니다.
- Playwright를 사용할 수 없어도 ARIA 스냅샷은 검사에 유용할 수 있지만,
  ref는 실행 가능하지 않을 수 있습니다. 작업 ref가 필요하면 `--format ai`
  또는 `--interactive`로 다시 스냅샷을 찍으세요.
- raw-CDP fallback 경로용 Docker 증명: `pnpm test:docker:browser-cdp-snapshot`은
  CDP로 Chromium을 시작하고, `browser doctor --deep`을 실행하며, 역할
  스냅샷에 링크 URL, 커서 승격 클릭 가능 요소, iframe 메타데이터가 포함되는지
  확인합니다.

ref 동작:

- ref는 **탐색 간에 안정적이지 않습니다**. 실패하면 `snapshot`을 다시 실행하고 새 ref를 사용하세요.
- `/act`는 교체 탭을 증명할 수 있을 때 작업으로 트리거된 교체 후의 현재 원시
  `targetId`를 반환합니다. 후속 명령에는 안정적인 탭 id/라벨을 계속 사용하세요.
- 역할 스냅샷을 `--frame`으로 찍은 경우, 다음 역할 스냅샷까지 역할 ref 범위가 해당 iframe으로 제한됩니다.
- 알 수 없거나 오래된 `axN` ref는 Playwright의 `aria-ref` selector로 넘어가지
  않고 빠르게 실패합니다. 이런 경우 같은 탭에서 새 스냅샷을 실행하세요.

## 대기 기능 강화

시간/텍스트 외에도 더 많은 조건을 기다릴 수 있습니다.

- URL 대기(Playwright에서 glob 지원):
  - `openclaw browser wait --url "**/dash"`
- 로드 상태 대기:
  - `openclaw browser wait --load networkidle`
  - 관리형 `openclaw` 및 raw/remote CDP 프로필에서 지원됩니다. `user` 및 `existing-session` 프로필은 `networkidle`을 거부합니다. 이 경우 `--url`, `--text`, selector 또는 `--fn` 대기를 사용하세요.
- JS predicate 대기:
  - `openclaw browser wait --fn "window.ready===true"`
- selector가 표시될 때까지 대기:
  - `openclaw browser wait "#main"`

이들은 조합할 수 있습니다.

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## 디버그 워크플로

작업이 실패할 때(예: "not visible", "strict mode violation", "covered"):

1. `openclaw browser snapshot --interactive`
2. `click <ref>` / `type <ref>` 사용(대화형 모드에서는 역할 ref 선호)
3. 여전히 실패하면: `openclaw browser highlight <ref>`로 Playwright가 대상으로 삼는 항목을 확인
4. 페이지가 이상하게 동작하면:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. 심층 디버깅: trace 기록:
   - `openclaw browser trace start`
   - 문제 재현
   - `openclaw browser trace stop`(`TRACE:<path>` 출력)

## JSON 출력

`--json`은 스크립팅 및 구조화된 도구용입니다.

예시:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

JSON의 역할 스냅샷은 `refs`와 작은 `stats` 블록(lines/chars/refs/interactive)을 포함하므로 도구가 payload 크기와 밀도를 판단할 수 있습니다.

## 상태 및 환경 조절값

다음은 "사이트를 X처럼 동작하게 만들기" 워크플로에 유용합니다.

- 쿠키: `cookies`, `cookies set`, `cookies clear`
- 스토리지: `storage local|session get|set|clear`
- 오프라인: `set offline on|off`
- 헤더: `set headers --headers-json '{"X-Debug":"1"}'`(기존 `set headers --json '{"X-Debug":"1"}'`도 계속 지원됨)
- HTTP 기본 인증: `set credentials user pass`(또는 `--clear`)
- 지리적 위치: `set geo <lat> <lon> --origin "https://example.com"`(또는 `--clear`)
- 미디어: `set media dark|light|no-preference|none`
- 시간대 / 로캘: `set timezone ...`, `set locale ...`
- 장치 / viewport:
  - `set device "iPhone 14"`(Playwright 장치 프리셋)
  - `set viewport 1280 720`

## 보안 및 개인정보 보호

- openclaw 브라우저 프로필에는 로그인된 세션이 포함될 수 있습니다. 민감한 정보로 취급하세요.
- `browser act kind=evaluate` / `openclaw browser evaluate` 및 `wait --fn`은
  페이지 컨텍스트에서 임의의 JavaScript를 실행합니다. 프롬프트 인젝션이
  이를 조종할 수 있습니다. 필요하지 않다면 `browser.evaluateEnabled=false`로
  비활성화하세요.
- `openclaw browser evaluate --fn`은 함수 소스, 표현식 또는 statement body를
  받습니다. statement body는 비동기 함수로 래핑되므로 돌려받고 싶은 값에는
  `return`을 사용하세요. 페이지 측 함수가 기본 evaluate timeout보다 더 오래
  필요할 수 있으면 `--timeout-ms <ms>`를 사용하세요.
- 로그인 및 안티봇 참고 사항(X/Twitter 등)은 [브라우저 로그인 + X/Twitter 게시](/ko/tools/browser-login)를 참조하세요.
- Gateway/node 호스트를 비공개로 유지하세요(loopback 또는 tailnet 전용).
- 원격 CDP 엔드포인트는 강력합니다. 터널링하고 보호하세요.

Strict-mode 예시(기본적으로 비공개/내부 대상 차단):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // optional exact allow
    },
  },
}
```

## 관련 항목

- [브라우저](/ko/tools/browser) - 개요, 구성, 프로필, 보안
- [브라우저 로그인](/ko/tools/browser-login) - 사이트에 로그인
- [브라우저 Linux 문제 해결](/ko/tools/browser-linux-troubleshooting)
- [브라우저 WSL2 문제 해결](/ko/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
