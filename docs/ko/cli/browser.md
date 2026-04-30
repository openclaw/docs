---
read_when:
    - '`openclaw browser`를 사용하고 있으며 일반적인 작업에 대한 예시가 필요합니다'
    - Node 호스트를 통해 다른 컴퓨터에서 실행 중인 브라우저를 제어하려고 합니다
    - Chrome MCP를 통해 로컬에서 로그인된 Chrome에 연결하려고 합니다
summary: '`openclaw browser`에 대한 CLI 참조(수명 주기, 프로필, 탭, 작업, 상태 및 디버깅)'
title: 브라우저
x-i18n:
    generated_at: "2026-04-30T06:21:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7b5112c61e8289ab6a02bc30c9aefe640c053271f82197c0ee810b4a5efa580
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

에이전트는 `browser({ action: "doctor" })`로 동일한 준비 상태 검사를 실행할 수 있습니다.

## 빠른 문제 해결

`start`가 `not reachable after start`로 실패하면 먼저 CDP 준비 상태를 문제 해결하세요. `start`와 `tabs`는 성공하지만 `open` 또는 `navigate`가 실패하면 브라우저 제어 플레인은 정상이며, 실패 원인은 보통 탐색 SSRF 정책입니다.

최소 절차:

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

- `doctor --deep`는 실시간 스냅샷 프로브를 추가합니다. 기본 CDP
  준비 상태는 정상으로 표시되지만 현재 탭을 검사할 수 있다는 증거가 필요할 때 유용합니다.
- `attachOnly` 및 원격 CDP 프로필의 경우 `openclaw browser stop`은
  활성 제어 세션을 닫고 임시 에뮬레이션 오버라이드를 지웁니다. 이는
  OpenClaw가 브라우저 프로세스를 직접 실행하지 않았더라도 동일합니다.
- 로컬 관리형 프로필의 경우 `openclaw browser stop`은 생성된 브라우저
  프로세스를 중지합니다.
- `openclaw browser start --headless`는 해당 시작 요청에만 적용되며,
  OpenClaw가 로컬 관리형 브라우저를 실행할 때만 적용됩니다. 이는
  `browser.headless` 또는 프로필 구성을 다시 쓰지 않으며, 이미 실행 중인
  브라우저에는 아무 작업도 하지 않습니다.
- `DISPLAY` 또는 `WAYLAND_DISPLAY`가 없는 Linux 호스트에서는
  `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless=false` 또는
  `browser.profiles.<name>.headless=false`가 보이는 브라우저를 명시적으로
  요청하지 않는 한 로컬 관리형 프로필이 자동으로 헤드리스로 실행됩니다.

## 명령이 없는 경우

`openclaw browser`가 알 수 없는 명령이면
`~/.openclaw/openclaw.json`의 `plugins.allow`를 확인하세요.

`plugins.allow`가 있으면 구성에 루트 `browser` 블록이 이미 없는 한
번들 브라우저 Plugin을 명시적으로 나열하세요.

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

예를 들어 `browser.enabled=true` 또는 `browser.profiles.<name>` 같은
명시적인 루트 `browser` 블록도 제한적인 Plugin 허용 목록에서 번들 브라우저
Plugin을 활성화합니다.

