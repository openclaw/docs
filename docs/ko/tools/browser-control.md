---
read_when:
    - 로컬 제어 API를 통해 에이전트 브라우저를 스크립팅하거나 디버깅하기
    - '`openclaw browser` CLI 참조를 찾고 있습니다'
    - 스냅샷과 ref를 사용한 사용자 지정 브라우저 자동화 추가
summary: OpenClaw 브라우저 제어 API, CLI 참조 및 스크립팅 작업
title: 브라우저 제어 API
x-i18n:
    generated_at: "2026-04-26T11:39:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: bdaaff3d218aeee4c9a01478b3a3380b813ad4578d7eb74120e0745c87af66f6
    source_path: tools/browser-control.md
    workflow: 15
---

설정, 구성 및 문제 해결은 [Browser](/ko/tools/browser)를 참조하세요.
이 페이지는 로컬 제어 HTTP API, `openclaw browser`
CLI, 그리고 스크립팅 패턴(스냅샷, ref, 대기, 디버그 흐름)에 대한 참조입니다.

## 제어 API(선택 사항)

로컬 통합 전용으로 Gateway는 작은 루프백 HTTP API를 노출합니다:

- 상태/시작/중지: `GET /`, `POST /start`, `POST /stop`
- 탭: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- 스냅샷/스크린샷: `GET /snapshot`, `POST /screenshot`
- 작업: `POST /navigate`, `POST /act`
- 훅: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- 다운로드: `POST /download`, `POST /wait/download`
- 디버깅: `GET /console`, `POST /pdf`
- 디버깅: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- 네트워크: `POST /response/body`
- 상태: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- 상태: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- 설정: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

모든 엔드포인트는 `?profile=<name>`를 허용합니다. `POST /start?headless=true`는
지속 저장된 브라우저 구성을 변경하지 않고 로컬 관리형 프로필에 대해
일회성 headless 실행을 요청합니다. attach-only, 원격 CDP, 기존 세션 프로필은
OpenClaw가 해당 브라우저 프로세스를 실행하지 않으므로 이 재정의를 거부합니다.

