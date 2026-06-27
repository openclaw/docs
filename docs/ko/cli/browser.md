---
read_when:
    - '`openclaw browser`을 사용 중이며 일반적인 작업 예제가 필요한 경우'
    - 다른 머신에서 실행 중인 브라우저를 Node 호스트를 통해 제어하려는 경우
    - Chrome MCP를 통해 로컬에서 로그인된 Chrome에 연결하려고 합니다.
summary: '`openclaw browser`의 CLI 참조(수명 주기, 프로필, 탭, 작업, 상태 및 디버깅)'
title: 브라우저
x-i18n:
    generated_at: "2026-06-27T17:16:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9e45a6b89f23623c25b61d41273151b60da1fc415b5d3c901d8c555d8244f7a
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

OpenClaw의 브라우저 제어 표면을 관리하고 브라우저 작업(수명 주기, 프로필, 탭, 스냅샷, 스크린샷, 탐색, 입력, 상태 에뮬레이션, 디버깅)을 실행합니다.

관련 항목:

- 브라우저 도구 + API: [브라우저 도구](/ko/tools/browser)

## 공통 플래그

- `--url <gatewayWsUrl>`: Gateway WebSocket URL(기본값은 구성).
- `--token <token>`: Gateway 토큰(필요한 경우).
- `--timeout <ms>`: 요청 제한 시간(ms).
- `--expect-final`: 최종 Gateway 응답을 기다립니다.
- `--browser-profile <name>`: 브라우저 프로필을 선택합니다(기본값은 구성에서 가져옴).
- `--json`: 기계가 읽을 수 있는 출력(지원되는 경우).

## 빠른 시작(로컬)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

에이전트도 `browser({ action: "doctor" })`로 동일한 준비 상태 검사를 실행할 수 있습니다.

## 빠른 문제 해결

`start`가 `not reachable after start`로 실패하면 먼저 CDP 준비 상태를 문제 해결하세요. `start`와 `tabs`는 성공하지만 `open` 또는 `navigate`가 실패하면 브라우저 제어 플레인은 정상이며 실패 원인은 대개 탐색 SSRF 정책입니다.

최소 시퀀스:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

