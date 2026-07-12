---
read_when:
    - 로컬 제어 API를 통한 에이전트 브라우저 스크립팅 또는 디버깅
    - '`openclaw browser` CLI 참조를 찾고 있습니다'
    - 스냅샷과 참조를 활용한 사용자 지정 브라우저 자동화 추가
summary: OpenClaw 브라우저 제어 API, CLI 참조 및 스크립팅 작업
title: 브라우저 제어 API
x-i18n:
    generated_at: "2026-07-12T15:47:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8063f55c9881e45e65492dc40e2902bf05feb08ae9a74986ba2d7621e0dbe71a
    source_path: tools/browser-control.md
    workflow: 16
---

설치, 구성 및 문제 해결에 대해서는 [브라우저](/ko/tools/browser)를 참조하십시오.
이 페이지는 로컬 제어 HTTP API, `openclaw browser` CLI 및 스크립팅 패턴(스냅샷, 참조, 대기, 디버그 흐름)에 대한 참조 문서입니다.

## 제어 API(선택 사항)

로컬 통합 전용으로 Gateway는 소규모 루프백 HTTP API를 제공합니다.
이 독립 실행형 서버는 선택적으로 활성화해야 합니다. Gateway 서비스 환경에서
환경 변수 `OPENCLAW_EAGER_BROWSER_CONTROL_SERVER=1`을 설정하고 Gateway를
재시작해야 HTTP 엔드포인트를 사용할 수 있습니다. 이 변수가 없어도 브라우저
제어 런타임은 CLI와 에이전트 도구를 통해 계속 작동하지만, 루프백 제어 포트에서
수신 대기하는 항목은 없습니다.

- 상태/시작/중지: `GET /`, `GET /doctor`, `POST /start`, `POST /stop`, `POST /reset-profile`
- 프로필: `GET /profiles`, `POST /profiles/create`, `DELETE /profiles/:name`
- 탭: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`, `POST /tabs/action`
- 스냅샷/스크린샷: `GET /snapshot`, `POST /screenshot`
- 작업: `POST /navigate`, `POST /act`
- 훅: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- 다운로드: `POST /download`, `POST /wait/download`
- 권한: `POST /permissions/grant`
- 디버깅: `GET /console`, `POST /pdf`
- 디버깅: `GET /errors`, `GET /requests`, `GET /dialogs`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- 네트워크: `POST /response/body`
- 상태: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- 상태: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- 설정: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

`POST /tabs/action`은 CLI가 내부적으로 `browser tab` 하위 명령에 사용하는
일괄 처리 형식(`{"action":"new"|"label"|"select"|"close"|"list", ...}`)입니다.
직접 스크립팅할 때는 위의 단일 목적 탭 경로를 사용하는 것이 좋습니다.

모든 엔드포인트는 `?profile=<name>`을 허용합니다. `POST /start?headless=true`는
영구 저장된 브라우저 구성을 변경하지 않고 로컬 관리형 프로필을 한 번만
헤드리스로 실행하도록 요청합니다. 연결 전용, 원격 CDP 및 기존 세션 프로필에서는
OpenClaw가 해당 브라우저 프로세스를 실행하지 않으므로 이 재정의를 거부합니다.

탭 엔드포인트에서 `targetId`는 호환성을 위한 필드 이름입니다. `GET /tabs` 또는
`POST /tabs/open`에서 받은 `suggestedTargetId`를 전달하는 것이 좋습니다. 레이블과
`t1` 같은 `tabId` 핸들도 허용됩니다. 원시 CDP 대상 ID와 고유한 원시 대상 ID
접두사도 계속 작동하지만, 이는 일시적인 진단용 핸들입니다.

공유 비밀 Gateway 인증이 구성된 경우 브라우저 HTTP 경로에도 인증이 필요합니다.

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` 또는 해당 비밀번호를 사용하는 HTTP 기본 인증

참고:

