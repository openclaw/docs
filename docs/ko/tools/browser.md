---
read_when:
    - 에이전트 제어 브라우저 자동화 추가하기
    - openclaw가 사용자의 Chrome에 간섭하는 이유 디버깅하기
    - macOS 앱에서 브라우저 설정 + lifecycle 구현하기
summary: 통합 브라우저 제어 서비스 + 작업 명령어
title: 브라우저 (OpenClaw 관리형)
x-i18n:
    generated_at: "2026-04-26T11:39:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: aba4c06f351296145b7a282bb692c2d10dba0668f90aabf1d981fb18199c3d74
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw는 에이전트가 제어하는 **전용 Chrome/Brave/Edge/Chromium 프로필**을 실행할 수 있습니다.
이 브라우저는 개인 브라우저와 분리되어 있으며, Gateway 내부의 작은 로컬
제어 서비스(loopback 전용)를 통해 관리됩니다.

초보자 관점에서 보면:

- 이것은 **에이전트 전용 별도 브라우저**라고 생각하면 됩니다.
- `openclaw` 프로필은 개인 브라우저 프로필을 건드리지 않습니다.
- 에이전트는 안전한 경로에서 **탭 열기, 페이지 읽기, 클릭, 입력**을 수행할 수 있습니다.
- 기본 제공 `user` 프로필은 Chrome MCP를 통해 실제 로그인된 Chrome 세션에 연결합니다.

## 제공되는 기능

- **openclaw**라는 별도의 브라우저 프로필(기본적으로 주황색 강조)
- 결정적인 탭 제어(list/open/focus/close)
- 에이전트 작업(click/type/drag/select), snapshot, screenshot, PDF
- 브라우저 Plugin이 활성화되어 있을 때 snapshot,
  stable-tab, stale-ref, manual-blocker 복구 루프를 에이전트에게 가르치는 번들 `browser-automation` skill
- 선택적 다중 프로필 지원(`openclaw`, `work`, `remote`, ...)

이 브라우저는 **일상용 브라우저가 아닙니다**. 에이전트 자동화와 검증을 위한
안전하고 격리된 표면입니다.

## 빠른 시작

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

“Browser disabled”가 표시되면 config에서 활성화한 뒤(아래 참고) Gateway를 재시작하세요.