공유 비밀 Gateway 인증이 구성되어 있으면 브라우저 HTTP 경로에도 인증이 필요합니다:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` 또는 해당 비밀번호를 사용하는 HTTP Basic 인증

참고:

- 이 독립형 루프백 브라우저 API는 trusted-proxy 또는
  Tailscale Serve identity 헤더를 사용하지 않습니다.
- `gateway.auth.mode`가 `none` 또는 `trusted-proxy`인 경우에도 이 루프백 브라우저
  경로는 이러한 identity 전달 모드를 상속하지 않습니다. 루프백 전용으로 유지하세요.

### `/act` 오류 계약

`POST /act`는 경로 수준 유효성 검사 및
정책 실패에 대해 구조화된 오류 응답을 사용합니다:

```json
{ "error": "<message>", "code": "ACT_*" }
```

현재 `code` 값:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind`가 없거나 인식되지 않습니다.
- `ACT_INVALID_REQUEST` (HTTP 400): 작업 payload가 정규화 또는 유효성 검사에 실패했습니다.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): 지원되지 않는 작업 kind에 `selector`가 사용되었습니다.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate`(또는 `wait --fn`)가 구성에 의해 비활성화되었습니다.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): 최상위 또는 배치 `targetId`가 요청 대상과 충돌합니다.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): 기존 세션 프로필에서는 이 작업이 지원되지 않습니다.

기타 런타임 실패는 여전히
`code` 필드 없이 `{ "error": "<message>" }`를 반환할 수 있습니다.

### Playwright 요구 사항

일부 기능(navigate/act/AI snapshot/role snapshot, 요소 스크린샷,
PDF)에는 Playwright가 필요합니다. Playwright가 설치되어 있지 않으면 해당 엔드포인트는
명확한 501 오류를 반환합니다.

Playwright 없이도 계속 작동하는 기능:

- ARIA 스냅샷
- 탭별 CDP WebSocket을 사용할 수 있을 때 role 스타일 접근성 스냅샷(`--interactive`, `--compact`,
  `--depth`, `--efficient`). 이것은
  검사 및 ref 탐색을 위한 대체 경로이며, Playwright는 여전히 기본 작업 엔진입니다.
- 탭별 CDP
  WebSocket을 사용할 수 있을 때 관리형 `openclaw` 브라우저의 페이지 스크린샷
- `existing-session` / Chrome MCP 프로필의 페이지 스크린샷
- 스냅샷 출력에서 가져오는 `existing-session` ref 기반 스크린샷(`--ref`)

여전히 Playwright가 필요한 기능:

- `navigate`
- `act`
- Playwright의 기본 AI 스냅샷 형식에 의존하는 AI 스냅샷
- CSS selector 요소 스크린샷(`--element`)
- 전체 브라우저 PDF 내보내기

요소 스크린샷은 `--full-page`도 거부합니다. 경로는 `fullPage is
not supported for element screenshots`를 반환합니다.

`Playwright is not available in this gateway build`가 표시되면
번들 브라우저 Plugin 런타임 의존성을 복구하여 `playwright-core`가 설치되도록 한 뒤
Gateway를 다시 시작하세요. 패키지 설치의 경우 `openclaw doctor --fix`를 실행하세요.
Docker의 경우 아래와 같이 Chromium 브라우저 바이너리도 설치하세요.

#### Docker Playwright 설치

Gateway가 Docker에서 실행 중이라면 `npx playwright`는 피하세요(npm override 충돌).
대신 번들 CLI를 사용하세요:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

브라우저 다운로드를 유지하려면 `PLAYWRIGHT_BROWSERS_PATH`를 설정하고(예:
`/home/node/.cache/ms-playwright`), `/home/node`가 `OPENCLAW_HOME_VOLUME` 또는 바인드 마운트를 통해
영속화되도록 하세요. [Docker](/ko/install/docker)를 참조하세요.

## 작동 방식(내부)

작은 루프백 제어 서버가 HTTP 요청을 수락하고 CDP를 통해 Chromium 기반 브라우저에 연결합니다. 고급 작업(클릭/입력/스냅샷/PDF)은 CDP 위의 Playwright를 통해 처리되며, Playwright가 없으면 Playwright를 사용하지 않는 작업만 사용할 수 있습니다. 에이전트는 하나의 안정적인 인터페이스를 보며, 그 아래에서는 로컬/원격 브라우저와 프로필이 자유롭게 교체됩니다.

## CLI 빠른 참조

모든 명령은 특정 프로필을 대상으로 하기 위한 `--browser-profile <name>`와 기계 판독 가능한 출력을 위한 `--json`을 허용합니다.

<AccordionGroup>

<Accordion title="기본: 상태, 탭, 열기/포커스/닫기">

```bash
openclaw browser status
openclaw browser start
openclaw browser start --headless # 일회성 로컬 관리형 headless 실행
openclaw browser stop            # attach-only/원격 CDP의 에뮬레이션도 지움
openclaw browser tabs
openclaw browser tab             # 현재 탭의 단축 명령
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="검사: 스크린샷, 스냅샷, 콘솔, 오류, 요청">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # 또는 --ref e12
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