- 이 독립 실행형 루프백 브라우저 API는 신뢰할 수 있는 프록시 또는
  Tailscale Serve ID 헤더를 사용하지 **않습니다**.
- `gateway.auth.mode`가 `none` 또는 `trusted-proxy`인 경우 이러한 루프백 브라우저
  경로는 해당 ID 전달 모드를 상속하지 않습니다. 루프백 전용으로 유지하십시오.

### `/act` 오류 계약

`POST /act`는 경로 수준 검증 및 정책 실패에 구조화된 오류 응답을 사용합니다.

```json
{ "error": "<message>", "code": "ACT_*" }
```

현재 `code` 값은 다음과 같습니다.

- `ACT_KIND_REQUIRED` (HTTP 400): `kind`가 없거나 인식되지 않습니다.
- `ACT_INVALID_REQUEST` (HTTP 400): 작업 페이로드의 정규화 또는 검증에 실패했습니다.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): 지원되지 않는 작업 종류에 `selector`가 사용되었습니다.
- `ACT_EVALUATE_DISABLED` (HTTP 403): 구성에서 `evaluate`(또는 `wait --fn`)가 비활성화되어 있습니다.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): 최상위 또는 일괄 처리된 `targetId`가 요청 대상과 충돌합니다.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): 기존 세션 프로필에서는 해당 작업이 지원되지 않습니다.

다른 런타임 실패에서는 `code` 필드 없이 `{ "error": "<message>" }`가 계속
반환될 수 있습니다.

### Playwright 요구 사항

일부 기능(탐색/작업/AI 스냅샷/역할 스냅샷, 요소 스크린샷, PDF)에는
Playwright가 필요합니다. Playwright가 설치되어 있지 않으면 해당 엔드포인트는
명확한 501 오류를 반환합니다.

Playwright 없이도 작동하는 기능:

- ARIA 스냅샷
- 탭별 CDP WebSocket을 사용할 수 있는 경우 역할 스타일 접근성 스냅샷
  (`--interactive`, `--compact`, `--depth`, `--efficient`). 이는 검사 및 참조
  탐색을 위한 대체 수단이며, Playwright가 여전히 기본 작업 엔진입니다.
- 탭별 CDP WebSocket을 사용할 수 있는 경우 관리형 `openclaw` 브라우저의
  페이지 스크린샷
- `existing-session` / Chrome MCP 프로필의 페이지 스크린샷
- 스냅샷 출력의 `existing-session` 참조 기반 스크린샷(`--ref`)

계속 Playwright가 필요한 기능:

- `navigate`
- `act`
- Playwright의 네이티브 AI 스냅샷 형식에 의존하는 AI 스냅샷
- CSS 선택자 요소 스크린샷(`--element`)
- 전체 브라우저 PDF 내보내기

요소 스크린샷에서는 `--full-page`도 거부됩니다. 경로는 `fullPage is
not supported for element screenshots`를 반환합니다.

`Playwright is not available in this gateway build`가 표시되면 패키징된
Gateway에 핵심 브라우저 런타임 종속성이 없는 것입니다. OpenClaw를 다시
설치하거나 업데이트한 다음 Gateway를 재시작하십시오. Docker의 경우 아래와
같이 Chromium 브라우저 바이너리도 설치하십시오.

#### Docker Playwright 설치

Gateway가 Docker에서 실행되는 경우 `npx playwright`를 사용하지 마십시오(npm 재정의 충돌).
사용자 지정 이미지의 경우 Chromium을 이미지에 포함하십시오.

```bash
OPENCLAW_INSTALL_BROWSER=1 ./scripts/docker/setup.sh
```

기존 이미지의 경우 대신 번들 CLI를 통해 설치하십시오.

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

브라우저 다운로드를 유지하려면 `PLAYWRIGHT_BROWSERS_PATH`(예:
`/home/node/.cache/ms-playwright`)를 설정하고 `/home/node`가
`OPENCLAW_HOME_VOLUME` 또는 바인드 마운트를 통해 유지되는지 확인하십시오. OpenClaw는 Linux에서 유지된
Chromium을 자동으로 감지합니다. [Docker](/ko/install/docker)를 참조하십시오.