자세한 안내: [브라우저 문제 해결](/ko/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

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

참고:

- `doctor --deep`는 라이브 스냅샷 프로브를 추가합니다. 기본 CDP
  준비 상태는 정상으로 표시되지만 현재 탭을 검사할 수 있다는 증거가 필요할 때 유용합니다.
- `attachOnly` 및 원격 CDP 프로필의 경우, OpenClaw가 브라우저 프로세스를 직접
  실행하지 않았더라도 `openclaw browser stop`은 활성 제어 세션을 닫고
  임시 에뮬레이션 재정의를 지웁니다.
- 로컬 관리 프로필의 경우 `openclaw browser stop`은 생성된 브라우저
  프로세스를 중지합니다.
- `openclaw browser start --headless`는 해당 시작 요청에만 적용되며
  OpenClaw가 로컬 관리 브라우저를 실행할 때만 적용됩니다. `browser.headless`
  또는 프로필 구성을 다시 쓰지 않으며, 이미 실행 중인 브라우저에는 아무 작업도 하지 않습니다.
- `DISPLAY` 또는 `WAYLAND_DISPLAY`가 없는 Linux 호스트에서는
  `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless=false` 또는
  `browser.profiles.<name>.headless=false`가 표시되는 브라우저를 명시적으로
  요청하지 않는 한 로컬 관리 프로필이 자동으로 headless로 실행됩니다.

## 명령이 없는 경우

`openclaw browser`가 알 수 없는 명령이면
`~/.openclaw/openclaw.json`의 `plugins.allow`를 확인하세요.

`plugins.allow`가 있는 경우 구성에 루트 `browser` 블록이 이미 있지 않다면
번들 브라우저 Plugin을 명시적으로 나열하세요.

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

예를 들어 `browser.enabled=true` 또는 `browser.profiles.<name>` 같은
명시적인 루트 `browser` 블록도 제한적인 Plugin 허용 목록에서 번들 브라우저 Plugin을 활성화합니다.

관련 항목: [브라우저 도구](/ko/tools/browser#missing-browser-command-or-tool)

## 프로필

프로필은 이름이 지정된 브라우저 라우팅 구성입니다. 실제로는 다음과 같습니다.

- `openclaw`: 전용 OpenClaw 관리 Chrome 인스턴스를 실행하거나 연결합니다(격리된 사용자 데이터 디렉터리).
- `user`: Chrome DevTools MCP를 통해 기존 로그인된 Chrome 세션을 제어합니다.
- 사용자 지정 CDP 프로필: 로컬 또는 원격 CDP 엔드포인트를 가리킵니다.

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

특정 프로필 사용:

```bash
openclaw browser --browser-profile work tabs
```

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

`tabs`는 먼저 `suggestedTargetId`를 반환한 다음, `t1` 같은 안정적인 `tabId`,
선택적 레이블, 원시 `targetId`를 반환합니다. 에이전트는
`suggestedTargetId`를 `focus`, `close`, 스냅샷 및 작업에 다시 전달해야 합니다. `open --label`, `tab new --label` 또는 `tab label`로
레이블을 지정할 수 있으며, 레이블, 탭 ID, 원시 대상 ID, 고유한 대상 ID 접두사가 모두 허용됩니다.
요청 필드 이름은 호환성을 위해 여전히 `targetId`이지만, 이러한 탭 참조를 허용합니다. 원시 대상 ID는 지속적인 에이전트 메모리가 아니라
진단용 핸들로 취급하세요.
Chromium이 탐색 또는 양식 제출 중 기본 원시 대상을 교체하면,
OpenClaw는 일치 여부를 증명할 수 있을 때 안정적인 `tabId`/레이블을 교체 탭에 계속 연결합니다.
원시 대상 ID는 계속 변동될 수 있으므로 `suggestedTargetId`를 선호하세요.

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

참고:

- `--full-page`는 페이지 캡처 전용이며 `--ref`
  또는 `--element`와 함께 사용할 수 없습니다.
- `existing-session` / `user` 프로필은 페이지 스크린샷과 스냅샷 출력의 `--ref`
  스크린샷을 지원하지만, CSS `--element` 스크린샷은 지원하지 않습니다.
- `--labels`는 현재 스냅샷 참조를 스크린샷 위에 오버레이합니다. 
  Playwright 기반 프로필에서는 `--full-page`(전체 페이지 레이블
  오버레이), `--ref`(ARIA 참조별 요소 클립 레이블 오버레이), `--element`
  (CSS 선택자별 요소 클립 레이블 오버레이)와 함께 작동합니다. 요소 클립 모드에서는 레이블이
  요소를 기준으로 투영됩니다. 응답에는 각 참조의 경계 상자를 포함하는
  `annotations` 배열도 포함됩니다. 각 항목에는 `ref`,
  `number`, `role`, 선택적 `name`, `box: {x, y, width, height}`가 있으며,
  좌표는 캡처된 이미지의 공간(뷰포트 / 전체 페이지 /
  요소 기준)에 있습니다. 비어 있으면 필드가 생략됩니다.
  `existing-session` 프로필은 페이지 스크린샷에 chrome-mcp 오버레이를 렌더링하지만
  Playwright 투영 헬퍼를 사용하지 않고 `annotations`도 포함하지 않습니다. CSS `--element` 스크린샷은 여기서 지원되지 않습니다. Playwright 또는 chrome-mcp가 없으면
  레이블이 있는 스크린샷을 사용할 수 없습니다. 이전
  릴리스는 레이블이 있는 Playwright 스크린샷에서 `--full-page`, `--ref`, `--element`를 무시하고 항상 뷰포트 캡처를 반환했습니다. 이제 레이블이 있는
  스크린샷은 해당 범위를 준수합니다.
- `snapshot --urls`는 발견된 링크 대상을 AI 스냅샷에 추가하므로
  에이전트가 링크 텍스트만 보고 추측하는 대신 직접 탐색 대상을 선택할 수 있습니다.

탐색/클릭/입력(ref 기반 UI 자동화):

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

`evaluate --fn`은 함수 소스, 표현식 또는 문 본문을 허용합니다.
문 본문은 async 함수로 래핑되므로 되돌려받고 싶은 값에는 `return`을 사용하세요.
페이지 쪽 함수가 기본 evaluate 제한 시간보다 더 오래 걸릴 수 있을 때는 `evaluate --timeout-ms <ms>`를 사용하세요.

작업 응답은 OpenClaw가 교체 탭을 증명할 수 있을 때, 작업으로 유발된 페이지
교체 이후 현재 원시 `targetId`를 반환합니다. 스크립트는 장기 워크플로를 위해 여전히
`suggestedTargetId`/레이블을 저장하고 전달해야 합니다.

파일 + 대화 상자 헬퍼:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser upload media://inbound/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
```

관리되는 Chrome 프로필은 일반 클릭으로 트리거된 다운로드를 OpenClaw
다운로드 디렉터리(기본값은 `/tmp/openclaw/downloads`, 또는 구성된 임시
루트)에 저장합니다. 에이전트가 특정 파일을 기다리고 해당 경로를 반환해야 할 때는
`waitfordownload` 또는 `download`를 사용하세요. 이러한 명시적 대기자는 다음 다운로드를 소유합니다.
업로드는 OpenClaw 임시 업로드 루트와 OpenClaw 관리
인바운드 미디어의 파일을 허용하며, 여기에는 `media://inbound/<id>` 및 샌드박스 상대
`media/inbound/<id>` 참조가 포함됩니다. 중첩된 미디어 참조, 경로 탐색 및 임의의
로컬 경로는 계속 거부됩니다.
작업이 모달 대화 상자를 열면 작업 응답은
`browserState.dialogs.pending`와 함께 `blockedByDialog`를 반환합니다. 직접 응답하려면 `--dialog-id`를 전달하세요.
OpenClaw 외부에서 처리된 대화 상자는
`browserState.dialogs.recent` 아래에 표시됩니다.

## 상태 및 저장소

뷰포트 + 에뮬레이션:

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

쿠키 + 저장소:

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

## MCP를 통한 기존 Chrome

기본 제공 `user` 프로필을 사용하거나 직접 `existing-session` 프로필을 만드세요.

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser create-profile --name chrome-port --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser --browser-profile chrome-live tabs
```

기본 existing-session 경로는 호스트 전용 Chrome MCP 자동 연결입니다. 브라우저가 이미
DevTools 엔드포인트로 실행 중이면, Chrome MCP가 대신 해당 엔드포인트에 연결하도록 `--cdp-url`을 전달하세요.
Docker, Browserless 또는 Chrome MCP 의미 체계가 필요하지 않은 다른 원격 설정에서는
CDP 프로필을 사용하세요.

현재 existing-session 제한 사항:

- 스냅샷 기반 동작은 CSS 선택자가 아니라 refs를 사용합니다
- `browser.actionTimeoutMs`는 호출자가 `timeoutMs`를 생략하면 지원되는 `act` 요청의 기본값을 60000 ms로 설정합니다. 호출별 `timeoutMs`가 여전히 우선합니다.
- `click`은 왼쪽 클릭만 지원합니다
- `type`은 `slowly=true`를 지원하지 않습니다
- `press`는 `delayMs`를 지원하지 않습니다
- `hover`, `scrollintoview`, `drag`, `select`, `fill`, `evaluate`는 호출별 타임아웃 재정의를 거부합니다
- `select`는 값 하나만 지원합니다
- `wait --load networkidle`은 기존 세션 프로필에서 지원되지 않습니다(관리형 및 원시/원격 CDP에서는 작동)
- 파일 업로드에는 `--ref` / `--input-ref`가 필요하며, CSS `--element`를 지원하지 않고, 현재 한 번에 파일 하나만 지원합니다
- 대화 상자 훅은 `--timeout`을 지원하지 않습니다
- 스크린샷은 페이지 캡처와 `--ref`를 지원하지만 CSS `--element`는 지원하지 않습니다
- `responsebody`, 다운로드 가로채기, PDF 내보내기, 배치 동작에는 여전히 관리형 브라우저 또는 원시 CDP 프로필이 필요합니다

## 원격 브라우저 제어(node host 프록시)

Gateway가 브라우저와 다른 머신에서 실행되는 경우 Chrome/Brave/Edge/Chromium이 있는 머신에서 **node host**를 실행하세요. Gateway는 브라우저 동작을 해당 노드로 프록시합니다(별도의 브라우저 제어 서버는 필요 없음).

자동 라우팅을 제어하려면 `gateway.nodes.browser.mode`를 사용하고, 여러 노드가 연결된 경우 특정 노드를 고정하려면 `gateway.nodes.browser.node`를 사용하세요.

보안 + 원격 설정: [브라우저 도구](/ko/tools/browser), [원격 액세스](/ko/gateway/remote), [Tailscale](/ko/gateway/tailscale), [보안](/ko/gateway/security)

## 관련 항목

- [CLI 참조](/ko/cli)
- [브라우저](/ko/tools/browser)