<Accordion title="작업: navigate, click, type, drag, wait, evaluate">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # 또는 role ref의 경우 e12
openclaw browser click-coords 120 340        # 뷰포트 좌표
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser highlight e12
openclaw browser trace start
openclaw browser trace stop
```

</Accordion>

<Accordion title="상태: cookies, storage, offline, headers, geo, device">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # 제거하려면 --clear
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

참고:

- `upload`와 `dialog`는 **준비(arming)** 호출입니다. 파일 선택기/대화상자를 트리거하는 클릭/누르기 전에 먼저 실행하세요.
- `click`/`type`/기타 작업에는 `snapshot`에서 얻은 `ref`가 필요합니다(숫자 `12`, role ref `e12`, 또는 실행 가능한 ARIA ref `ax12`). 작업에는 의도적으로 CSS selector가 지원되지 않습니다. 보이는 뷰포트 위치만이 유일하게 신뢰할 수 있는 대상인 경우 `click-coords`를 사용하세요.
- 다운로드, trace, upload 경로는 OpenClaw 임시 루트로 제한됩니다: `/tmp/openclaw{,/downloads,/uploads}` (대체 경로: `${os.tmpdir()}/openclaw/...`).
- `upload`는 `--input-ref` 또는 `--element`를 통해 파일 입력을 직접 설정할 수도 있습니다.

OpenClaw가 대체 탭임을 입증할 수 있는 경우(예: 동일한 URL이거나, 폼 제출 후 하나의 이전 탭이 하나의 새 탭으로 바뀌는 경우) 안정적인 탭 ID와 라벨은 Chromium 원시 대상 교체 이후에도 유지됩니다. 원시 target ID는 여전히 변동 가능하므로 스크립트에서는 `tabs`의 `suggestedTargetId`를 선호하세요.

스냅샷 플래그 한눈에 보기:

- `--format ai` (Playwright가 있을 때 기본값): 숫자 ref가 포함된 AI 스냅샷 (`aria-ref="<n>"`).
- `--format aria`: `axN` ref가 포함된 접근성 트리. Playwright를 사용할 수 있으면 OpenClaw가 백엔드 DOM ID를 사용해 ref를 라이브 페이지에 바인딩하므로 후속 작업에서 이를 사용할 수 있습니다. 그렇지 않으면 출력을 검사 전용으로 취급하세요.
- `--efficient` (또는 `--mode efficient`): 간결한 role 스냅샷 프리셋. 이것을 기본값으로 만들려면 `browser.snapshotDefaults.mode: "efficient"`를 설정하세요([Gateway configuration](/ko/gateway/configuration-reference#browser) 참조).
- `--interactive`, `--compact`, `--depth`, `--selector`는 `ref=e12` ref가 있는 role 스냅샷을 강제합니다. `--frame "<iframe>"`은 role 스냅샷의 범위를 iframe으로 제한합니다.
- `--labels`는 ref 라벨이 오버레이된 뷰포트 전용 스크린샷을 추가합니다(`MEDIA:<path>` 출력).
- `--urls`는 발견된 링크 대상을 AI 스냅샷에 추가합니다.

## 스냅샷과 ref

OpenClaw는 두 가지 “스냅샷” 스타일을 지원합니다:

- **AI 스냅샷(숫자 ref)**: `openclaw browser snapshot` (기본값, `--format ai`)
  - 출력: 숫자 ref를 포함하는 텍스트 스냅샷.
  - 작업: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - 내부적으로 ref는 Playwright의 `aria-ref`를 통해 확인됩니다.

- **Role 스냅샷(`e12` 같은 role ref)**: `openclaw browser snapshot --interactive` (`--compact`, `--depth`, `--selector`, `--frame`도 가능)
  - 출력: `[ref=e12]`(및 선택적 `[nth=1]`)가 있는 role 기반 목록/트리.
  - 작업: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - 내부적으로 ref는 `getByRole(...)`로 확인됩니다(중복의 경우 `nth()` 추가).
  - ref 라벨이 오버레이된 뷰포트 스크린샷을 포함하려면 `--labels`를 추가하세요.
  - 링크 텍스트가 모호하고 에이전트에 구체적인
    탐색 대상이 필요할 때는 `--urls`를 추가하세요.

- **ARIA 스냅샷(`ax12` 같은 ARIA ref)**: `openclaw browser snapshot --format aria`
  - 출력: 구조화된 노드로 된 접근성 트리.
  - 작업: `openclaw browser click ax12`는 스냅샷 경로가 Playwright와 Chrome 백엔드 DOM ID를 통해
    ref를 바인딩할 수 있을 때 작동합니다.
- Playwright를 사용할 수 없더라도 ARIA 스냅샷은 여전히
  검사에 유용할 수 있지만, ref가 실행 가능하지 않을 수 있습니다. 작업용 ref가 필요하다면 `--format ai`
  또는 `--interactive`로 다시 스냅샷을 찍으세요.
- 원시 CDP 대체 경로에 대한 Docker 검증: `pnpm test:docker:browser-cdp-snapshot`는
  CDP로 Chromium을 시작하고, `browser doctor --deep`를 실행하며, role
  스냅샷에 링크 URL, 커서로 승격된 클릭 가능 요소, iframe 메타데이터가 포함되는지 확인합니다.

Ref 동작:

- ref는 **탐색 간에 안정적이지 않습니다**. 무언가 실패하면 `snapshot`을 다시 실행하고 새 ref를 사용하세요.
- `/act`는 대체 탭을 입증할 수 있을 때 작업으로 인한 교체 후 현재 원시 `targetId`를 반환합니다.
  후속 명령에는 계속 안정적인 탭 ID/라벨을 사용하세요.
- role 스냅샷을 `--frame`으로 찍은 경우, 다음 role 스냅샷 전까지 role ref는 해당 iframe 범위로 제한됩니다.
- 알 수 없거나 오래된 `axN` ref는
  Playwright의 `aria-ref` selector로 넘어가지 않고 즉시 실패합니다. 그런 경우
  같은 탭에서 새 스냅샷을 실행하세요.

## 대기 기능 강화

시간/텍스트 외의 조건도 기다릴 수 있습니다:

- URL 대기(Playwright가 지원하는 glob 사용 가능):
  - `openclaw browser wait --url "**/dash"`
- 로드 상태 대기:
  - `openclaw browser wait --load networkidle`
- JS predicate 대기:
  - `openclaw browser wait --fn "window.ready===true"`
- selector가 표시될 때까지 대기:
  - `openclaw browser wait "#main"`

이들은 함께 조합할 수 있습니다:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## 디버그 워크플로

작업이 실패할 때(예: “not visible”, “strict mode violation”, “covered”):

1. `openclaw browser snapshot --interactive`
2. `click <ref>` / `type <ref>` 사용(대화형 모드에서는 role ref 권장)
3. 여전히 실패하면: `openclaw browser highlight <ref>`로 Playwright가 무엇을 대상으로 삼고 있는지 확인
4. 페이지 동작이 이상하면:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. 심층 디버깅을 위해 trace 기록:
   - `openclaw browser trace start`
   - 문제를 재현
   - `openclaw browser trace stop` (`TRACE:<path>` 출력)

## JSON 출력

`--json`은 스크립팅 및 구조화된 도구용입니다.

예시:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

JSON의 role 스냅샷에는 `refs`와 작은 `stats` 블록(lines/chars/refs/interactive)이 포함되어 있어 도구가 payload 크기와 밀도를 판단할 수 있습니다.

## 상태 및 환경 설정값

다음은 “사이트가 X처럼 동작하도록 만들기” 워크플로에 유용합니다:

- 쿠키: `cookies`, `cookies set`, `cookies clear`
- 스토리지: `storage local|session get|set|clear`
- 오프라인: `set offline on|off`
- 헤더: `set headers --headers-json '{"X-Debug":"1"}'` (기존 `set headers --json '{"X-Debug":"1"}'`도 계속 지원됨)
- HTTP 기본 인증: `set credentials user pass` (또는 `--clear`)
- 위치 정보: `set geo <lat> <lon> --origin "https://example.com"` (또는 `--clear`)
- 미디어: `set media dark|light|no-preference|none`
- 시간대 / 로캘: `set timezone ...`, `set locale ...`
- 장치 / 뷰포트:
  - `set device "iPhone 14"` (Playwright 장치 프리셋)
  - `set viewport 1280 720`

## 보안 및 개인정보 보호

- openclaw 브라우저 프로필에는 로그인된 세션이 포함될 수 있으므로 민감하게 취급하세요.
- `browser act kind=evaluate` / `openclaw browser evaluate` 및 `wait --fn`은
  페이지 컨텍스트에서 임의의 JavaScript를 실행합니다. 프롬프트 인젝션이 이를
  유도할 수 있습니다. 필요하지 않다면 `browser.evaluateEnabled=false`로 비활성화하세요.
- 로그인 및 안티봇 관련 참고 사항(X/Twitter 등)은 [Browser login + X/Twitter posting](/ko/tools/browser-login)을 참조하세요.
- Gateway/Node 호스트는 비공개로 유지하세요(루프백 또는 tailnet 전용).
- 원격 CDP 엔드포인트는 강력하므로 터널링하고 보호하세요.

엄격 모드 예시(기본적으로 비공개/내부 대상 차단):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // 선택적 정확 일치 허용
    },
  },
}
```

## 관련 항목

- [Browser](/ko/tools/browser) — 개요, 구성, 프로필, 보안
- [Browser login](/ko/tools/browser-login) — 사이트 로그인
- [Browser Linux troubleshooting](/ko/tools/browser-linux-troubleshooting)
- [Browser WSL2 troubleshooting](/ko/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