`openclaw browser` 자체가 없거나, 에이전트가 browser 도구를 사용할 수 없다고 말한다면 [Missing browser command or tool](/ko/tools/browser#missing-browser-command-or-tool)로 이동하세요.

## Plugin 제어

기본 `browser` 도구는 번들 Plugin입니다. 같은 `browser` 도구 이름을 등록하는 다른 Plugin으로 교체하려면 이를 비활성화하세요.

```json5
{
  plugins: {
    entries: {
      browser: {
        enabled: false,
      },
    },
  },
}
```

기본값이 동작하려면 `plugins.entries.browser.enabled`와 `browser.enabled=true`가 **둘 다** 필요합니다. Plugin만 비활성화하면 `openclaw browser` CLI, `browser.request` gateway 메서드, 에이전트 도구, 제어 서비스가 한 단위로 제거되며, `browser.*` config는 교체용 Plugin을 위해 그대로 유지됩니다.

브라우저 config 변경은 Plugin이 서비스를 다시 등록할 수 있도록 Gateway 재시작이 필요합니다.

## 에이전트 가이드

도구 프로필 참고: `tools.profile: "coding"`에는 `web_search`와
`web_fetch`가 포함되지만, 전체 `browser` 도구는 포함되지 않습니다. 에이전트나
생성된 서브에이전트가 browser 자동화를 사용해야 한다면 프로필 단계에서 browser를 추가하세요.

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

단일 에이전트에 대해서는 `agents.list[].tools.alsoAllow: ["browser"]`를 사용하세요.
`tools.subagents.tools.allow: ["browser"]`만으로는 충분하지 않습니다. 서브에이전트 정책은 프로필 필터링 이후에 적용되기 때문입니다.

브라우저 Plugin은 두 단계의 에이전트 가이드를 제공합니다.

- `browser` 도구 설명에는 항상 적용되는 압축 계약이 담겨 있습니다. 올바른 프로필 선택, 같은 탭에서 ref 유지, 탭 대상 지정에 `tabId`/레이블 사용, 다단계 작업에는 browser skill 로드
- 번들 `browser-automation` skill에는 더 긴 운영 루프가 담겨 있습니다. 먼저 status/tabs 확인, 작업 탭에 레이블 지정, 작업 전 snapshot, UI 변경 후 재-snapshot, stale ref 한 번 복구, 로그인/2FA/captcha 또는 camera/microphone 차단은 추측하지 말고 수동 작업으로 보고

Plugin 번들 Skills는 Plugin이 활성화되면 에이전트의 사용 가능한 Skills 목록에 표시됩니다. 전체 skill 지침은 필요할 때만 로드되므로, 일반 턴에서는 전체 토큰 비용을 지불하지 않습니다.

## 브라우저 명령이나 도구가 없는 경우

업그레이드 후 `openclaw browser`를 알 수 없거나, `browser.request`가 없거나, 에이전트가 browser 도구를 사용할 수 없다고 보고하는 가장 일반적인 원인은 `browser`를 포함하지 않는 `plugins.allow` 목록입니다. 다음과 같이 추가하세요.

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true`, `tools.alsoAllow: ["browser"]`는 allowlist 멤버십을 대신하지 못합니다. allowlist가 Plugin 로딩을 제어하고, 도구 정책은 로딩 이후에만 적용되기 때문입니다. `plugins.allow`를 완전히 제거해도 기본 동작이 복원됩니다.

## 프로필: `openclaw` vs `user`

- `openclaw`: 관리형, 격리된 브라우저(확장 필요 없음)
- `user`: **실제 로그인된 Chrome** 세션에 연결하는 기본 제공 Chrome MCP attach 프로필

에이전트 browser 도구 호출 시:

- 기본값: 격리된 `openclaw` 브라우저 사용
- 기존 로그인 세션이 중요하고 사용자가 컴퓨터 앞에서 attach 프롬프트를 클릭/승인할 수 있다면 `profile="user"` 선호
- `profile`은 특정 브라우저 모드를 원할 때의 명시적 재정의입니다

관리형 모드를 기본값으로 사용하려면 `browser.defaultProfile: "openclaw"`를 설정하세요.

## 구성

브라우저 설정은 `~/.openclaw/openclaw.json`에 있습니다.

```json5
{
  browser: {
    enabled: true, // 기본값: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // 신뢰된 private-network 액세스에만 옵트인
      // allowPrivateNetwork: true, // 레거시 별칭
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // 레거시 단일 프로필 재정의
    remoteCdpTimeoutMs: 1500, // 원격 CDP HTTP timeout (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // 원격 CDP WebSocket handshake timeout (ms)
    localLaunchTimeoutMs: 15000, // 로컬 관리형 Chrome 검색 timeout (ms)
    localCdpReadyTimeoutMs: 8000, // 로컬 관리형 시작 후 CDP 준비 timeout (ms)
    actionTimeoutMs: 60000, // 기본 browser act timeout (ms)
    tabCleanup: {
      enabled: true, // 기본값: true
      idleMinutes: 120, // idle cleanup 비활성화하려면 0
      maxTabsPerSession: 8, // 세션당 상한 비활성화하려면 0
      sweepMinutes: 5,
    },
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        headless: true,
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: {
        driver: "existing-session",
        attachOnly: true,
        color: "#00AA00",
      },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
  },
}
```

<AccordionGroup>

<Accordion title="포트 및 도달 가능성">

- 제어 서비스는 `gateway.port`에서 파생된 포트(default `18791` = gateway + 2)로 loopback에 바인딩됩니다. `gateway.port` 또는 `OPENCLAW_GATEWAY_PORT`를 재정의하면 같은 계열의 파생 포트도 함께 이동합니다.
- 로컬 `openclaw` 프로필은 `cdpPort`/`cdpUrl`을 자동 할당합니다. 이는 원격 CDP에만 설정하세요. `cdpUrl`이 설정되지 않으면 기본적으로 관리형 로컬 CDP 포트를 사용합니다.
- `remoteCdpTimeoutMs`는 원격 및 `attachOnly` CDP HTTP 도달 가능성 검사와 탭 열기 HTTP 요청에 적용되며, `remoteCdpHandshakeTimeoutMs`는 해당 CDP WebSocket handshake에 적용됩니다.
- `localLaunchTimeoutMs`는 로컬에서 시작된 관리형 Chrome 프로세스가 CDP HTTP 엔드포인트를 노출할 때까지의 예산입니다. `localCdpReadyTimeoutMs`는 프로세스가 검색된 후 CDP websocket 준비를 기다리는 추가 예산입니다. Chromium 시작이 느린 Raspberry Pi, 저사양 VPS, 구형 하드웨어에서는 이 값을 높이세요. 값은 `120000` ms 이하의 양의 정수여야 하며, 잘못된 config 값은 거부됩니다.
- `actionTimeoutMs`는 호출자가 `timeoutMs`를 전달하지 않을 때 browser `act` 요청의 기본 예산입니다. 클라이언트 transport는 긴 대기가 HTTP 경계에서 timeout되지 않고 완료되도록 작은 여유 시간을 추가합니다.
- `tabCleanup`은 primary-agent browser 세션이 연 탭을 위한 best-effort 정리 기능입니다. 서브에이전트, Cron, ACP lifecycle 정리는 세션 종료 시 명시적으로 추적된 탭을 여전히 닫으며, primary 세션은 활성 탭을 재사용 가능하게 유지한 뒤 유휴 또는 초과 추적 탭을 백그라운드에서 닫습니다.

</Accordion>

<Accordion title="SSRF 정책">

- 브라우저 navigation과 open-tab은 navigation 전에 SSRF 가드가 적용되며, 최종 `http(s)` URL에서도 가능하면 다시 검사됩니다.
- strict SSRF 모드에서는 원격 CDP 엔드포인트 검색과 `/json/version` probe(`cdpUrl`)도 검사됩니다.
- Gateway/provider `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, `NO_PROXY` 환경 변수는 OpenClaw 관리형 브라우저를 자동으로 프록시하지 않습니다. 관리형 Chrome은 기본적으로 직접 연결로 시작되므로 provider 프록시 설정이 browser SSRF 검사를 약화시키지 않습니다.
- 관리형 브라우저 자체를 프록시하려면 `browser.extraArgs`를 통해 `--proxy-server=...` 또는 `--proxy-pac-url=...` 같은 명시적 Chrome 프록시 플래그를 전달하세요. strict SSRF 모드는 private-network browser 액세스가 의도적으로 활성화되지 않은 한 명시적 browser 프록시 라우팅을 차단합니다.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`는 기본적으로 꺼져 있습니다. private-network browser 액세스를 의도적으로 신뢰하는 경우에만 활성화하세요.
- `browser.ssrfPolicy.allowPrivateNetwork`는 레거시 별칭으로 계속 지원됩니다.

</Accordion>

<Accordion title="프로필 동작">

- `attachOnly: true`는 로컬 브라우저를 절대 실행하지 않고, 이미 실행 중인 경우에만 연결한다는 뜻입니다.
- `headless`는 전역 또는 로컬 관리형 프로필별로 설정할 수 있습니다. 프로필별 값은 `browser.headless`를 재정의하므로, 하나의 로컬 프로필은 headless로 유지하고 다른 프로필은 보이도록 유지할 수 있습니다.
- `POST /start?headless=true`와 `openclaw browser start --headless`는 `browser.headless` 또는 프로필 config를 다시 쓰지 않고 로컬 관리형 프로필에 대해 일회성 headless 실행을 요청합니다. existing-session, attach-only, 원격 CDP 프로필은 OpenClaw가 해당 브라우저 프로세스를 실행하지 않기 때문에 이 재정의를 거부합니다.
- Linux 호스트에서 `DISPLAY` 또는 `WAYLAND_DISPLAY`가 없으면, 환경 또는 프로필/전역 config가 명시적으로 headed 모드를 선택하지 않은 한 로컬 관리형 프로필은 자동으로 headless가 기본값이 됩니다. `openclaw browser status --json`은 `headlessSource`를 `env`, `profile`, `config`, `request`, `linux-display-fallback`, `default` 중 하나로 보고합니다.
- `OPENCLAW_BROWSER_HEADLESS=1`은 현재 프로세스에 대해 로컬 관리형 실행을 headless로 강제합니다. `OPENCLAW_BROWSER_HEADLESS=0`은 일반 시작에 대해 headed 모드를 강제하고, Linux 호스트에 display server가 없으면 실행 가능한 오류를 반환합니다. 단, 명시적인 `start --headless` 요청은 해당 단일 실행에 대해 여전히 우선합니다.
- `executablePath`는 전역 또는 로컬 관리형 프로필별로 설정할 수 있습니다. 프로필별 값은 `browser.executablePath`를 재정의하므로, 서로 다른 관리형 프로필이 서로 다른 Chromium 기반 브라우저를 실행할 수 있습니다. 두 형태 모두 OS 홈 디렉터리를 위한 `~`를 허용합니다.
- `color`(최상위 및 프로필별)는 브라우저 UI에 색을 입혀 어떤 프로필이 활성 상태인지 구분할 수 있게 합니다.
- 기본 프로필은 `openclaw`(관리형 독립 프로필)입니다. 로그인된 사용자 브라우저를 기본으로 사용하려면 `defaultProfile: "user"`를 설정하세요.
- 자동 감지 순서: 시스템 기본 브라우저가 Chromium 기반이면 그것을 사용하고, 아니면 Chrome → Brave → Edge → Chromium → Chrome Canary 순서입니다.
- `driver: "existing-session"`은 raw CDP 대신 Chrome DevTools MCP를 사용합니다. 이 driver에는 `cdpUrl`을 설정하지 마세요.
- existing-session 프로필이 기본이 아닌 Chromium 사용자 프로필(Brave, Edge 등)에 연결해야 한다면 `browser.profiles.<name>.userDataDir`를 설정하세요. 이 경로도 OS 홈 디렉터리를 위한 `~`를 허용합니다.

</Accordion>

</AccordionGroup>

## Brave(또는 다른 Chromium 기반 브라우저) 사용하기

**시스템 기본** 브라우저가 Chromium 기반(Chrome/Brave/Edge 등)이면,
OpenClaw는 이를 자동으로 사용합니다. 자동 감지를 재정의하려면
`browser.executablePath`를 설정하세요. 최상위 및 프로필별 `executablePath` 값은
OS 홈 디렉터리를 위한 `~`를 허용합니다.

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

또는 플랫폼별로 config에 직접 설정할 수 있습니다.

<Tabs>
  <Tab title="macOS">
```json5
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  },
}
```
  </Tab>
  <Tab title="Windows">
```json5
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  },
}
```
  </Tab>
  <Tab title="Linux">
```json5
{
  browser: {
    executablePath: "/usr/bin/brave-browser",
  },
}
```
  </Tab>
</Tabs>

프로필별 `executablePath`는 OpenClaw가 실행하는 로컬 관리형 프로필에만 영향을 줍니다. `existing-session` 프로필은 이미 실행 중인 브라우저에 연결하고, 원격 CDP 프로필은 `cdpUrl` 뒤의 브라우저를 사용합니다.

## 로컬 vs 원격 제어

- **로컬 제어(기본값):** Gateway가 loopback 제어 서비스를 시작하고 로컬 브라우저를 실행할 수 있습니다.
- **원격 제어(node host):** 브라우저가 있는 머신에서 node host를 실행하면 Gateway가 browser 작업을 해당 노드로 프록시합니다.
- **원격 CDP:** 원격 Chromium 기반 브라우저에 연결하려면 `browser.profiles.<name>.cdpUrl`(또는 `browser.cdpUrl`)을 설정하세요. 이 경우 OpenClaw는 로컬 브라우저를 실행하지 않습니다.
- loopback에서 외부 관리형 CDP 서비스(예: Docker에서 실행되고 `127.0.0.1`에 게시된 Browserless)를 사용할 때도 `attachOnly: true`를 함께 설정하세요. `attachOnly` 없이 loopback CDP를 사용하면 로컬 OpenClaw 관리형 브라우저 프로필로 처리됩니다.
- `headless`는 OpenClaw가 실행하는 로컬 관리형 프로필에만 영향을 줍니다. existing-session 또는 원격 CDP 브라우저를 재시작하거나 변경하지 않습니다.
- `executablePath`도 같은 로컬 관리형 프로필 규칙을 따릅니다. 실행 중인 로컬 관리형 프로필에서 이를 변경하면 해당 프로필은 재시작/reconcile 대상으로 표시되어 다음 실행 시 새 바이너리를 사용합니다.

중지 동작은 프로필 모드에 따라 다릅니다.

- 로컬 관리형 프로필: `openclaw browser stop`은 OpenClaw가 실행한 브라우저 프로세스를 중지합니다
- attach-only 및 원격 CDP 프로필: `openclaw browser stop`은 활성 제어 세션을 닫고 Playwright/CDP 에뮬레이션 재정의(viewport, color scheme, locale, timezone, offline mode 및 유사 상태)를 해제합니다. 이 경우 OpenClaw가 실행한 브라우저 프로세스는 없습니다

원격 CDP URL에는 인증을 포함할 수 있습니다.

- 쿼리 토큰(예: `https://provider.example?token=<token>`)
- HTTP Basic 인증(예: `https://user:pass@provider.example`)

