---
read_when:
    - '`openclaw browser`을 사용하며 일반적인 작업에 대한 예시가 필요합니다'
    - Node 호스트를 통해 다른 머신에서 실행 중인 브라우저를 제어하려고 합니다
    - Chrome MCP를 통해 로컬에 로그인된 Chrome에 연결하려고 합니다
summary: '`openclaw browser`용 CLI 참조(lifecycle, profiles, tabs, actions, state 및 디버깅)'
title: 브라우저
x-i18n:
    generated_at: "2026-04-26T11:24:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: b42511e841e768bfa4031463f213d78c67d5c63efb655a90f65c7e8c71da9881
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

OpenClaw의 브라우저 제어 표면을 관리하고 브라우저 작업을 실행합니다(lifecycle, profiles, tabs, snapshots, screenshots, navigation, input, state emulation, 디버깅).

관련 항목:

- 브라우저 도구 + API: [브라우저 도구](/ko/tools/browser)

## 공통 플래그

- `--url <gatewayWsUrl>`: Gateway WebSocket URL(기본값은 구성에서 가져옴)
- `--token <token>`: Gateway 토큰(필요한 경우)
- `--timeout <ms>`: 요청 타임아웃(ms)
- `--expect-final`: 최종 Gateway 응답을 기다림
- `--browser-profile <name>`: 브라우저 프로필 선택(기본값은 구성에서 가져옴)
- `--json`: 기계가 읽을 수 있는 출력(지원되는 경우)

## 빠른 시작(로컬)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

에이전트는 `browser({ action: "doctor" })`로 동일한 준비 상태 확인을 실행할 수 있습니다.

## 빠른 문제 해결

`start`가 `not reachable after start`로 실패하면 먼저 CDP 준비 상태를 점검하세요. `start`와 `tabs`는 성공하지만 `open` 또는 `navigate`가 실패한다면, 브라우저 제어 평면은 정상이며 실패 원인은 보통 navigation SSRF 정책입니다.

최소 순서:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

