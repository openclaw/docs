---
read_when:
    - '`openclaw browser`을 사용하며 일반적인 작업의 예시를 확인하려고 합니다'
    - Node 호스트를 통해 다른 컴퓨터에서 실행 중인 브라우저를 제어하려는 경우
    - Chrome MCP를 통해 로컬에서 로그인된 Chrome에 연결하려고 합니다
summary: '`openclaw browser`의 CLI 참조(수명 주기, 프로필, 탭, 작업, 상태 및 디버깅)'
title: 브라우저
x-i18n:
    generated_at: "2026-07-12T15:03:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 50e9da3fa6899d830e38d8548313c70b5615c2ed3d70dd372a1fe147ff5db053
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

OpenClaw의 브라우저 제어 인터페이스를 관리하고 브라우저 작업을 실행합니다. 수명 주기, 프로필, 탭, 스냅샷, 스크린샷, 탐색, 입력, 상태 에뮬레이션 및 디버깅을 지원합니다.

관련 문서: [브라우저 도구](/ko/tools/browser)

## 공통 플래그

- `--url <gatewayWsUrl>`: Gateway WebSocket URL입니다(기본값은 구성에서 가져옴).
- `--token <token>`: Gateway 토큰입니다(필요한 경우).
- `--timeout <ms>`: 요청 제한 시간(밀리초)입니다(기본값: `30000`).
- `--expect-final`: 최종 Gateway 응답을 기다립니다.
- `--browser-profile <name>`: 브라우저 프로필을 선택합니다(기본값: `openclaw` 또는 `browser.defaultProfile`).
- `--json`: 기계 판독 가능한 출력입니다(지원되는 경우). 브라우저 수준 옵션이므로
  모호하지 않게 하려면 `openclaw browser --json status`와 같이
  하위 명령 앞에 배치하십시오. 선택한 하위 명령에 자체 `--json`이
  정의되어 있지 않으면 `openclaw browser status --json`처럼 뒤에 배치해도 작동합니다.

## 빠른 시작(로컬)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

에이전트는 `browser({ action: "doctor" })`를 사용하여 동일한 준비 상태 검사를 실행할 수 있습니다.

## 빠른 문제 해결

`start`가 `not reachable after start` 오류와 함께 실패하면 먼저 CDP 준비 상태를 해결하십시오. `start`와 `tabs`는 성공하지만 `open` 또는 `navigate`가 실패하면 브라우저 제어 플레인은 정상이며, 일반적으로 탐색 SSRF 정책 차단이 원인입니다.

최소 실행 순서:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