OpenClaw는 `/json/*` 엔드포인트 호출과 CDP WebSocket 연결 시 이 인증을 유지합니다. 토큰은 config 파일에 커밋하는 대신 환경 변수 또는 비밀 정보 관리자를 사용하는 것이 좋습니다.

## Node 브라우저 프록시 (기본 제로 구성)

브라우저가 있는 머신에서 **node host**를 실행하면, OpenClaw는 추가 browser config 없이도 browser 도구 호출을 자동으로 그 노드로 라우팅할 수 있습니다. 이것이 원격 Gateway의 기본 경로입니다.

참고:

- node host는 **프록시 명령**을 통해 자신의 로컬 browser 제어 서버를 노출합니다.
- 프로필은 노드 자체의 `browser.profiles` config에서 가져옵니다(로컬과 동일).
- `nodeHost.browserProxy.allowProfiles`는 선택 사항입니다. 비워 두면 레거시/기본 동작으로, 구성된 모든 프로필이 프록시를 통해 접근 가능하며 프로필 생성/삭제 경로도 포함됩니다.
- `nodeHost.browserProxy.allowProfiles`를 설정하면, OpenClaw는 이를 최소 권한 경계로 취급합니다. allowlist에 있는 프로필만 대상으로 지정할 수 있으며, 영구 프로필 생성/삭제 경로는 프록시 표면에서 차단됩니다.
- 원하지 않으면 비활성화하세요:
  - 노드에서: `nodeHost.browserProxy.enabled=false`
  - gateway에서: `gateway.nodes.browser.mode="off"`