관련 항목: [브라우저 도구](/ko/tools/browser#missing-browser-command-or-tool)

## 프로필

프로필은 이름이 지정된 브라우저 라우팅 구성입니다. 실제로는 다음과 같습니다.

- `openclaw`: 전용 OpenClaw 관리 Chrome 인스턴스를 실행하거나 여기에 연결합니다(격리된 사용자 데이터 디렉터리).
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
선택적 레이블, 원시 `targetId`를 반환합니다. 에이전트는 `suggestedTargetId`를
`focus`, `close`, 스냅샷 및 작업에 다시 전달해야 합니다. `open --label`,
`tab new --label` 또는 `tab label`로 레이블을 지정할 수 있으며, 레이블,
탭 ID, 원시 대상 ID, 고유 대상 ID 접두사를 모두 사용할 수 있습니다.
탐색 또는 양식 제출 중 Chromium이 기반 원시 대상을 교체하면, OpenClaw는
일치를 증명할 수 있을 때 안정적인 `tabId`/레이블을 교체 탭에 계속 연결합니다.
원시 대상 ID는 계속 변할 수 있으므로 `suggestedTargetId`를 선호하세요.

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

- `--full-page`는 페이지 캡처 전용이며, `--ref` 또는 `--element`와 함께
  사용할 수 없습니다.
- `existing-session` / `user` 프로필은 페이지 스크린샷과 스냅샷 출력의
  `--ref` 스크린샷을 지원하지만 CSS `--element` 스크린샷은 지원하지 않습니다.
- `--labels`는 현재 스냅샷 참조를 스크린샷 위에 오버레이합니다.
- `snapshot --urls`는 발견된 링크 목적지를 AI 스냅샷에 추가하여
  에이전트가 링크 텍스트만 보고 추측하는 대신 직접 탐색 대상을 선택할 수 있게 합니다.

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
```

작업 응답은 OpenClaw가 교체 탭을 증명할 수 있을 때 작업으로 트리거된 페이지
교체 후 현재 원시 `targetId`를 반환합니다. 스크립트는 장기 워크플로를 위해
계속 `suggestedTargetId`/레이블을 저장하고 전달해야 합니다.

파일 + 대화 상자 헬퍼:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

관리형 Chrome 프로필은 일반 클릭으로 트리거된 다운로드를 OpenClaw
다운로드 디렉터리(기본값 `/tmp/openclaw/downloads` 또는 구성된 임시 루트)에
저장합니다. 에이전트가 특정 파일을 기다리고 그 경로를 반환해야 할 때
`waitfordownload` 또는 `download`를 사용하세요. 이러한 명시적 대기 도구가
다음 다운로드를 소유합니다.

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

내장 `user` 프로필을 사용하거나 자체 `existing-session` 프로필을 만드세요.

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

이 경로는 호스트 전용입니다. Docker, 헤드리스 서버, Browserless 또는 기타 원격 설정에는 대신 CDP 프로필을 사용하세요.

현재 existing-session 제한 사항:

- 스냅샷 기반 작업은 CSS 선택자가 아니라 참조를 사용합니다
- `browser.actionTimeoutMs`는 호출자가 `timeoutMs`를 생략하면 지원되는 `act`
  요청의 기본값을 60000 ms로 설정합니다. 호출별 `timeoutMs`가 있으면 여전히
  우선합니다.
- `click`은 왼쪽 클릭만 지원합니다
- `type`은 `slowly=true`를 지원하지 않습니다
- `press`는 `delayMs`를 지원하지 않습니다
- `hover`, `scrollintoview`, `drag`, `select`, `fill`, `evaluate`는 호출별
  제한 시간 오버라이드를 거부합니다
- `select`는 하나의 값만 지원합니다
- `wait --load networkidle`는 지원되지 않습니다
- 파일 업로드에는 `--ref` / `--input-ref`가 필요하고, CSS
  `--element`를 지원하지 않으며, 현재 한 번에 하나의 파일만 지원합니다
- 대화 상자 훅은 `--timeout`을 지원하지 않습니다
- 스크린샷은 페이지 캡처와 `--ref`를 지원하지만 CSS `--element`는 지원하지 않습니다
- `responsebody`, 다운로드 가로채기, PDF 내보내기, 배치 작업은 여전히
  관리형 브라우저 또는 원시 CDP 프로필이 필요합니다

## 원격 브라우저 제어(노드 호스트 프록시)

Gateway가 브라우저와 다른 머신에서 실행되는 경우 Chrome/Brave/Edge/Chromium이 있는 머신에서 **노드 호스트**를 실행하세요. Gateway는 브라우저 작업을 해당 노드로 프록시합니다(별도의 브라우저 제어 서버는 필요하지 않음).

자동 라우팅을 제어하려면 `gateway.nodes.browser.mode`를 사용하고, 여러 노드가 연결되어 있을 때 특정 노드에 고정하려면 `gateway.nodes.browser.node`를 사용하세요.

보안 + 원격 설정: [브라우저 도구](/ko/tools/browser), [원격 액세스](/ko/gateway/remote), [Tailscale](/ko/gateway/tailscale), [보안](/ko/gateway/security)

## 관련 항목

- [CLI 참조](/ko/cli)
- [브라우저](/ko/tools/browser)
