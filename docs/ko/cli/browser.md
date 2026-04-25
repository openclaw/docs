---
read_when:
    - '`openclaw browser`를 사용 중이며 일반적인 작업에 대한 예시가 필요합니다'
    - Node 호스트를 통해 다른 머신에서 실행 중인 브라우저를 제어하려고 합니다
    - Chrome MCP를 통해 로컬에서 로그인된 Chrome에 연결하려고 합니다
summary: '`openclaw browser`용 CLI 참조(수명 주기, 프로필, 탭, 작업, 상태 및 디버깅)'
title: 브라우저
x-i18n:
    generated_at: "2026-04-25T05:58:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9da317f18128075203febae3b4c0e416d3a797cb92d473d35488098814a005d
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

OpenClaw의 브라우저 제어 표면을 관리하고 브라우저 작업을 실행합니다(수명 주기, 프로필, 탭, 스냅샷, 스크린샷, 탐색, 입력, 상태 에뮬레이션, 디버깅).

관련 항목:

- 브라우저 도구 + API: [Browser tool](/ko/tools/browser)

## 공통 플래그

- `--url <gatewayWsUrl>`: Gateway WebSocket URL(config 기본값 사용).
- `--token <token>`: Gateway 토큰(필요한 경우).
- `--timeout <ms>`: 요청 타임아웃(ms).
- `--expect-final`: 최종 Gateway 응답까지 대기.
- `--browser-profile <name>`: 브라우저 프로필 선택(config 기본값 사용).
- `--json`: 기계 판독 가능한 출력(지원되는 경우).

## 빠른 시작(로컬)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

에이전트도 `browser({ action: "doctor" })`로 같은 준비 상태 검사를 실행할 수 있습니다.

## 빠른 문제 해결

`start`가 `not reachable after start`로 실패하면 먼저 CDP 준비 상태를 점검하세요. `start`와 `tabs`는 성공하지만 `open`이나 `navigate`가 실패한다면, 브라우저 제어 평면은 정상이며 실패 원인은 대체로 탐색 SSRF 정책입니다.

최소 순서:

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
openclaw browser start
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

참고:

- `attachOnly` 및 원격 CDP 프로필에서는, OpenClaw가 브라우저 프로세스를 직접 시작하지 않았더라도 `openclaw browser stop`이 활성 제어 세션을 닫고 임시 에뮬레이션 재정의를 지웁니다.
- 로컬 관리형 프로필에서는 `openclaw browser stop`이 생성된 브라우저 프로세스를 중지합니다.

## 명령어가 없을 때

`openclaw browser`가 알 수 없는 명령어라면 `~/.openclaw/openclaw.json`의 `plugins.allow`를 확인하세요.

`plugins.allow`가 있으면 번들된 브라우저 Plugin을 명시적으로 나열해야 합니다:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Plugin 허용 목록에서 `browser`가 제외되면 `browser.enabled=true`를 설정해도 CLI 하위 명령은 복원되지 않습니다.

관련 항목: [Browser tool](/ko/tools/browser#missing-browser-command-or-tool)

## 프로필

프로필은 이름이 지정된 브라우저 라우팅 config입니다. 실제로는 다음과 같습니다:

- `openclaw`: 전용 OpenClaw 관리 Chrome 인스턴스를 시작하거나 여기에 연결합니다(격리된 사용자 데이터 디렉터리).
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

`tabs`는 먼저 `suggestedTargetId`를 반환하고, 그다음 `t1` 같은 안정적인 `tabId`, 선택적 레이블, 원시 `targetId`를 반환합니다. 에이전트는 `focus`, `close`, 스냅샷, 작업에 `suggestedTargetId`를 다시 전달해야 합니다. `open --label`, `tab new --label`, `tab label`로 레이블을 지정할 수 있으며, 레이블, 탭 id, 원시 target id, 고유한 target-id 접두사가 모두 허용됩니다.

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

- `--full-page`는 페이지 캡처 전용이며 `--ref` 또는 `--element`와 함께 사용할 수 없습니다.
- `existing-session` / `user` 프로필은 페이지 스크린샷과 스냅샷 출력의 `--ref` 스크린샷은 지원하지만 CSS `--element` 스크린샷은 지원하지 않습니다.
- `--labels`는 현재 스냅샷 ref를 스크린샷 위에 오버레이합니다.
- `snapshot --urls`는 발견된 링크 대상을 AI 스냅샷에 추가하므로, 에이전트가 링크 텍스트만으로 추측하지 않고 직접 탐색 대상을 선택할 수 있습니다.

탐색/클릭/입력(ref 기반 UI 자동화):

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
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

파일 + 대화상자 도우미:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

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

내장 `user` 프로필을 사용하거나 직접 `existing-session` 프로필을 만드세요:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

이 경로는 호스트 전용입니다. Docker, 헤드리스 서버, Browserless 또는 기타 원격 설정에는 대신 CDP 프로필을 사용하세요.

현재 existing-session 제한 사항:

- 스냅샷 기반 작업은 CSS 선택자가 아니라 ref를 사용합니다
- `click`은 왼쪽 클릭만 지원합니다
- `type`은 `slowly=true`를 지원하지 않습니다
- `press`는 `delayMs`를 지원하지 않습니다
- `hover`, `scrollintoview`, `drag`, `select`, `fill`, `evaluate`는 호출별 타임아웃 재정의를 거부합니다
- `select`는 값 하나만 지원합니다
- `wait --load networkidle`은 지원되지 않습니다
- 파일 업로드에는 `--ref` / `--input-ref`가 필요하며 CSS `--element`는 지원하지 않고, 현재 한 번에 파일 하나만 지원합니다
- 대화상자 훅은 `--timeout`을 지원하지 않습니다
- 스크린샷은 페이지 캡처와 `--ref`는 지원하지만 CSS `--element`는 지원하지 않습니다
- `responsebody`, 다운로드 가로채기, PDF 내보내기, 일괄 작업은 여전히 관리형 브라우저 또는 원시 CDP 프로필이 필요합니다

## 원격 브라우저 제어(Node 호스트 프록시)

Gateway가 브라우저와 다른 머신에서 실행되는 경우, Chrome/Brave/Edge/Chromium이 있는 머신에서 **Node 호스트**를 실행하세요. Gateway가 브라우저 작업을 해당 노드로 프록시합니다(별도의 브라우저 제어 서버는 필요 없음).

자동 라우팅을 제어하려면 `gateway.nodes.browser.mode`를 사용하고, 여러 노드가 연결되어 있을 때 특정 노드에 고정하려면 `gateway.nodes.browser.node`를 사용하세요.

보안 + 원격 설정: [Browser tool](/ko/tools/browser), [원격 액세스](/ko/gateway/remote), [Tailscale](/ko/gateway/tailscale), [보안](/ko/gateway/security)

## 관련 항목

- [CLI 참조](/ko/cli)
- [브라우저](/ko/tools/browser)