## 작동 방식(내부)

소규모 루프백 제어 서버가 HTTP 요청을 수락하고 CDP를 통해 Chromium 기반 브라우저에 연결합니다. 고급 작업(클릭/입력/스냅샷/PDF)은 CDP 위에서 Playwright를 통해 수행되며, Playwright가 없으면 Playwright를 사용하지 않는 작업만 이용할 수 있습니다. 하위 계층에서 로컬/원격 브라우저와 프로필을 자유롭게 전환하더라도 에이전트에는 하나의 안정적인 인터페이스가 제공됩니다.

## CLI 빠른 참조

모든 명령은 특정 프로필을 대상으로 지정하는 `--browser-profile <name>`과 기계 판독 가능한 출력을 위한 `--json`을 지원합니다.

<AccordionGroup>

<Accordion title="기본: 상태, 탭, 열기/포커스/닫기">

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep    # 실시간 스냅샷 프로브 추가
openclaw browser start
openclaw browser start --headless # 일회성 로컬 관리형 헤드리스 실행
openclaw browser stop            # 연결 전용/원격 CDP에서도 에뮬레이션 초기화
openclaw browser reset-profile   # 프로필의 브라우저 데이터를 휴지통으로 이동
openclaw browser tabs
openclaw browser tab             # 현재 탭 단축 명령
openclaw browser tab new
openclaw browser tab new --label research
openclaw browser tab label abcd1234 research
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="프로필: 목록, 생성, 삭제">

```bash
openclaw browser profiles
openclaw browser create-profile --name research --color "#0066CC"
openclaw browser create-profile --name attach --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser delete-profile --name research
```

</Accordion>

<Accordion title="검사: 스크린샷, 스냅샷, 콘솔, 오류, 요청">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # 또는 역할 참조에는 --ref e12
openclaw browser screenshot --labels
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --urls
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
openclaw browser snapshot --out snapshot.txt
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="작업: 이동, 클릭, 입력, 드래그, 대기, 평가">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # 또는 역할 참조에는 e12
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
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref e12
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

<Accordion title="상태: 쿠키, 스토리지, 오프라인, 헤더, 위치, 기기">

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

- 에이전트용 `browser` 도구는 `action=download`(필수 항목: `ref` 및
  `path`)와 `action=waitfordownload`(선택 항목: `path`)를 제공합니다. 둘 다 저장된
  다운로드 URL, 제안된 파일 이름, 보호된 로컬 경로를 반환합니다. 관리형 Playwright
  프로필에서는 명시적 다운로드 가로채기를 사용할 수 있으며, 기존 세션
  프로필은 지원되지 않는 작업 오류를 반환합니다.
- 원자적 선택기 업로드를 권장합니다. 업로드와 함께 트리거 `--ref`를 전달하면 OpenClaw가 한 번의 요청으로 준비하고 클릭합니다. 나중에 의도적으로 트리거해야 하는 경우에는 경로만 사용하는 `upload`도 계속 지원됩니다. 파일 입력을 직접 설정하려면 `--input-ref` 또는 `--element`를 사용하십시오. `dialog`는 준비 호출이므로 대화 상자를 트리거하는 클릭/키 입력 전에 실행하십시오. 작업이 모달을 열면 작업 응답에 `blockedByDialog`와 `browserState.dialogs.pending`가 포함됩니다. 해당 `dialogId`를 전달하여 직접 응답하십시오. OpenClaw 외부에서 처리된 대화 상자는 `browserState.dialogs.recent` 아래에 표시됩니다.
- `click`/`type` 등에는 `snapshot`에서 가져온 `ref`(숫자 `12`, 역할 ref `e12`, 또는 실행 가능한 ARIA ref `ax12`)가 필요합니다. 작업에는 의도적으로 CSS 선택기를 지원하지 않습니다. 표시된 뷰포트 위치만 신뢰할 수 있는 대상인 경우 `click-coords`를 사용하십시오.
- 다운로드 및 추적 경로는 OpenClaw 임시 루트인 `/tmp/openclaw{,/downloads}`로 제한됩니다(대체 경로: `${os.tmpdir()}/openclaw/...`).
- `upload`는 OpenClaw 임시 업로드 루트와
  OpenClaw가 관리하는 수신 미디어의 파일을 허용합니다. 관리형 수신 미디어는
  `media://inbound/<id>`, 샌드박스 상대 경로 `media/inbound/<id>`, 또는 관리형
  수신 미디어 디렉터리 내부의 확인된 경로로 참조할 수 있습니다. 중첩된 미디어 ref,
  경로 순회, 심볼릭 링크, 하드 링크 및 임의의 로컬 경로는 계속 거부됩니다.