자세한 안내: [브라우저 문제 해결](/ko/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## lifecycle

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

- `doctor --deep`는 라이브 snapshot 프로브를 추가합니다. 기본 CDP 준비 상태는 정상이지만 현재 탭을 검사할 수 있다는 증거가 필요할 때 유용합니다.
- `attachOnly` 및 원격 CDP 프로필의 경우, `openclaw browser stop`은 OpenClaw가 브라우저 프로세스를 직접 실행하지 않았더라도 활성 제어 세션을 닫고 임시 emulation 재정의를 지웁니다.
- 로컬 관리형 프로필의 경우 `openclaw browser stop`은 생성된 브라우저 프로세스를 중지합니다.
- `openclaw browser start --headless`는 해당 시작 요청에만 적용되며, OpenClaw가 로컬 관리형 브라우저를 실행하는 경우에만 적용됩니다. `browser.headless`나 프로필 구성을 다시 쓰지 않으며, 이미 실행 중인 브라우저에는 효과가 없습니다.
- Linux 호스트에서 `DISPLAY` 또는 `WAYLAND_DISPLAY`가 없으면 `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless=false`, 또는 `browser.profiles.<name>.headless=false`로 표시 브라우저를 명시적으로 요청하지 않는 한 로컬 관리형 프로필은 자동으로 headless로 실행됩니다.

## 명령이 없는 경우

`openclaw browser`가 알 수 없는 명령이면 `~/.openclaw/openclaw.json`의 `plugins.allow`를 확인하세요.

`plugins.allow`가 있으면 번들된 browser Plugin을 명시적으로 나열해야 합니다:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`는 Plugin allowlist에서 `browser`가 제외된 경우 CLI 하위 명령을 복원하지 않습니다.

관련 항목: [브라우저 도구](/ko/tools/browser#missing-browser-command-or-tool)

## 프로필

프로필은 이름이 지정된 브라우저 라우팅 구성입니다. 실제로는 다음과 같습니다:

- `openclaw`: 전용 OpenClaw 관리 Chrome 인스턴스를 실행하거나 여기에 연결합니다(격리된 사용자 데이터 디렉터리).
- `user`: Chrome DevTools MCP를 통해 기존에 로그인된 Chrome 세션을 제어합니다.
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

## tabs

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

`tabs`는 먼저 `suggestedTargetId`를 반환하고, 그다음 `t1` 같은 안정적인 `tabId`, 선택적 label, 원시 `targetId`를 반환합니다. 에이전트는 `focus`, `close`, snapshot, actions에 `suggestedTargetId`를 다시 전달해야 합니다. `open --label`, `tab new --label`, 또는 `tab label`로 label을 지정할 수 있으며, label, tab id, 원시 target id, 고유한 target-id 접두사는 모두 허용됩니다. Chromium이 navigation 또는 form submit 중 기본 원시 대상을 교체하면, OpenClaw는 일치함을 증명할 수 있을 때 안정적인 `tabId`/label을 교체된 탭에 유지합니다. 원시 target id는 여전히 변동 가능하므로 `suggestedTargetId`를 사용하는 것이 좋습니다.

## snapshot / screenshot / actions

Snapshot:

```bash
openclaw browser snapshot
openclaw browser snapshot --urls
```

Screenshot:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
openclaw browser screenshot --labels
```

참고:

- `--full-page`는 페이지 캡처 전용이며 `--ref` 또는 `--element`와 함께 사용할 수 없습니다.
- `existing-session` / `user` 프로필은 페이지 screenshot과 snapshot 출력의 `--ref` screenshot은 지원하지만 CSS `--element` screenshot은 지원하지 않습니다.
- `--labels`는 현재 snapshot ref를 screenshot 위에 오버레이합니다.
- `snapshot --urls`는 발견된 링크 대상을 AI snapshot에 추가하므로, 에이전트가 링크 텍스트만으로 추측하지 않고 직접 navigation 대상을 선택할 수 있습니다.

Navigate/click/type(ref 기반 UI 자동화):

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

작업 응답은 OpenClaw가 교체된 탭을 증명할 수 있을 때 작업으로 유발된 페이지 교체 후 현재 원시 `targetId`를 반환합니다. 그래도 스크립트는 장기 워크플로를 위해 `suggestedTargetId`/label을 저장하고 전달해야 합니다.

파일 + dialog 도우미:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

관리형 Chrome 프로필은 일반적인 클릭으로 트리거된 다운로드를 OpenClaw downloads 디렉터리(기본값 `/tmp/openclaw/downloads` 또는 구성된 임시 루트)에 저장합니다. 에이전트가 특정 파일을 기다리고 해당 경로를 반환해야 하는 경우 `waitfordownload` 또는 `download`를 사용하세요. 이런 명시적 대기 기능이 다음 다운로드를 소유합니다.

## 상태 및 스토리지

Viewport + emulation:

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

Cookies + storage:

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

내장된 `user` 프로필을 사용하거나 직접 `existing-session` 프로필을 만드세요:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

이 경로는 호스트 전용입니다. Docker, headless 서버, Browserless 또는 기타 원격 설정에서는 대신 CDP 프로필을 사용하세요.

현재 existing-session 제한 사항:

- snapshot 기반 actions는 CSS 선택자가 아니라 ref를 사용합니다
- `browser.actionTimeoutMs`는 호출자가 `timeoutMs`를 생략할 때 지원되는 `act` 요청의 기본값을 60000ms로 설정합니다. 호출별 `timeoutMs`가 있으면 그 값이 우선합니다.
- `click`은 왼쪽 클릭만 지원합니다
- `type`은 `slowly=true`를 지원하지 않습니다
- `press`는 `delayMs`를 지원하지 않습니다
- `hover`, `scrollintoview`, `drag`, `select`, `fill`, `evaluate`는 호출별 타임아웃 재정의를 거부합니다
- `select`는 값 하나만 지원합니다
- `wait --load networkidle`은 지원되지 않습니다
- 파일 업로드는 `--ref` / `--input-ref`가 필요하며 CSS `--element`를 지원하지 않고, 현재 한 번에 파일 하나만 지원합니다
- dialog hooks는 `--timeout`을 지원하지 않습니다
- screenshots는 페이지 캡처와 `--ref`는 지원하지만 CSS `--element`는 지원하지 않습니다
- `responsebody`, 다운로드 가로채기, PDF 내보내기, batch actions는 여전히 관리형 브라우저 또는 원시 CDP 프로필이 필요합니다

## 원격 브라우저 제어(node host 프록시)

Gateway가 브라우저와 다른 머신에서 실행 중이라면 Chrome/Brave/Edge/Chromium이 있는 머신에서 **node host**를 실행하세요. Gateway는 브라우저 작업을 해당 node로 프록시합니다(별도의 브라우저 제어 서버 불필요).

자동 라우팅을 제어하려면 `gateway.nodes.browser.mode`를 사용하고, 여러 node가 연결된 경우 특정 node를 고정하려면 `gateway.nodes.browser.node`를 사용하세요.

보안 + 원격 설정: [브라우저 도구](/ko/tools/browser), [원격 액세스](/ko/gateway/remote), [Tailscale](/ko/gateway/tailscale), [보안](/ko/gateway/security)

## 관련

- [CLI 참조](/ko/cli)
- [브라우저](/ko/tools/browser)
