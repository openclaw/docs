---
read_when:
    - 에이전트가 제어하는 브라우저 자동화 추가하기
    - openclaw가 자신의 Chrome에 간섭하는 이유 디버깅하기
    - macOS 앱에서 브라우저 설정 + lifecycle 구현하기
summary: 통합 브라우저 제어 서비스 + action 명령
title: 브라우저(OpenClaw 관리형)
x-i18n:
    generated_at: "2026-04-25T06:11:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: e150084059ae485cfb83ef70fd9d5d3ca46c5bd42431df3667857192009ec14c
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw는 에이전트가 제어하는 **전용 Chrome/Brave/Edge/Chromium 프로필**을 실행할 수 있습니다.
이 프로필은 개인 브라우저와 분리되어 있으며, Gateway 내부의 작은 로컬
제어 서비스(loopback 전용)를 통해 관리됩니다.

초보자 관점:

- 이것을 **별도의 에이전트 전용 브라우저**라고 생각하면 됩니다.
- `openclaw` 프로필은 개인 브라우저 프로필을 **건드리지 않습니다**.
- 에이전트는 안전한 영역에서 **탭 열기, 페이지 읽기, 클릭, 타이핑**을 할 수 있습니다.
- 내장 `user` 프로필은 Chrome MCP를 통해 실제 로그인된 Chrome 세션에 연결합니다.

## 제공 기능

- **openclaw**라는 이름의 별도 브라우저 프로필(기본적으로 주황색 강조)
- 결정적인 탭 제어(list/open/focus/close)
- 에이전트 작업(click/type/drag/select), 스냅샷, 스크린샷, PDF
- 브라우저 plugin이 활성화되어 있을 때 에이전트에게 snapshot,
  stable-tab, stale-ref, manual-blocker 복구 루프를 가르치는 번들 `browser-automation` skill
- 선택적 다중 프로필 지원(`openclaw`, `work`, `remote`, ...)

이 브라우저는 **일상적인 기본 브라우저가 아닙니다**. 이것은
에이전트 자동화와 검증을 위한 안전하고 격리된 표면입니다.

## 빠른 시작

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

“Browser disabled”가 표시되면, config에서 이를 활성화하고(아래 참고) Gateway를
재시작하세요.