- `upload`는 `--input-ref` 또는 `--element`를 통해 파일 입력을 직접 설정할 수도 있습니다.

OpenClaw가 교체 탭을 입증할 수 있는 경우, 예를 들어 동일한 URL에 대한 고유한
이전/새 탭 쌍이 있거나 양식 제출 후 단일 이전 탭이 단일 새 탭으로 바뀐 경우에는
Chromium 원시 대상이 교체되어도 안정적인 탭 ID와 레이블이 유지됩니다. 동일 URL이
중복되어 교체가 모호한 경우에는 새 핸들이 부여됩니다. 원시 대상 ID는 여전히
휘발성이므로 스크립트에서는 `tabs`의 `suggestedTargetId`를 사용하는 것이 좋습니다.

스냅샷 플래그 요약:

- `--format ai`(Playwright 사용 시 기본값): 숫자 ref(`aria-ref="<n>"`)가 포함된 AI 스냅샷입니다.
- `--format aria`: `axN` ref가 포함된 접근성 트리입니다. Playwright를 사용할 수 있으면 OpenClaw가 백엔드 DOM ID를 통해 ref를 라이브 페이지에 바인딩하므로 후속 작업에서 사용할 수 있습니다. 그렇지 않으면 출력을 검사 전용으로 취급하십시오.
- `--efficient`(또는 `--mode efficient`): 간결한 역할 스냅샷 프리셋입니다. 이를 기본값으로 설정하려면 `browser.snapshotDefaults.mode: "efficient"`를 설정하십시오([Gateway 구성](/ko/gateway/configuration-reference#browser) 참조).
- `--interactive`, `--compact`, `--depth`, `--selector`는 `ref=e12` ref가 포함된 역할 스냅샷을 강제합니다. `--frame "<iframe>"`은 역할 스냅샷의 범위를 iframe으로 제한합니다.
- Playwright를 사용하는 경우 `--labels`는 ref 레이블이 오버레이된 스크린샷
  (`MEDIA:<path>` 출력)과 각 ref의 경계 상자가 포함된 `annotations` 배열을
  추가합니다. `screenshot`에서는 Playwright 기반 레이블이 `--full-page`,
  `--ref`, `--element`와 함께 작동합니다. `snapshot`에서는 함께 생성되는
  스크린샷이 뷰포트로만 제한됩니다. 기존 세션/chrome-mcp 프로필은 페이지
  스크린샷에 오버레이 레이블을 렌더링하지만 `annotations`를 반환하지 않으며
  Playwright의 전체 페이지/ref/요소 투영 도우미를 사용하지 않습니다.
  Playwright 또는 chrome-mcp가 없으면 레이블이 지정된 스크린샷을 사용할 수 없습니다.
- `--urls`는 발견된 링크 대상을 AI 스냅샷에 추가합니다.

## 스냅샷과 ref

OpenClaw는 두 가지 "스냅샷" 스타일을 지원합니다.

- **AI 스냅샷(숫자 ref)**: `openclaw browser snapshot`(기본값: `--format ai`)
  - 출력: 숫자 ref가 포함된 텍스트 스냅샷입니다.
  - 작업: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - 내부적으로 ref는 Playwright의 `aria-ref`를 통해 확인됩니다.

- **역할 스냅샷(`e12`와 같은 역할 ref)**: `openclaw browser snapshot --interactive`(또는 `--compact`, `--depth`, `--selector`, `--frame`)
  - 출력: `[ref=e12]`(및 선택적 `[nth=1]`)가 포함된 역할 기반 목록/트리입니다.
  - 작업: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - 내부적으로 ref는 `getByRole(...)`(중복 항목에는 `nth()` 추가)를 통해 확인됩니다.
  - `--labels`를 추가하면 `e12` 레이블이 오버레이된 스크린샷이 포함됩니다.
    Playwright 기반 프로필에서는 ref별 경계 상자 메타데이터
    (`annotations[]`)도 반환합니다.
  - 링크 텍스트가 모호하고 에이전트에게 구체적인 탐색 대상이 필요한 경우
    `--urls`를 추가하십시오.

- **ARIA 스냅샷(`ax12`와 같은 ARIA ref)**: `openclaw browser snapshot --format aria`
  - 출력: 구조화된 노드로 표현된 접근성 트리입니다.
  - 작업: 스냅샷 경로가 Playwright와 Chrome 백엔드 DOM ID를 통해
    ref를 바인딩할 수 있으면 `openclaw browser click ax12`가 작동합니다.
- Playwright를 사용할 수 없어도 ARIA 스냅샷은 검사에 유용할 수 있지만
  ref로 작업을 수행하지 못할 수 있습니다. 작업용 ref가 필요하면 `--format ai`
  또는 `--interactive`로 다시 스냅샷을 생성하십시오.
- 원시 CDP 대체 경로에 대한 Docker 증명: `pnpm test:docker:browser-cdp-snapshot`은
  CDP로 Chromium을 시작하고 `browser doctor --deep`을 실행한 뒤 역할
  스냅샷에 링크 URL, 커서에 의해 클릭 가능 항목으로 승격된 요소 및 iframe 메타데이터가 포함되는지 확인합니다.

Ref 동작:

- Ref는 **탐색 간에 안정적으로 유지되지 않습니다**. 문제가 발생하면 `snapshot`을 다시 실행하고 새로운 ref를 사용하십시오.
- `/act`는 작업으로 인한 교체 후 교체 탭을 입증할 수 있는 경우 현재 원시
  `targetId`를 반환합니다. 후속 명령에는 안정적인 탭 ID/레이블을 계속 사용하십시오.
- 역할 스냅샷을 `--frame`으로 생성한 경우, 역할 ref는 다음 역할 스냅샷까지 해당 iframe으로 범위가 제한됩니다.
- 알 수 없거나 오래된 `axN` ref는 Playwright의 `aria-ref` 선택기로 대체 처리되지 않고
  즉시 실패합니다. 이 경우 동일한 탭에서 새로운 스냅샷을 실행하십시오.

## 향상된 대기 기능

시간/텍스트 외에도 다양한 조건을 기다릴 수 있습니다.

- URL 대기(Playwright에서 glob 지원):
  - `openclaw browser wait --url "**/dash"`
- 로드 상태 대기:
  - `openclaw browser wait --load networkidle`
  - 관리형 `openclaw` 및 원시/원격 CDP 프로필에서 지원됩니다. `existing-session` 드라이버를 사용하는 프로필(기본 `user` 프로필 포함)은 `networkidle`을 거부합니다. 해당 프로필에서는 `--url`, `--text`, 선택기 또는 `--fn` 대기를 사용하십시오.
- JS 조건자 대기:
  - `openclaw browser wait --fn "window.ready===true"`
- 선택기가 표시될 때까지 대기:
  - `openclaw browser wait "#main"`

다음과 같이 결합할 수 있습니다.

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## 디버그 워크플로

작업이 실패하는 경우(예: "표시되지 않음", "엄격 모드 위반", "가려짐"):

1. `openclaw browser snapshot --interactive`
2. `click <ref>` / `type <ref>`를 사용합니다(대화형 모드에서는 역할 ref 권장).
3. 여전히 실패하면 `openclaw browser highlight <ref>`를 사용하여 Playwright가 대상으로 지정하는 요소를 확인합니다.
4. 페이지가 비정상적으로 동작하는 경우:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. 심층 디버깅을 위해 추적을 기록합니다.
   - `openclaw browser trace start`
   - 문제를 재현합니다.
   - `openclaw browser trace stop`(`TRACE:<path>` 출력)

## JSON 출력

`--json`은 스크립팅과 구조화된 도구를 위한 옵션입니다.

예:

```bash
openclaw browser --json status
openclaw browser --json snapshot --interactive
openclaw browser --json requests --filter api
openclaw browser --json cookies
```

JSON의 역할 스냅샷에는 `refs`와 작은 `stats` 블록(lines/chars/refs/interactive)이 포함되어 도구가 페이로드 크기와 밀도를 판단할 수 있습니다.

## 상태 및 환경 조정 옵션

다음은 "사이트가 X처럼 동작하도록 만들기" 워크플로에 유용합니다.

- 쿠키: `cookies`, `cookies set`, `cookies clear`
- 스토리지: `storage local|session get|set|clear`
- 오프라인: `set offline on|off`
- 헤더: `set headers --headers-json '{"X-Debug":"1"}'`(또는 위치 인수 형식 `set headers '{"X-Debug":"1"}'`)
- HTTP 기본 인증: `set credentials user pass`(또는 `--clear`)
- 지리적 위치: `set geo <lat> <lon> --origin "https://example.com"`(또는 `--clear`)
- 미디어: `set media dark|light|no-preference|none`
- 시간대/로캘: `set timezone ...`, `set locale ...`
- 기기/뷰포트:
  - `set device "iPhone 14"`(Playwright 기기 프리셋)
  - `set viewport 1280 720`

## 보안 및 개인정보 보호

- openclaw 브라우저 프로필에는 로그인된 세션이 포함될 수 있으므로 민감한 정보로 취급하십시오.
- `browser act kind=evaluate` / `openclaw browser evaluate`와 `wait --fn`은
  페이지 컨텍스트에서 임의의 JavaScript를 실행합니다. 프롬프트 인젝션이 이를
  조종할 수 있습니다. 필요하지 않은 경우 `browser.evaluateEnabled=false`로 비활성화하십시오.
- `openclaw browser evaluate --fn`은 함수 소스, 표현식 또는 문 본문을
  허용합니다. 문 본문은 비동기 함수로 래핑되므로 돌려받을 값에는
  `return`을 사용하십시오. 페이지 측 함수가 기본 평가 제한 시간보다 오래 걸릴 수 있으면
  `--timeout-ms <ms>`를 사용하십시오.
- 로그인 및 봇 방지 관련 참고 사항(X/Twitter 등)은 [브라우저 로그인 + X/Twitter 게시](/ko/tools/browser-login)를 참조하십시오.
- Gateway/Node 호스트를 비공개로 유지하십시오(루프백 또는 tailnet 전용).
- 원격 CDP 엔드포인트는 강력한 권한을 제공하므로 터널링하고 보호하십시오.

엄격 모드 예시(기본적으로 비공개/내부 대상 차단):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // 선택적 정확한 허용
    },
  },
}
```

## 관련 문서

- [브라우저](/ko/tools/browser) - 개요, 구성, 프로필, 보안
- [브라우저 로그인](/ko/tools/browser-login) - 사이트에 로그인하기
- [브라우저 Linux 문제 해결](/ko/tools/browser-linux-troubleshooting)
- [브라우저 WSL2 문제 해결](/ko/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