## Browserless (호스팅된 원격 CDP)

[Browserless](https://browserless.io)는 HTTPS와 WebSocket을 통해
CDP 연결 URL을 노출하는 호스팅 Chromium 서비스입니다. OpenClaw는 두 형태를
모두 사용할 수 있지만, 원격 브라우저 프로필의 경우 Browserless 연결 문서에
있는 직접 WebSocket URL이 가장 간단한 옵션입니다.

예시:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    remoteCdpTimeoutMs: 2000,
    remoteCdpHandshakeTimeoutMs: 4000,
    profiles: {
      browserless: {
        cdpUrl: "wss://production-sfo.browserless.io?token=<BROWSERLESS_API_KEY>",
        color: "#00AA00",
      },
    },
  },
}
```

참고:

- `<BROWSERLESS_API_KEY>`를 실제 Browserless 토큰으로 바꾸세요.
- Browserless 계정에 맞는 리전 엔드포인트를 선택하세요(문서 참고).
- Browserless가 HTTPS base URL을 제공하는 경우, 직접 CDP 연결을 위해 `wss://`로 변환하거나 HTTPS URL을 그대로 두고 OpenClaw가 `/json/version`을 검색하도록 할 수 있습니다.

### 같은 호스트의 Browserless Docker

Browserless를 Docker에서 자체 호스팅하고 OpenClaw가 호스트에서 실행된다면,
Browserless를 외부 관리형 CDP 서비스로 취급하세요.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    profiles: {
      browserless: {
        cdpUrl: "ws://127.0.0.1:3000",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

`browser.profiles.browserless.cdpUrl`의 주소는 OpenClaw 프로세스에서
도달 가능해야 합니다. Browserless도 일치하는 도달 가능한 엔드포인트를 광고해야 하므로, Browserless `EXTERNAL`을 OpenClaw에서 접근 가능한 동일한 공개 WebSocket base로 설정하세요. 예: `ws://127.0.0.1:3000`, `ws://browserless:3000`, 또는 안정적인 private Docker 네트워크 주소. `/json/version`이 OpenClaw가 접근할 수 없는 주소를 가리키는 `webSocketDebuggerUrl`을 반환하면, CDP HTTP는 정상처럼 보여도 WebSocket attach는 실패할 수 있습니다.

loopback Browserless 프로필에서는 `attachOnly`를 비워 두지 마세요. `attachOnly`가 없으면 OpenClaw는 loopback 포트를 로컬 관리형 브라우저 프로필로 처리하고, 해당 포트가 사용 중이지만 OpenClaw 소유가 아니라는 식으로 보고할 수 있습니다.

## 직접 WebSocket CDP provider

일부 호스팅 브라우저 서비스는 표준 HTTP 기반 CDP 검색(`/json/version`) 대신 **직접 WebSocket** 엔드포인트를 노출합니다. OpenClaw는 세 가지 CDP URL 형태를 허용하며, 적절한 연결 전략을 자동으로 선택합니다.

- **HTTP(S) 검색** — `http://host[:port]` 또는 `https://host[:port]`.
  OpenClaw는 `/json/version`을 호출해 WebSocket debugger URL을 검색한 뒤 연결합니다. WebSocket 폴백은 없습니다.
- **직접 WebSocket 엔드포인트** — `ws://host[:port]/devtools/<kind>/<id>` 또는
  `/devtools/browser|page|worker|shared_worker|service_worker/<id>` 경로가 있는 `wss://...`.
  OpenClaw는 WebSocket handshake로 직접 연결하며 `/json/version`을 완전히 건너뜁니다.
- **기본 WebSocket 루트** — `/devtools/...` 경로가 없는 `ws://host[:port]` 또는 `wss://host[:port]`
  (예: [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw는 먼저 HTTP
  `/json/version` 검색을 시도하고(스킴을 `http`/`https`로 정규화), 검색 결과에
  `webSocketDebuggerUrl`이 있으면 이를 사용합니다. 없으면 기본 루트에서 직접 WebSocket handshake로 폴백합니다. 광고된 WebSocket 엔드포인트가 CDP handshake를 거부하지만 설정된 기본 루트가 이를 수락하면, OpenClaw는 해당 루트로도 폴백합니다. 이를 통해 로컬 Chrome을 가리키는 기본 `ws://`도 연결할 수 있습니다. Chrome은 `/json/version`에서 얻은 특정 대상 경로에서만 WebSocket upgrade를 수락하는 반면, 호스팅 provider는 검색 엔드포인트가 Playwright CDP에 적합하지 않은 단기 URL을 광고할 때도 기본 WebSocket 엔드포인트를 계속 사용할 수 있습니다.

### Browserbase

[Browserbase](https://www.browserbase.com)는 기본 제공 CAPTCHA 해결, stealth 모드, residential proxy를 갖춘 클라우드 기반 headless 브라우저 플랫폼입니다.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserbase",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      browserbase: {
        cdpUrl: "wss://connect.browserbase.com?apiKey=<BROWSERBASE_API_KEY>",
        color: "#F97316",
      },
    },
  },
}
```

참고:

- [가입](https://www.browserbase.com/sign-up) 후 [Overview dashboard](https://www.browserbase.com/overview)에서 **API Key**를 복사하세요.
- `<BROWSERBASE_API_KEY>`를 실제 Browserbase API 키로 바꾸세요.
- Browserbase는 WebSocket 연결 시 브라우저 세션을 자동 생성하므로 수동 세션 생성 단계가 필요 없습니다.
- 무료 요금제는 동시 세션 1개와 월 1 브라우저 시간을 허용합니다.
  유료 요금제 제한은 [pricing](https://www.browserbase.com/pricing)을 참고하세요.
- 전체 API 참조, SDK 가이드, 통합 예시는 [Browserbase docs](https://docs.browserbase.com)를 참고하세요.

## 보안

핵심 개념:

- 브라우저 제어는 loopback 전용이며, 액세스는 Gateway 인증 또는 node pairing을 통해 이뤄집니다.
- 독립 실행형 loopback browser HTTP API는 **공유 비밀 인증만** 사용합니다.
  gateway token bearer auth, `x-openclaw-password`, 또는 구성된 gateway password를 사용하는 HTTP Basic auth입니다.
- Tailscale Serve identity header와 `gateway.auth.mode: "trusted-proxy"`는
  이 독립 실행형 loopback browser API를 인증하지 않습니다.
- browser 제어가 활성화되어 있고 공유 비밀 인증이 구성되지 않은 경우, OpenClaw는 시작 시 `gateway.auth.token`을 자동 생성하고 이를 config에 저장합니다.
- OpenClaw는 `gateway.auth.mode`가 이미 `password`, `none`, `trusted-proxy`인 경우에는 해당 token을 자동 생성하지 않습니다.
- Gateway와 모든 node host는 private 네트워크(Tailscale)에 두고 공개 노출은 피하세요.
- 원격 CDP URL/토큰은 비밀 정보로 취급하고, config 파일보다 env var 또는 비밀 정보 관리자를 사용하는 것이 좋습니다.

원격 CDP 팁:

- 가능하면 암호화된 엔드포인트(HTTPS 또는 WSS)와 짧은 수명의 토큰을 사용하세요.
- 오래 유지되는 토큰은 config 파일에 직접 포함하지 않는 것이 좋습니다.

## 프로필 (다중 브라우저)

OpenClaw는 여러 개의 이름 있는 프로필(라우팅 config)을 지원합니다. 프로필 유형은 다음과 같습니다.

- **openclaw-managed**: 자체 user data 디렉터리 + CDP 포트를 가진 전용 Chromium 기반 브라우저 인스턴스
- **remote**: 명시적인 CDP URL(다른 곳에서 실행 중인 Chromium 기반 브라우저)
- **existing session**: Chrome DevTools MCP 자동 연결을 통한 기존 Chrome 프로필

기본값:

- `openclaw` 프로필은 없으면 자동 생성됩니다.
- `user` 프로필은 Chrome MCP existing-session attach용으로 기본 제공됩니다.
- `user` 외의 existing-session 프로필은 옵트인 방식이며 `--driver existing-session`으로 생성합니다.
- 로컬 CDP 포트는 기본적으로 **18800–18899** 범위에서 할당됩니다.
- 프로필을 삭제하면 해당 로컬 데이터 디렉터리는 휴지통으로 이동됩니다.

모든 제어 엔드포인트는 `?profile=<name>`을 허용하며, CLI는 `--browser-profile`을 사용합니다.

## Chrome DevTools MCP를 통한 existing session

OpenClaw는 공식 Chrome DevTools MCP 서버를 통해 실행 중인 Chromium 기반 브라우저 프로필에 연결할 수도 있습니다. 이를 통해 해당 브라우저 프로필에 이미 열려 있는 탭과 로그인 상태를 재사용할 수 있습니다.

공식 배경 및 설정 참고 자료:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

기본 제공 프로필:

- `user`

선택 사항: 다른 이름, 색상 또는 브라우저 데이터 디렉터리를 원한다면
사용자 정의 existing-session 프로필을 직접 만들 수 있습니다.

기본 동작:

- 기본 제공 `user` 프로필은 Chrome MCP 자동 연결을 사용하며, 이는
  기본 로컬 Google Chrome 프로필을 대상으로 합니다.

Brave, Edge, Chromium 또는 기본이 아닌 Chrome 프로필에는 `userDataDir`을 사용하세요.
`~`는 OS 홈 디렉터리로 확장됩니다.

```json5
{
  browser: {
    profiles: {
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
    },
  },
}
```

그런 다음 해당 브라우저에서:

1. 원격 디버깅용 브라우저 inspect 페이지를 엽니다.
2. 원격 디버깅을 활성화합니다.
3. 브라우저를 계속 실행한 상태로 두고, OpenClaw가 연결할 때 나타나는 연결 프롬프트를 승인합니다.

일반적인 inspect 페이지:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

라이브 attach 스모크 테스트:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

성공 시 확인되는 것:

- `status`에 `driver: existing-session` 표시
- `status`에 `transport: chrome-mcp` 표시
- `status`에 `running: true` 표시
- `tabs`에 이미 열려 있는 브라우저 탭 목록 표시
- `snapshot`이 선택된 라이브 탭의 ref를 반환

attach가 동작하지 않을 때 확인할 사항:

- 대상 Chromium 기반 브라우저가 `144+` 버전인지
- 해당 브라우저의 inspect 페이지에서 원격 디버깅이 활성화되어 있는지
- 브라우저에 attach 동의 프롬프트가 표시되었고 사용자가 승인했는지
- `openclaw doctor`는 오래된 확장 기반 브라우저 config를 마이그레이션하고 기본 자동 연결 프로필용으로 로컬에 Chrome이 설치되어 있는지 확인하지만, 브라우저 측 원격 디버깅을 대신 활성화해 주지는 않습니다

에이전트 사용:

- 사용자의 로그인된 브라우저 상태가 필요할 때는 `profile="user"`를 사용하세요.
- 사용자 정의 existing-session 프로필을 사용한다면 해당 프로필 이름을 명시적으로 전달하세요.
- 이 모드는 사용자가 컴퓨터 앞에 있어 attach 프롬프트를 승인할 수 있을 때만 선택하세요.
- Gateway 또는 node host는 `npx chrome-devtools-mcp@latest --autoConnect`를 실행할 수 있습니다

참고:

- 이 경로는 로그인된 브라우저 세션 내부에서 동작할 수 있기 때문에 격리된 `openclaw` 프로필보다 위험도가 더 높습니다.
- OpenClaw는 이 driver에 대해 브라우저를 실행하지 않고 연결만 합니다.
- OpenClaw는 여기서 공식 Chrome DevTools MCP `--autoConnect` 흐름을 사용합니다. `userDataDir`이 설정되어 있으면 해당 사용자 데이터 디렉터리를 대상으로 하도록 전달됩니다.
- existing-session은 선택된 호스트에서 직접 연결되거나 연결된 browser node를 통해 연결될 수 있습니다. Chrome이 다른 곳에 있고 browser node도 연결되지 않았다면, 대신 원격 CDP 또는 node host를 사용하세요.

### 사용자 정의 Chrome MCP 실행

기본 `npx chrome-devtools-mcp@latest` 흐름이 적합하지 않은 경우(오프라인 호스트, 고정 버전, 벤더링된 바이너리), 프로필별로 실행되는 Chrome DevTools MCP 서버를 재정의하세요.

| 필드         | 역할                                                                                                              |
| ------------ | ----------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | `npx` 대신 실행할 실행 파일입니다. 그대로 해석되며 절대 경로도 허용됩니다.                                       |
| `mcpArgs`    | `mcpCommand`에 그대로 전달되는 인수 배열입니다. 기본 `chrome-devtools-mcp@latest --autoConnect` 인수를 대체합니다. |

existing-session 프로필에 `cdpUrl`이 설정되면 OpenClaw는
`--autoConnect`를 건너뛰고 엔드포인트를 Chrome MCP에 자동 전달합니다.

- `http(s)://...` → `--browserUrl <url>` (DevTools HTTP 검색 엔드포인트)
- `ws(s)://...` → `--wsEndpoint <url>` (직접 CDP WebSocket)

엔드포인트 플래그와 `userDataDir`은 함께 사용할 수 없습니다. `cdpUrl`이 설정되면,
Chrome MCP 실행에서 `userDataDir`은 무시됩니다. Chrome MCP는 프로필 디렉터리를
여는 대신 해당 엔드포인트 뒤의 실행 중인 브라우저에 연결하기 때문입니다.

<Accordion title="Existing-session 기능 제한 사항">

관리형 `openclaw` 프로필과 비교하면 existing-session driver는 제약이 더 많습니다.

- **스크린샷** — 페이지 캡처와 `--ref` 요소 캡처는 동작하지만 CSS `--element` 선택자는 동작하지 않습니다. `--full-page`는 `--ref` 또는 `--element`와 함께 사용할 수 없습니다. 페이지 또는 ref 기반 요소 스크린샷에는 Playwright가 필요하지 않습니다.
- **작업** — `click`, `type`, `hover`, `scrollIntoView`, `drag`, `select`는 snapshot ref가 필요합니다(CSS selector 불가). `click-coords`는 보이는 viewport 좌표를 클릭하며 snapshot ref가 필요하지 않습니다. `click`은 왼쪽 버튼만 지원합니다. `type`은 `slowly=true`를 지원하지 않으므로 `fill` 또는 `press`를 사용하세요. `press`는 `delayMs`를 지원하지 않습니다. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill`, `evaluate`는 호출별 timeout을 지원하지 않습니다. `select`는 단일 값만 허용합니다.
- **대기 / 업로드 / dialog** — `wait --url`은 정확 일치, 부분 문자열, glob 패턴을 지원합니다. `wait --load networkidle`은 지원되지 않습니다. 업로드 hook은 `ref` 또는 `inputRef`가 필요하며 한 번에 파일 하나만 가능하고 CSS `element`는 지원하지 않습니다. dialog hook은 timeout 재정의를 지원하지 않습니다.
- **관리형 전용 기능** — batch 작업, PDF export, 다운로드 가로채기, `responsebody`는 여전히 관리형 브라우저 경로가 필요합니다.

</Accordion>

## 격리 보장

- **전용 user data dir**: 개인 브라우저 프로필을 절대 건드리지 않습니다.
- **전용 포트**: 개발 워크플로와의 충돌을 피하기 위해 `9222`를 사용하지 않습니다.
- **결정적인 탭 제어**: `tabs`는 먼저 `suggestedTargetId`, 그다음 안정적인 `tabId` 핸들(`t1` 등), 선택적 레이블, 마지막으로 raw `targetId`를 반환합니다.
  에이전트는 `suggestedTargetId`를 재사용해야 하며, raw ID는 디버깅과 호환성을 위해 계속 제공됩니다.

## 브라우저 선택

로컬에서 실행할 때 OpenClaw는 사용 가능한 브라우저 중 첫 번째를 선택합니다.

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

`browser.executablePath`로 이를 재정의할 수 있습니다.

플랫폼별:

- macOS: `/Applications`와 `~/Applications` 확인
- Linux: `/usr/bin`, `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium`, `/usr/lib/chromium-browser` 아래의 일반적인 Chrome/Brave/Edge/Chromium 경로 확인
- Windows: 일반적인 설치 위치 확인

## 제어 API (선택 사항)

스크립팅과 디버깅을 위해 Gateway는 작은 **loopback 전용 HTTP
제어 API**와 이에 대응하는 `openclaw browser` CLI(snapshot, ref, wait
강화 기능, JSON 출력, 디버그 워크플로)를 제공합니다. 전체 참조는
[Browser control API](/ko/tools/browser-control)를 참고하세요.

## 문제 해결

Linux 전용 문제(특히 snap Chromium)는
[Browser troubleshooting](/ko/tools/browser-linux-troubleshooting)을 참고하세요.

WSL2 Gateway + Windows Chrome 분리 호스트 구성은
[WSL2 + Windows + remote Chrome CDP troubleshooting](/ko/tools/browser-wsl2-windows-remote-cdp-troubleshooting)을 참고하세요.

### CDP 시작 실패 vs navigation SSRF 차단

이 둘은 서로 다른 실패 유형이며, 각기 다른 코드 경로를 가리킵니다.

- **CDP 시작 또는 준비 실패**는 OpenClaw가 브라우저 제어 평면이 정상인지 확인할 수 없음을 의미합니다.
- **Navigation SSRF 차단**은 브라우저 제어 평면은 정상인데 페이지 navigation 대상이 정책에 의해 거부되었음을 의미합니다.

일반적인 예:

- CDP 시작 또는 준비 실패:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - loopback 외부 CDP 서비스가 `attachOnly: true` 없이 구성된 경우의
    `Port <port> is in use for profile "<name>" but not by openclaw`
- Navigation SSRF 차단:
  - `start`와 `tabs`는 동작하지만 `open`, `navigate`, snapshot 또는 탭 열기 흐름이 browser/network 정책 오류와 함께 실패

이 둘을 구분하려면 다음 최소 시퀀스를 사용하세요.

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

결과 해석:

- `start`가 `not reachable after start`로 실패하면 먼저 CDP 준비 상태를 해결하세요.
- `start`는 성공했지만 `tabs`가 실패하면 제어 평면이 여전히 정상하지 않습니다. 페이지 navigation 문제가 아니라 CDP 도달 가능성 문제로 처리하세요.
- `start`와 `tabs`는 성공했지만 `open` 또는 `navigate`가 실패하면 브라우저 제어 평면은 정상이고 실패 원인은 navigation 정책 또는 대상 페이지입니다.
- `start`, `tabs`, `open`이 모두 성공하면 기본 관리형 브라우저 제어 경로는 정상입니다.

중요한 동작 세부 사항:

- `browser.ssrfPolicy`를 구성하지 않아도 브라우저 config는 기본적으로 fail-closed SSRF 정책 객체를 사용합니다.
- 로컬 loopback `openclaw` 관리형 프로필의 경우, CDP 상태 검사는 OpenClaw 자체 로컬 제어 평면에 대해서는 의도적으로 browser SSRF 도달 가능성 강제를 건너뜁니다.
- Navigation 보호는 별개입니다. `start` 또는 `tabs`가 성공했다고 해서 이후 `open` 또는 `navigate` 대상이 허용된다는 뜻은 아닙니다.

보안 지침:

- 기본적으로 browser SSRF 정책을 완화하지 마세요.
- 넓은 private-network 접근보다 `hostnameAllowlist` 또는 `allowedHostnames` 같은 좁은 호스트 예외를 선호하세요.
- `dangerouslyAllowPrivateNetwork: true`는 private-network browser 접근이 필요하고 검토된 의도적 신뢰 환경에서만 사용하세요.

## 에이전트 도구 + 제어 방식

에이전트는 브라우저 자동화를 위한 **하나의 도구**를 받습니다.

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

매핑 방식:

- `browser snapshot`은 안정적인 UI 트리(AI 또는 ARIA)를 반환합니다.
- `browser act`는 snapshot의 `ref` ID를 사용해 click/type/drag/select를 수행합니다.
- `browser screenshot`은 픽셀을 캡처합니다(전체 페이지, 요소 또는 레이블된 ref).
- `browser doctor`는 Gateway, Plugin, 프로필, 브라우저, 탭 준비 상태를 확인합니다.
- `browser`는 다음을 허용합니다:
  - `profile`로 이름 있는 브라우저 프로필 선택(openclaw, chrome, 또는 원격 CDP)
  - `target`(`sandbox` | `host` | `node`)으로 브라우저가 위치한 곳 선택
  - sandboxed 세션에서 `target: "host"`를 사용하려면 `agents.defaults.sandbox.browser.allowHostControl=true`가 필요
  - `target`이 생략되면 sandboxed 세션은 기본적으로 `sandbox`, 비-sandbox 세션은 기본적으로 `host`
  - browser-capable node가 연결되어 있으면 `target="host"` 또는 `target="node"`를 고정하지 않는 한 도구가 자동으로 그 노드로 라우팅될 수 있음

이렇게 하면 에이전트가 결정적으로 동작하며 깨지기 쉬운 selector를 피할 수 있습니다.

## 관련 항목

- [Tools Overview](/ko/tools) — 사용 가능한 모든 에이전트 도구
- [Sandboxing](/ko/gateway/sandboxing) — sandboxed 환경에서의 브라우저 제어
- [Security](/ko/gateway/security) — 브라우저 제어의 위험 및 강화