자세한 지침: [브라우저 문제 해결](/ko/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## 수명 주기

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep
openclaw browser start
openclaw browser start --headless
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

- `doctor --deep`은 실시간 스냅샷 프로브를 추가합니다. 기본 CDP 준비 상태는 정상이나 현재 탭을 검사할 수 있다는 증거가 필요할 때 유용합니다.
- 실행 중인 로컬 관리형 프로필의 경우 `status`와 `doctor`는 Chrome에서 캐시된
  그래픽 진단 정보를 보고합니다. 여기에는 하드웨어/소프트웨어 분류, 렌더러,
  백엔드, 장치/드라이버, 기능 및 비활성화 상태 세부 정보와 가속
  동영상 기능이 포함됩니다. `openclaw browser --json status`는 전체 구조화된 페이로드를 반환합니다.
  수동적 상태 확인은 이러한 정보를 수집하기 위해 Chrome을 실행하지 않습니다.
- `stop`은 활성 제어 세션을 닫고, OpenClaw가 브라우저 프로세스를 직접 실행하지 않은 `attachOnly` 및 원격 CDP 프로필에서도 임시 에뮬레이션 재정의를 지웁니다. 로컬 관리형 프로필에서는 `stop`이 생성된 브라우저 프로세스도 중지합니다.
- `start --headless`는 해당 시작 요청에만 적용되며, OpenClaw가 로컬 관리형 브라우저를 실행할 때만 적용됩니다. `browser.headless` 또는 프로필 구성을 다시 작성하지 않으며, 이미 실행 중인 브라우저에는 아무 효과가 없습니다.
- `DISPLAY` 또는 `WAYLAND_DISPLAY`가 없는 Linux 호스트에서는 `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless=false` 또는 `browser.profiles.<name>.headless=false`로 표시되는 브라우저를 명시적으로 요청하지 않는 한 로컬 관리형 프로필이 자동으로 헤드리스 모드로 실행됩니다.

## 명령을 찾을 수 없는 경우

`openclaw browser`가 알 수 없는 명령이면 `~/.openclaw/openclaw.json`의 `plugins.allow`를 확인하십시오. `plugins.allow`가 있으면 구성에 루트 `browser` 블록이 이미 존재하지 않는 한 번들 브라우저 Plugin을 명시적으로 나열하십시오.

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

명시적인 루트 `browser` 블록(예: `browser.enabled=true` 또는 `browser.profiles.<name>`)도 제한적인 Plugin 허용 목록에서 번들 브라우저 Plugin을 활성화합니다.

관련 문서: [브라우저 도구](/ko/tools/browser#missing-browser-command-or-tool)

## 프로필

프로필은 이름이 지정된 브라우저 라우팅 구성입니다.

- `openclaw`(기본값): 전용 OpenClaw 관리형 Chrome 인스턴스를 실행하거나 연결합니다(격리된 사용자 데이터 디렉터리).
- `user`: Chrome DevTools MCP를 통해 로그인되어 있는 기존 Chrome 세션을 제어합니다.
- 사용자 지정 CDP 프로필: 로컬 또는 원격 CDP 엔드포인트를 가리킵니다.

```bash
openclaw browser profiles
openclaw browser system-profiles
openclaw browser system-profiles --browser brave
openclaw browser import-profile --browser chrome --system Default --into imported
openclaw browser import-profile --system "Profile 1" --into work --domains google.com,youtube.com
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

모든 하위 명령에서 `--browser-profile <name>`을 사용하여 특정 프로필을 지정할 수 있습니다. 예: `openclaw browser --browser-profile work tabs`.

macOS에서 `system-profiles`는 호스트에서 사용할 수 있는 실제 Chrome, Brave, Edge 또는 Chromium 프로필을 나열합니다. `import-profile`은 macOS Keychain/Touch ID 동의 프롬프트를 한 번 표시한 후 해당 쿠키를 복호화하여 새로운 OpenClaw 관리형 프로필에 주입합니다. 쿠키만 가져오며 로컬 스토리지와 IndexedDB는 변경되지 않습니다. 일부 Google 세션은 기기 바인딩 세션 자격 증명(DBSC)을 사용하므로 가져온 후에도 다시 인증해야 할 수 있습니다.

macOS 앱이 로컬 Gateway를 사용하면 이 가져오기를 한 번 제안하고, 격리된 가져온 프로필을 에이전트 브라우징의 기본값으로 설정할 수 있습니다. 가져오기에는 항상 명시적인 클릭이 필요합니다. 가져오기에 성공하거나 프롬프트를 닫으면 이후 자동 프롬프트가 표시되지 않으며, **Settings → General → Browser login**에서 다시 가져올 수 있습니다.

시스템 프로필 가져오기는 기본적으로 활성화되어 있습니다. CLI 및 에이전트가 트리거하는 가져오기를 모두 비활성화하려면 `browser.allowSystemProfileImport=false`로 설정하십시오. 가져오기는 호스트 로컬에서만 수행되며 브라우저 Node 프록시를 통해 실행할 수 없습니다.

## 탭

```bash
openclaw browser tabs
openclaw browser tab new --label docs
openclaw browser tab label t1 docs
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai --label docs
openclaw browser focus docs
openclaw browser close t1
```

`tabs`는 먼저 `suggestedTargetId`를 반환한 다음 안정적인 `tabId`(예: `t1`), 선택적 레이블 및 원시 `targetId`를 반환합니다. `suggestedTargetId`를 `focus`, `close`, 스냅샷 및 작업에 다시 전달하십시오. `open --label`, `tab new --label` 또는 `tab label`을 사용하여 레이블을 지정할 수 있습니다. 레이블, 탭 ID, 원시 대상 ID 및 고유한 대상 ID 접두사를 모두 사용할 수 있습니다. 호환성을 위해 요청 필드 이름은 여전히 `targetId`이지만, 이러한 모든 탭 참조를 허용합니다.

원시 대상 ID는 지속적인 에이전트 메모리가 아니라 일시적인 진단 핸들입니다. 탐색 또는 양식 제출 중 Chromium이 기본 원시 대상을 교체하면 OpenClaw는 일치 여부를 입증할 수 있는 경우 안정적인 `tabId`/레이블을 교체 탭에 계속 연결합니다. `suggestedTargetId`를 사용하는 것이 좋습니다.

## 스냅샷 / 스크린샷 / 작업

스냅샷:

```bash
openclaw browser snapshot
openclaw browser snapshot --urls
```

스크린샷:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
openclaw browser screenshot --labels
```

- `--full-page`는 페이지 캡처에만 사용할 수 있으며 `--ref` 또는 `--element`와 함께 사용할 수 없습니다.
- `existing-session` / `user` 프로필은 페이지 스크린샷과 스냅샷 출력의 `--ref` 스크린샷을 지원하지만 CSS `--element` 스크린샷은 지원하지 않습니다.
- `--labels`는 현재 스냅샷 참조를 스크린샷 위에 오버레이합니다. Playwright 기반 프로필에서는 `--full-page`(전체 페이지 오버레이), `--ref`(ARIA 참조를 통한 요소 클립 오버레이), `--element`(CSS 선택자를 통한 요소 클립 오버레이)와 함께 작동하며, 요소 클립 모드에서는 레이블이 요소를 기준으로 투영됩니다. 응답에는 캡처된 이미지의 좌표 공간(뷰포트 / 전체 페이지 / 요소 상대 좌표)에서 각 참조의 경계 상자를 나타내는 `annotations` 배열(비어 있으면 생략됨)도 포함됩니다. 각 항목은 `ref`, `number`, `role`, 선택적 `name`, `box: {x, y, width, height}`로 구성됩니다.
  `existing-session` 프로필은 페이지 스크린샷에 chrome-mcp 오버레이를 렌더링하지만 Playwright 투영 도우미를 사용하지 않으며 `annotations`를 포함하지 않습니다. CSS `--element` 스크린샷도 지원되지 않습니다. Playwright 또는 chrome-mcp가 없으면 레이블이 지정된 스크린샷을 사용할 수 없습니다.
- `snapshot --urls`는 발견된 링크 대상을 AI 스냅샷에 추가하여 에이전트가 링크 텍스트만 보고 추측하는 대신 직접 탐색 대상을 선택할 수 있도록 합니다.

탐색/클릭/입력(참조 기반 UI 자동화):

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser click-coords 120 340
openclaw browser type <ref> "hello"
openclaw browser press Enter
openclaw browser hover <ref>
openclaw browser scrollintoview <ref>
openclaw browser drag <startRef> <endRef>
openclaw browser select <ref> OptionA OptionB
openclaw browser fill --fields '[{"ref":"1","value":"Ada"}]'
openclaw browser wait --text "Done"
openclaw browser evaluate --fn '(el) => el.textContent' --ref <ref>
openclaw browser evaluate --fn 'const title = document.title; return title;'
openclaw browser evaluate --timeout-ms 30000 --fn 'async () => { await window.ready; return true; }'
```

`evaluate --fn`은 함수 소스, 표현식 또는 문 본문을 허용합니다. 문 본문은 비동기 함수로 래핑되므로 반환하려는 값에 `return`을 사용하십시오. 페이지 측 함수에 기본 평가 제한 시간보다 더 긴 시간이 필요할 수 있으면 `--timeout-ms`를 사용하십시오. `browser.evaluateEnabled=false`(기본값: `true`)로 설정하면 `evaluate`와 `wait --fn`이 모두 비활성화됩니다.

작업으로 인해 페이지가 교체된 후 OpenClaw가 교체 탭을 입증할 수 있으면 작업 응답은 현재 원시 `targetId`를 반환합니다. 장기간 실행되는 워크플로에서는 스크립트가 계속 `suggestedTargetId`/레이블을 저장하고 전달해야 합니다.

파일 및 대화 상자 도우미:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser upload media://inbound/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
```

관리형 Chrome 프로필은 일반적인 클릭으로 시작된 다운로드를 OpenClaw 다운로드 디렉터리(기본값은 `/tmp/openclaw/downloads`, 또는 구성된 임시 루트)에 저장합니다. 에이전트가 특정 파일을 기다렸다가 해당 경로를 반환해야 할 때는 `waitfordownload` 또는 `download`를 사용하십시오. 이러한 명시적 대기자는 다음 다운로드를 소유합니다. 업로드는 OpenClaw 임시 업로드 루트 및 OpenClaw가 관리하는 인바운드 미디어의 파일을 허용하며, 여기에는 `media://inbound/<id>` 및 샌드박스 상대 경로 `media/inbound/<id>` 참조가 포함됩니다. 중첩된 미디어 참조, 경로 탐색 및 임의의 로컬 경로는 거부됩니다.

작업이 모달 대화 상자를 열면 작업 응답은 `browserState.dialogs.pending`와 함께 `blockedByDialog`를 반환합니다. 직접 응답하려면 `--dialog-id`를 전달하십시오. OpenClaw 외부에서 처리된 대화 상자는 `browserState.dialogs.recent` 아래에 표시됩니다.

## 상태 및 스토리지

뷰포트 및 에뮬레이션:

```bash
openclaw browser resize 1280 720
openclaw browser set viewport 1280 720
openclaw browser set offline on
openclaw browser set media dark
openclaw browser set timezone Europe/London
openclaw browser set locale en-GB
openclaw browser set geo 51.5074 -0.1278 --accuracy 25
openclaw browser set device "iPhone 14"
openclaw browser set headers '{"x-test":"1"}'
openclaw browser set credentials myuser mypass
```

쿠키 및 스토리지:

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url https://example.com
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set token abc123
openclaw browser storage session clear
```

## 디버깅

```bash
openclaw browser console --level error
openclaw browser pdf
openclaw browser responsebody "**/api"
openclaw browser highlight <ref>
openclaw browser errors --clear
openclaw browser requests --filter api
openclaw browser trace start
openclaw browser trace stop --out trace.zip
```

## MCP를 통한 기존 Chrome 사용

기본 제공 `user` 프로필을 사용하거나 자체 `existing-session` 프로필을 생성하십시오.

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser create-profile --name chrome-port --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser --browser-profile chrome-live tabs
```

기본 existing-session 경로는 호스트 전용 Chrome MCP 자동 연결입니다. 브라우저가 이미 DevTools 엔드포인트와 함께 실행 중이라면 Chrome MCP가 대신 해당 엔드포인트에 연결하도록 `--cdp-url`을 전달하십시오. Chrome MCP 동작 방식이 필요하지 않은 Docker, Browserless 또는 기타 원격 설정에서는 대신 CDP 프로필을 사용하십시오.

현재 existing-session 제한 사항:

- 스냅샷 기반 작업은 CSS 선택자가 아닌 ref를 사용합니다.
- 호출자가 `timeoutMs`를 생략하면 `browser.actionTimeoutMs`는 지원되는 `act` 요청에 기본적으로 60000 ms를 적용하며, 호출별 `timeoutMs`가 지정된 경우에는 여전히 해당 값이 우선합니다.
- `click`은 왼쪽 클릭만 지원합니다.
- `type`은 `slowly=true`를 지원하지 않습니다.
- `press`는 `delayMs`를 지원하지 않습니다.
- `hover`, `scrollintoview`, `drag`, `select`, `fill`은 호출별 타임아웃 재정의를 허용하지 않으며, `evaluate`는 `--timeout-ms`를 허용합니다.
- `select`는 하나의 값만 지원합니다.
- `wait --load networkidle`은 지원되지 않습니다(관리형 및 원시/원격 CDP 프로필에서는 작동합니다).
- 파일 업로드에는 `--ref` / `--input-ref`가 필요하고 CSS `--element`는 지원하지 않으며, 한 번에 하나의 파일만 지원합니다.
- 대화 상자 훅은 `--timeout`을 지원하지 않습니다.
- 스크린샷은 페이지 캡처와 `--ref`를 지원하지만 CSS `--element`는 지원하지 않습니다.
- `responsebody`, 다운로드 가로채기, PDF 내보내기, 일괄 작업에는 여전히 관리형 브라우저 또는 원시 CDP 프로필이 필요합니다.

## 원격 브라우저 제어(Node 호스트 프록시)

Gateway가 브라우저와 다른 머신에서 실행되는 경우 Chrome/Brave/Edge/Chromium이 있는 머신에서 **Node 호스트**를 실행하십시오. Gateway가 브라우저 작업을 해당 Node로 프록시하므로 별도의 브라우저 제어 서버는 필요하지 않습니다.

자동 라우팅을 제어하려면 `gateway.nodes.browser.mode`를 사용하고, 여러 Node가 연결된 경우 특정 Node를 고정하려면 `gateway.nodes.browser.node`를 사용하십시오.

보안 및 원격 설정: [브라우저 도구](/ko/tools/browser), [원격 액세스](/ko/gateway/remote), [Tailscale](/ko/gateway/tailscale), [보안](/ko/gateway/security)

## 관련 문서

- [CLI 참조](/ko/cli)
- [브라우저](/ko/tools/browser)