`openclaw browser` 자체가 아예 없거나, 에이전트가 브라우저 도구를
사용할 수 없다고 말하면 [Missing browser command or tool](/ko/tools/browser#missing-browser-command-or-tool)로 이동하세요.

## Plugin 제어

기본 `browser` 도구는 번들 Plugin입니다. 같은 `browser` 도구 이름을 등록하는 다른 plugin으로 대체하려면 이를 비활성화하세요:

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

기본값이 동작하려면 `plugins.entries.browser.enabled` **그리고** `browser.enabled=true`가 모두 필요합니다. plugin만 비활성화하면 `openclaw browser` CLI, `browser.request` gateway 메서드, 에이전트 도구, 제어 서비스가 하나의 단위로 제거됩니다. `browser.*` config는 대체 구현을 위해 그대로 유지됩니다.

브라우저 config 변경에는 Plugin이 서비스를 다시 등록할 수 있도록 Gateway 재시작이 필요합니다.

## 에이전트 가이드

브라우저 plugin은 두 단계의 에이전트 가이드를 제공합니다:

- `browser` 도구 설명은 항상 켜져 있는 간단한 계약을 담습니다: 올바른
  프로필 선택, 같은 탭에서 ref 유지, 탭 대상 지정에 `tabId`/레이블 사용, 다단계 작업에는 브라우저 skill 로드.
- 번들 `browser-automation` skill은 더 긴 운영 루프를 담습니다:
  먼저 status/tabs 확인, 작업 탭에 레이블 지정, 작업 전에 snapshot 수행, UI 변경 후 다시 snapshot, stale ref는 한 번 복구, 로그인/2FA/captcha 또는 카메라/마이크 blocker는 추측하지 말고 수동 작업으로 보고.

Plugin 번들 Skills은 plugin이 활성화되면 에이전트의 사용 가능한 Skills 목록에 표시됩니다. 전체 skill 지침은 필요할 때만 로드되므로, 일반적인 턴에서는 전체 토큰 비용을 지불하지 않습니다.

## 브라우저 명령 또는 도구가 없음

업그레이드 후 `openclaw browser`를 알 수 없거나, `browser.request`가 없거나, 에이전트가 브라우저 도구를 사용할 수 없다고 보고하면, 보통 원인은 `plugins.allow` 목록에 `browser`가 빠져 있기 때문입니다. 다음처럼 추가하세요:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true`, `tools.alsoAllow: ["browser"]`는 allowlist 멤버십을 대체하지 않습니다 — allowlist는 plugin 로딩을 제어하고, 도구 정책은 로드 후에만 실행됩니다. `plugins.allow` 자체를 완전히 제거해도 기본 동작이 복구됩니다.

## 프로필: `openclaw` vs `user`

- `openclaw`: 관리형, 격리된 브라우저(extension 필요 없음)
- `user`: **실제 로그인된 Chrome**
  세션을 위한 내장 Chrome MCP 연결 프로필

에이전트 브라우저 도구 호출 시:

- 기본값: 격리된 `openclaw` 브라우저 사용
- 기존 로그인 세션이 중요하고 사용자가
  컴퓨터 앞에서 attach 프롬프트를 클릭/승인할 수 있을 때는 `profile="user"`를 우선
- 특정 브라우저 모드를 원할 때 `profile`이 명시적 override가 됩니다

기본적으로 관리형 모드를 사용하려면 `browser.defaultProfile: "openclaw"`를 설정하세요.

## 구성

브라우저 설정은 `~/.openclaw/openclaw.json`에 있습니다.

```json5
{
  browser: {
    enabled: true, // 기본값: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // 신뢰된 private-network 액세스에만 opt in
      // allowPrivateNetwork: true, // 레거시 별칭
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // 레거시 단일 프로필 override
    remoteCdpTimeoutMs: 1500, // 원격 CDP HTTP 타임아웃 (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // 원격 CDP WebSocket 핸드셰이크 타임아웃 (ms)
    tabCleanup: {
      enabled: true, // 기본값: true
      idleMinutes: 120, // 유휴 정리를 비활성화하려면 0 설정
      maxTabsPerSession: 8, // 세션별 상한을 비활성화하려면 0 설정
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

- 제어 서비스는 `gateway.port`에서 파생된 포트(loopback)에 바인딩됩니다(기본값 `18791` = gateway + 2). `gateway.port` 또는 `OPENCLAW_GATEWAY_PORT`를 override하면 파생 포트도 같은 계열에서 함께 이동합니다.
- 로컬 `openclaw` 프로필은 `cdpPort`/`cdpUrl`을 자동 할당합니다. 이 값은 원격 CDP에만 설정하세요. `cdpUrl`이 설정되지 않으면 관리형 로컬 CDP 포트를 기본값으로 사용합니다.
- `remoteCdpTimeoutMs`는 원격(non-loopback) CDP HTTP 도달 가능성 검사에 적용되고, `remoteCdpHandshakeTimeoutMs`는 원격 CDP WebSocket 핸드셰이크에 적용됩니다.
- `tabCleanup`은 기본 에이전트 브라우저 세션이 연 탭에 대한 best-effort 정리입니다. 하위 에이전트, Cron, ACP lifecycle 정리는 세션 종료 시 자신이 명시적으로 추적한 탭을 계속 닫습니다. 기본 세션은 활성 탭을 재사용 가능하게 유지한 뒤, 유휴 상태이거나 초과된 추적 탭을 백그라운드에서 닫습니다.

</Accordion>

<Accordion title="SSRF 정책">

- 브라우저 탐색과 open-tab은 탐색 전에 SSRF 보호를 받고, 이후 최종 `http(s)` URL에 대해서도 best-effort 방식으로 다시 검사됩니다.
- 엄격한 SSRF 모드에서는 원격 CDP 엔드포인트 discovery와 `/json/version` probe (`cdpUrl`)도 검사됩니다.
- Gateway/provider `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, `NO_PROXY` 환경 변수는 OpenClaw 관리형 브라우저를 자동으로 프록시하지 않습니다. 관리형 Chrome은 기본적으로 직접 실행되므로 provider 프록시 설정이 브라우저 SSRF 검사를 약화시키지 않습니다.
- 관리형 브라우저 자체를 프록시하려면 `browser.extraArgs`를 통해 `--proxy-server=...` 또는 `--proxy-pac-url=...` 같은 명시적 Chrome 프록시 플래그를 전달하세요. 엄격한 SSRF 모드는 private-network 브라우저 액세스를 의도적으로 활성화하지 않은 한 명시적 브라우저 프록시 라우팅을 차단합니다.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`는 기본적으로 꺼져 있습니다. private-network 브라우저 액세스를 의도적으로 신뢰할 때만 활성화하세요.
- `browser.ssrfPolicy.allowPrivateNetwork`는 레거시 별칭으로 계속 지원됩니다.

</Accordion>

<Accordion title="프로필 동작">

- `attachOnly: true`는 로컬 브라우저를 절대 실행하지 않고, 이미 실행 중일 때만 연결함을 의미합니다.
- `headless`는 전역 또는 로컬 관리형 프로필별로 설정할 수 있습니다. 프로필별 값은 `browser.headless`를 override하므로, 하나의 로컬 실행 프로필은 headless로 유지하고 다른 하나는 표시 상태로 둘 수 있습니다.
- `executablePath`는 전역 또는 로컬 관리형 프로필별로 설정할 수 있습니다. 프로필별 값은 `browser.executablePath`를 override하므로, 서로 다른 관리형 프로필이 서로 다른 Chromium 기반 브라우저를 실행할 수 있습니다.
- `color`(최상위 및 프로필별)는 브라우저 UI에 색조를 입혀 어떤 프로필이 활성 상태인지 볼 수 있게 합니다.
- 기본 프로필은 `openclaw`입니다(관리형 독립 브라우저). 로그인된 사용자 브라우저를 사용하려면 `defaultProfile: "user"`를 사용하세요.
- 자동 감지 순서: 시스템 기본 브라우저가 Chromium 기반이면 그것을 사용하고, 아니면 Chrome → Brave → Edge → Chromium → Chrome Canary 순입니다.
- `driver: "existing-session"`은 원시 CDP 대신 Chrome DevTools MCP를 사용합니다. 이 driver에는 `cdpUrl`을 설정하지 마세요.
- 기존 세션 프로필이 기본이 아닌 Chromium 사용자 프로필(Brave, Edge 등)에 연결해야 한다면 `browser.profiles.<name>.userDataDir`을 설정하세요.

</Accordion>

</AccordionGroup>

## Brave(또는 다른 Chromium 기반 브라우저) 사용

**시스템 기본** 브라우저가 Chromium 기반(Chrome/Brave/Edge 등)이면,
OpenClaw는 이를 자동으로 사용합니다. 자동 감지를 override하려면 `browser.executablePath`를 설정하세요. `~`는 OS 홈 디렉터리로 확장됩니다:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

또는 플랫폼별 config에 설정하세요:

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

프로필별 `executablePath`는 OpenClaw가 실행하는 로컬 관리형 프로필에만 영향을 줍니다. `existing-session` 프로필은 대신 이미 실행 중인 브라우저에 연결하고, 원격 CDP 프로필은 `cdpUrl` 뒤의 브라우저를 사용합니다.

## 로컬 vs 원격 제어

- **로컬 제어(기본값):** Gateway가 loopback 제어 서비스를 시작하고 로컬 브라우저를 실행할 수 있습니다.
- **원격 제어(node host):** 브라우저가 있는 머신에서 node host를 실행하면, Gateway가 브라우저 작업을 그쪽으로 프록시합니다.
- **원격 CDP:** `browser.profiles.<name>.cdpUrl`(또는 `browser.cdpUrl`)을 설정해
  원격 Chromium 기반 브라우저에 연결합니다. 이 경우 OpenClaw는 로컬 브라우저를 실행하지 않습니다.
- `headless`는 OpenClaw가 실행하는 로컬 관리형 프로필에만 영향을 줍니다. 기존 세션 또는 원격 CDP 브라우저를 재시작하거나 변경하지는 않습니다.
- `executablePath`도 같은 로컬 관리형 프로필 규칙을 따릅니다. 실행 중인 로컬 관리형 프로필에서 이를 변경하면 해당 프로필은 재시작/재조정 대상으로 표시되어 다음 실행 시 새 바이너리를 사용합니다.

중지 동작은 프로필 모드에 따라 다릅니다:

- 로컬 관리형 프로필: `openclaw browser stop`은
  OpenClaw가 실행한 브라우저 프로세스를 중지합니다
- attach-only 및 원격 CDP 프로필: `openclaw browser stop`은 활성
  제어 세션을 닫고 Playwright/CDP 에뮬레이션 override(viewport,
  color scheme, locale, timezone, offline mode 및 유사 상태)를 해제합니다.
  비록 OpenClaw가 브라우저 프로세스를 직접 실행하지 않았더라도 그렇습니다

원격 CDP URL에는 auth를 포함할 수 있습니다:

- 쿼리 토큰 (예: `https://provider.example?token=<token>`)
- HTTP Basic auth (예: `https://user:pass@provider.example`)

OpenClaw는 `/json/*` 엔드포인트 호출과
CDP WebSocket 연결 시 auth를 유지합니다. 토큰을 config 파일에 커밋하는 대신
환경 변수나 secrets manager를 사용하는 것이 좋습니다.

## Node 브라우저 프록시(무설정 기본값)

브라우저가 있는 머신에서 **node host**를 실행하면, OpenClaw는 추가 브라우저 config 없이도
브라우저 도구 호출을 해당 node로 자동 라우팅할 수 있습니다.
이것이 원격 gateway의 기본 경로입니다.

참고:

- node host는 로컬 브라우저 제어 서버를 **프록시 명령**으로 노출합니다.
- 프로필은 node 자체의 `browser.profiles` config에서 가져옵니다(로컬과 동일).
- `nodeHost.browserProxy.allowProfiles`는 선택 사항입니다. 비워 두면 레거시/기본 동작이 유지됩니다. 즉, profile 생성/삭제 라우트를 포함해 구성된 모든 프로필이 프록시를 통해 도달 가능합니다.
- `nodeHost.browserProxy.allowProfiles`를 설정하면, OpenClaw는 이를 최소 권한 경계로 취급합니다. allowlist에 있는 프로필만 대상으로 지정할 수 있고, 영구 프로필 생성/삭제 라우트는 프록시 표면에서 차단됩니다.
- 원하지 않으면 비활성화하세요:
  - node에서: `nodeHost.browserProxy.enabled=false`
  - gateway에서: `gateway.nodes.browser.mode="off"`

## Browserless (호스팅된 원격 CDP)

[Browserless](https://browserless.io)는
HTTPS와 WebSocket을 통해 CDP 연결 URL을 노출하는 호스팅 Chromium 서비스입니다. OpenClaw는 두 형식 모두 사용할 수 있지만,
원격 브라우저 프로필에는 Browserless 연결 문서의 직접 WebSocket URL이 가장 간단한 옵션입니다.

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
- Browserless가 HTTPS 기본 URL을 제공하면,
  직접 CDP 연결용으로 `wss://`로 변환하거나, HTTPS URL을 그대로 두고 OpenClaw가
  `/json/version`을 확인하도록 둘 수 있습니다.

## 직접 WebSocket CDP provider

일부 호스팅 브라우저 서비스는
표준 HTTP 기반 CDP discovery (`/json/version`) 대신 **직접 WebSocket** 엔드포인트를 노출합니다. OpenClaw는 세 가지
CDP URL 형식을 허용하며, 자동으로 올바른 연결 전략을 선택합니다:

- **HTTP(S) discovery** — `http://host[:port]` 또는 `https://host[:port]`.
  OpenClaw는 `/json/version`을 호출해 WebSocket 디버거 URL을 찾은 뒤
  연결합니다. WebSocket 폴백은 없습니다.
- **직접 WebSocket 엔드포인트** — `ws://host[:port]/devtools/<kind>/<id>` 또는
  `/devtools/browser|page|worker|shared_worker|service_worker/<id>`
  경로가 있는 `wss://...`.
  OpenClaw는 WebSocket 핸드셰이크로 직접 연결하며
  `/json/version`을 완전히 건너뜁니다.
- **기본 WebSocket 루트** — `ws://host[:port]` 또는 `/devtools/...`
  경로가 없는 `wss://host[:port]` (예: [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw는 먼저 HTTP
  `/json/version` discovery를 시도하고(`http`/`https` 스킴으로 정규화);
  discovery가 `webSocketDebuggerUrl`을 반환하면 그것을 사용하고, 그렇지 않으면 OpenClaw는
  기본 루트에서 직접 WebSocket 핸드셰이크로 폴백합니다. 이렇게 하면 로컬 Chrome을 가리키는 기본 `ws://`도 연결할 수 있습니다. Chrome은
  `/json/version`에서 반환되는 특정 대상별 경로에서만 WebSocket 업그레이드를 허용하기 때문입니다.

### Browserbase

[Browserbase](https://www.browserbase.com)는
내장 CAPTCHA 해결, stealth 모드, residential
proxy를 갖춘 headless 브라우저 실행용 클라우드 플랫폼입니다.

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

- [가입](https://www.browserbase.com/sign-up)한 뒤 [Overview dashboard](https://www.browserbase.com/overview)에서 **API Key**를 복사하세요.
- `<BROWSERBASE_API_KEY>`를 실제 Browserbase API 키로 바꾸세요.
- Browserbase는 WebSocket 연결 시 브라우저 세션을 자동 생성하므로
  수동 세션 생성 단계가 필요하지 않습니다.
- 무료 요금제는 동시 세션 1개와 월 1 브라우저 시간을 허용합니다.
  유료 요금제 제한은 [pricing](https://www.browserbase.com/pricing)을 참고하세요.
- 전체 API
  참조, SDK 가이드, 통합 예시는 [Browserbase docs](https://docs.browserbase.com)를 참고하세요.

## 보안

핵심 개념:

- 브라우저 제어는 loopback 전용이며, 액세스는 Gateway auth 또는 node 페어링을 통해 흐릅니다.
- 독립형 loopback 브라우저 HTTP API는 **공유 secret auth만** 사용합니다:
  gateway token bearer auth, `x-openclaw-password`, 또는
  구성된 gateway password를 사용하는 HTTP Basic auth.
- Tailscale Serve identity 헤더와 `gateway.auth.mode: "trusted-proxy"`는
  이 독립형 loopback 브라우저 API를 인증하지 **않습니다**.
- 브라우저 제어가 활성화되어 있는데 공유 secret auth가 구성되지 않으면, OpenClaw는
  시작 시 `gateway.auth.token`을 자동 생성하고 config에 저장합니다.
- `gateway.auth.mode`가 이미
  `password`, `none`, `trusted-proxy`인 경우에는 OpenClaw가 그 token을 자동 생성하지 않습니다.
- Gateway와 모든 node host는 사설 네트워크(Tailscale)에 두고, 공개 노출은 피하세요.
- 원격 CDP URL/토큰은 secret으로 취급하세요. env var나 secrets manager를 우선 사용하세요.

원격 CDP 팁:

- 가능하면 암호화된 엔드포인트(HTTPS 또는 WSS)와 수명이 짧은 토큰을 우선 사용하세요.
- 오래 유지되는 토큰을 config 파일에 직접 넣는 것은 피하세요.

## 프로필(다중 브라우저)

OpenClaw는 여러 개의 이름 있는 프로필(라우팅 config)을 지원합니다. 프로필은 다음 중 하나일 수 있습니다:

- **OpenClaw 관리형**: 자체 user data 디렉터리 + CDP 포트를 가진 전용 Chromium 기반 브라우저 인스턴스
- **원격**: 명시적 CDP URL(다른 곳에서 실행 중인 Chromium 기반 브라우저)
- **기존 세션**: Chrome DevTools MCP 자동 연결을 통한 기존 Chrome 프로필

기본값:

- `openclaw` 프로필은 없으면 자동 생성됩니다.
- `user` 프로필은 Chrome MCP existing-session attach용으로 내장되어 있습니다.
- `user` 외의 existing-session 프로필은 opt-in입니다. `--driver existing-session`으로 생성하세요.
- 로컬 CDP 포트는 기본적으로 **18800–18899** 범위에서 할당됩니다.
- 프로필 삭제 시 로컬 데이터 디렉터리는 휴지통으로 이동합니다.

모든 제어 엔드포인트는 `?profile=<name>`을 허용하며, CLI는 `--browser-profile`을 사용합니다.

## Chrome DevTools MCP를 통한 기존 세션

OpenClaw는 공식 Chrome DevTools MCP 서버를 통해 실행 중인 Chromium 기반 브라우저 프로필에 연결할 수도 있습니다. 이렇게 하면 해당 브라우저 프로필에 이미 열려 있는 탭과 로그인 상태를 재사용할 수 있습니다.

공식 배경 및 설정 참조:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

내장 프로필:

- `user`

선택 사항: 다른 이름, 색상 또는 브라우저 데이터 디렉터리를 원한다면
자체 사용자 지정 existing-session 프로필을 만들 수 있습니다.

기본 동작:

- 내장 `user` 프로필은 Chrome MCP auto-connect를 사용하며, 이는
  기본 로컬 Google Chrome 프로필을 대상으로 합니다.

Brave, Edge, Chromium 또는 기본이 아닌 Chrome 프로필에는 `userDataDir`을 사용하세요:

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

1. 원격 디버깅용 inspect 페이지를 엽니다.
2. 원격 디버깅을 활성화합니다.
3. 브라우저를 계속 실행한 상태로 두고 OpenClaw가 연결할 때 연결 프롬프트를 승인합니다.

일반적인 inspect 페이지:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

라이브 연결 스모크 테스트:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

성공 시 모습:

- `status`에 `driver: existing-session` 표시
- `status`에 `transport: chrome-mcp` 표시
- `status`에 `running: true` 표시
- `tabs`에 이미 열려 있는 브라우저 탭이 나열됨
- `snapshot`이 선택된 라이브 탭의 ref를 반환함

연결이 동작하지 않을 때 확인할 사항:

- 대상 Chromium 기반 브라우저 버전이 `144+`인지
- 해당 브라우저의 inspect 페이지에서 원격 디버깅이 활성화되었는지
- 브라우저가 연결 동의 프롬프트를 표시했고 이를 승인했는지
- `openclaw doctor`는 오래된 extension 기반 브라우저 config를 마이그레이션하고,
  기본 auto-connect 프로필용으로 Chrome이 로컬에 설치되었는지 확인하지만,
  브라우저 측 원격 디버깅을 대신 활성화해 주지는 않습니다

에이전트 사용:

- 사용자의 로그인된 브라우저 상태가 필요할 때 `profile="user"`를 사용하세요.
- 사용자 지정 existing-session 프로필을 사용한다면 그 명시적 프로필 이름을 전달하세요.
- 사용자가 컴퓨터 앞에서 연결
  프롬프트를 승인할 수 있을 때만 이 모드를 선택하세요.
- Gateway 또는 node host는 `npx chrome-devtools-mcp@latest --autoConnect`를 실행할 수 있습니다

참고:

- 이 경로는 실제 로그인된 브라우저 세션 내부에서
  동작할 수 있으므로 격리된 `openclaw` 프로필보다 위험도가 더 높습니다.
- 이 driver에서는 OpenClaw가 브라우저를 실행하지 않고 연결만 합니다.
- OpenClaw는 여기서 공식 Chrome DevTools MCP `--autoConnect` 흐름을 사용합니다.
  `userDataDir`이 설정되면 해당 사용자 데이터 디렉터리를 대상으로 전달됩니다.
- existing-session은 선택한 호스트 또는 연결된
  브라우저 Node를 통해 연결할 수 있습니다. Chrome이 다른 곳에 있고 브라우저 Node가 연결되지 않았다면,
  대신 원격 CDP나 node host를 사용하세요.

<Accordion title="existing-session 기능 제한">

관리형 `openclaw` 프로필과 비교하면 existing-session driver는 더 많은 제약이 있습니다:

- **스크린샷** — 페이지 캡처와 `--ref` 요소 캡처는 동작하지만, CSS `--element` 선택자는 동작하지 않습니다. `--full-page`는 `--ref` 또는 `--element`와 함께 사용할 수 없습니다. 페이지 또는 ref 기반 요소 스크린샷에는 Playwright가 필요하지 않습니다.
- **동작** — `click`, `type`, `hover`, `scrollIntoView`, `drag`, `select`는 snapshot ref가 필요합니다(CSS 선택자 불가). `click`은 왼쪽 버튼만 지원합니다. `type`은 `slowly=true`를 지원하지 않으므로 `fill` 또는 `press`를 사용하세요. `press`는 `delayMs`를 지원하지 않습니다. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill`, `evaluate`는 호출별 타임아웃을 지원하지 않습니다. `select`는 단일 값만 허용합니다.
- **대기 / 업로드 / 대화상자** — `wait --url`은 exact, substring, glob 패턴을 지원합니다. `wait --load networkidle`은 지원되지 않습니다. 업로드 hook은 CSS `element`가 아니라 `ref` 또는 `inputRef`가 필요하며, 한 번에 파일 하나만 지원합니다. 대화상자 hook은 타임아웃 override를 지원하지 않습니다.
- **관리형 전용 기능** — batch action, PDF 내보내기, 다운로드 가로채기, `responsebody`는 여전히 관리형 브라우저 경로가 필요합니다.

</Accordion>

## 격리 보장

- **전용 user data dir**: 개인 브라우저 프로필을 절대 건드리지 않습니다.
- **전용 포트**: 개발 워크플로와 충돌하지 않도록 `9222`를 피합니다.
- **결정적인 탭 제어**: `tabs`는 먼저 `suggestedTargetId`를 반환하고, 그 다음
  안정적인 `tabId` 핸들(예: `t1`), 선택적 레이블, 원시 `targetId`를 반환합니다.
  에이전트는 `suggestedTargetId`를 재사용해야 하며, 원시 id는
  디버깅과 호환성을 위해 계속 제공됩니다.

## 브라우저 선택

로컬에서 실행할 때 OpenClaw는 사용 가능한 것 중 첫 번째를 선택합니다:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

`browser.executablePath`로 override할 수 있습니다.

플랫폼:

- macOS: `/Applications`와 `~/Applications`를 확인합니다.
- Linux: `google-chrome`, `brave`, `microsoft-edge`, `chromium` 등을 찾습니다.
- Windows: 일반적인 설치 위치를 확인합니다.

## 제어 API (선택 사항)

스크립팅 및 디버깅을 위해 Gateway는 작은 **loopback 전용 HTTP
제어 API**와, 이에 대응하는 `openclaw browser` CLI(snapshot, ref, wait
power-up, JSON 출력, 디버그 워크플로)를 노출합니다. 전체 참조는
[Browser control API](/ko/tools/browser-control)를 참고하세요.

## 문제 해결

Linux 전용 문제(특히 snap Chromium)는
[Browser troubleshooting](/ko/tools/browser-linux-troubleshooting)를 참고하세요.

WSL2 Gateway + Windows Chrome 분리 호스트 설정은
[WSL2 + Windows + remote Chrome CDP troubleshooting](/ko/tools/browser-wsl2-windows-remote-cdp-troubleshooting)를 참고하세요.

### CDP 시작 실패 vs 탐색 SSRF 차단

이 둘은 서로 다른 실패 유형이며, 서로 다른 코드 경로를 가리킵니다.

- **CDP 시작 또는 준비 상태 실패**는 OpenClaw가 브라우저 제어 평면이 정상인지 확인할 수 없다는 뜻입니다.
- **탐색 SSRF 차단**은 브라우저 제어 평면은 정상인데, 페이지 탐색 대상이 정책에 의해 거부되었다는 뜻입니다.

일반적인 예시:

- CDP 시작 또는 준비 상태 실패:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- 탐색 SSRF 차단:
  - `start`와 `tabs`는 동작하지만 `open`, `navigate`, snapshot 또는 탭 열기 흐름이 브라우저/네트워크 정책 오류로 실패

이 둘을 구분하려면 다음 최소 시퀀스를 사용하세요:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

결과 읽는 방법:

- `start`가 `not reachable after start`로 실패하면, 먼저 CDP 준비 상태를 문제 해결하세요.
- `start`는 성공하지만 `tabs`가 실패하면, 제어 평면은 여전히 비정상입니다. 이를 페이지 탐색 문제가 아니라 CDP 도달 가능성 문제로 취급하세요.
- `start`와 `tabs`는 성공하지만 `open` 또는 `navigate`가 실패하면, 브라우저 제어 평면은 정상이며 실패 원인은 탐색 정책 또는 대상 페이지입니다.
- `start`, `tabs`, `open`이 모두 성공하면, 기본 관리형 브라우저 제어 경로는 정상입니다.

중요한 동작 세부사항:

- `browser.ssrfPolicy`를 구성하지 않아도 브라우저 config는 기본적으로 fail-closed SSRF 정책 객체를 사용합니다.
- 로컬 loopback `openclaw` 관리형 프로필의 경우, CDP 상태 검사는 OpenClaw 자체 로컬 제어 평면에 대해서는 의도적으로 브라우저 SSRF 도달 가능성 강제를 건너뜁니다.
- 탐색 보호는 별개입니다. `start` 또는 `tabs`가 성공했다고 해서 이후 `open` 또는 `navigate` 대상이 허용된다는 뜻은 아닙니다.

보안 지침:

- 기본적으로 브라우저 SSRF 정책을 완화하지 마세요.
- 광범위한 private-network 액세스보다 `hostnameAllowlist`나 `allowedHostnames` 같은 좁은 호스트 예외를 우선하세요.
- private-network 브라우저 액세스가 필요하고 검토된, 의도적으로 신뢰된 환경에서만 `dangerouslyAllowPrivateNetwork: true`를 사용하세요.

## 에이전트 도구 + 제어 방식

에이전트는 브라우저 자동화를 위해 **하나의 도구**를 받습니다:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

매핑 방식:

- `browser snapshot`은 안정적인 UI 트리(AI 또는 ARIA)를 반환합니다.
- `browser act`는 snapshot의 `ref` ID를 사용해 click/type/drag/select를 수행합니다.
- `browser screenshot`은 픽셀을 캡처합니다(전체 페이지, 요소, 또는 레이블된 ref).
- `browser doctor`는 Gateway, plugin, 프로필, 브라우저, 탭 준비 상태를 점검합니다.
- `browser`는 다음을 받습니다:
  - 이름 있는 브라우저 프로필(openclaw, chrome, 또는 remote CDP)을 선택하기 위한 `profile`
  - 브라우저가 어디에 있는지 선택하기 위한 `target` (`sandbox` | `host` | `node`)
  - sandbox 세션에서는 `target: "host"`에 `agents.defaults.sandbox.browser.allowHostControl=true`가 필요합니다.
  - `target`이 생략되면: sandbox 세션은 기본적으로 `sandbox`, 비-sandbox 세션은 기본적으로 `host`를 사용합니다.
  - 브라우저 capability가 있는 node가 연결되어 있으면, `target="host"` 또는 `target="node"`로 고정하지 않는 한 도구가 자동으로 그쪽으로 라우팅할 수 있습니다.

이렇게 하면 에이전트가 결정적으로 동작하고 취약한 selector를 피할 수 있습니다.

## 관련 항목

- [Tools Overview](/ko/tools) — 사용 가능한 모든 에이전트 도구
- [Sandboxing](/ko/gateway/sandboxing) — sandbox 환경에서의 브라우저 제어
- [Security](/ko/gateway/security) — 브라우저 제어 위험과 하드닝
