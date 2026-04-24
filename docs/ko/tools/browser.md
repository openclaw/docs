---
read_when:
    - 에이전트 제어 browser 자동화 추가하기
    - openclaw가 사용자의 Chrome에 간섭하는 이유 디버깅하기
    - macOS 앱에서 browser 설정과 라이프사이클 구현하기
summary: 통합 browser 제어 서비스 + 액션 명령
title: Browser(OpenClaw 관리)
x-i18n:
    generated_at: "2026-04-24T09:01:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80805676213ef5195093163874a848955b3c25364b20045a8d759d03ac088e14
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw는 에이전트가 제어하는 **전용 Chrome/Brave/Edge/Chromium 프로필**을 실행할 수 있습니다.  
이 프로필은 개인 브라우저와 분리되어 있으며 Gateway 내부의 작은 로컬 제어 서비스(루프백 전용)를 통해 관리됩니다.

초보자 관점에서 보면:

- 이것은 **에이전트 전용의 별도 브라우저**라고 생각하면 됩니다.
- `openclaw` 프로필은 **개인 브라우저 프로필에 영향을 주지 않습니다**.
- 에이전트는 안전한 경로에서 **탭 열기, 페이지 읽기, 클릭, 입력**을 할 수 있습니다.
- 내장된 `user` 프로필은 Chrome MCP를 통해 실제 로그인된 Chrome 세션에 연결됩니다.

## 제공 기능

- **openclaw**라는 이름의 별도 브라우저 프로필(기본적으로 주황색 강조)
- 결정론적인 탭 제어(list/open/focus/close)
- 에이전트 액션(click/type/drag/select), 스냅샷, 스크린샷, PDF
- 선택적 다중 프로필 지원(`openclaw`, `work`, `remote`, ...)

이 브라우저는 **일상적으로 사용하는 기본 브라우저가 아닙니다**.  
에이전트 자동화와 검증을 위한 안전하고 격리된 표면입니다.

## 빠른 시작

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

“Browser disabled”가 표시되면 config에서 이를 활성화한 다음(아래 참고) Gateway를 재시작하세요.

`openclaw browser` 자체가 아예 없거나, 에이전트가 browser 도구를 사용할 수 없다고 말하면 [browser 명령 또는 도구 누락](/ko/tools/browser#missing-browser-command-or-tool)으로 이동하세요.

## Plugin 제어

기본 `browser` 도구는 번들된 Plugin입니다. 같은 `browser` 도구 이름을 등록하는 다른 Plugin으로 교체하려면 이를 비활성화하세요.

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

기본값을 사용하려면 `plugins.entries.browser.enabled`와 `browser.enabled=true`가 **둘 다** 필요합니다. Plugin만 비활성화하면 `openclaw browser` CLI, `browser.request` gateway 메서드, 에이전트 도구, 제어 서비스가 한 번에 제거됩니다. 교체용 구현을 위해 `browser.*` config는 그대로 유지됩니다.

Browser config 변경은 Plugin이 서비스를 다시 등록할 수 있도록 Gateway 재시작이 필요합니다.

## browser 명령 또는 도구 누락

업그레이드 후 `openclaw browser`를 알 수 없다고 나오거나, `browser.request`가 없거나, 에이전트가 browser 도구를 사용할 수 없다고 보고하면, 보통 원인은 `plugins.allow` 목록에서 `browser`가 빠져 있기 때문입니다. 다음과 같이 추가하세요.

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true`, `tools.alsoAllow: ["browser"]`는 allowlist 멤버십을 대체하지 않습니다. allowlist는 Plugin 로딩을 제어하고, 도구 정책은 로드 이후에만 실행되기 때문입니다. `plugins.allow` 자체를 완전히 제거해도 기본 동작이 복원됩니다.

## 프로필: `openclaw` 대 `user`

- `openclaw`: 관리형, 격리된 브라우저(확장 프로그램 불필요)
- `user`: 실제 **로그인된 Chrome** 세션을 위한 내장 Chrome MCP 연결 프로필

에이전트 browser 도구 호출 시:

- 기본값: 격리된 `openclaw` 브라우저 사용
- 기존 로그인 세션이 중요하고 사용자가 컴퓨터 앞에서 연결 프롬프트를 클릭/승인할 수 있을 때는 `profile="user"` 선호
- 특정 browser 모드를 명시적으로 원할 때는 `profile`이 override 역할을 함

기본적으로 관리형 모드를 사용하려면 `browser.defaultProfile: "openclaw"`를 설정하세요.

## 구성

Browser 설정은 `~/.openclaw/openclaw.json`에 있습니다.

```json5
{
  browser: {
    enabled: true, // 기본값: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // 신뢰된 사설 네트워크 접근에만 opt in
      // allowPrivateNetwork: true, // 레거시 별칭
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // 레거시 단일 프로필 override
    remoteCdpTimeoutMs: 1500, // 원격 CDP HTTP 시간 제한(ms)
    remoteCdpHandshakeTimeoutMs: 3000, // 원격 CDP WebSocket 핸드셰이크 시간 제한(ms)
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
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

<Accordion title="포트 및 연결 가능 여부">

- 제어 서비스는 `gateway.port`에서 파생된 포트(기본값 `18791` = gateway + 2)의 루프백에 바인딩됩니다. `gateway.port` 또는 `OPENCLAW_GATEWAY_PORT`를 override하면 같은 계열의 파생 포트도 함께 이동합니다.
- 로컬 `openclaw` 프로필은 `cdpPort`/`cdpUrl`을 자동 할당합니다. 이 값들은 원격 CDP에만 설정하세요. `cdpUrl`이 설정되지 않으면 관리형 로컬 CDP 포트가 기본값이 됩니다.
- `remoteCdpTimeoutMs`는 원격(비루프백) CDP HTTP 연결 가능 여부 검사에 적용되고, `remoteCdpHandshakeTimeoutMs`는 원격 CDP WebSocket 핸드셰이크에 적용됩니다.

</Accordion>

<Accordion title="SSRF 정책">

- Browser navigation과 open-tab은 탐색 전에 SSRF 보호를 받으며, 이후 최종 `http(s)` URL에 대해 가능하면 다시 검사합니다.
- 엄격한 SSRF 모드에서는 원격 CDP endpoint 탐색과 `/json/version` probe(`cdpUrl`)도 검사합니다.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`는 기본적으로 꺼져 있습니다. 사설 네트워크 browser 접근을 의도적으로 신뢰하는 경우에만 활성화하세요.
- `browser.ssrfPolicy.allowPrivateNetwork`는 레거시 별칭으로 계속 지원됩니다.

</Accordion>

<Accordion title="프로필 동작">

- `attachOnly: true`는 로컬 browser를 절대 실행하지 않고, 이미 실행 중일 때만 연결한다는 뜻입니다.
- `color`(최상위 및 프로필별)는 browser UI에 색을 입혀 어떤 프로필이 활성 상태인지 구분할 수 있게 합니다.
- 기본 프로필은 `openclaw`(관리형 독립 실행)입니다. 로그인된 사용자 browser를 사용하려면 `defaultProfile: "user"`를 사용하세요.
- 자동 감지 순서: 시스템 기본 browser가 Chromium 기반이면 그것을 사용하고, 아니면 Chrome → Brave → Edge → Chromium → Chrome Canary 순입니다.
- `driver: "existing-session"`은 원시 CDP 대신 Chrome DevTools MCP를 사용합니다. 이 드라이버에는 `cdpUrl`을 설정하지 마세요.
- 기존 세션 프로필이 기본값이 아닌 Chromium 사용자 프로필(Brave, Edge 등)에 연결되어야 한다면 `browser.profiles.<name>.userDataDir`를 설정하세요.

</Accordion>

</AccordionGroup>

## Brave(또는 다른 Chromium 기반 browser) 사용

**시스템 기본** browser가 Chromium 기반(Chrome/Brave/Edge 등)이면 OpenClaw가 자동으로 이를 사용합니다. 자동 감지를 override하려면 `browser.executablePath`를 설정하세요.

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

또는 플랫폼별로 config에 설정하세요.

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

## 로컬 제어 대 원격 제어

- **로컬 제어(기본값):** Gateway가 루프백 제어 서비스를 시작하고 로컬 browser를 실행할 수 있습니다.
- **원격 제어(Node 호스트):** browser가 있는 머신에서 Node 호스트를 실행하면 Gateway가 browser 액션을 그쪽으로 프록시합니다.
- **원격 CDP:** 원격 Chromium 기반 browser에 연결하려면 `browser.profiles.<name>.cdpUrl`(또는 `browser.cdpUrl`)을 설정하세요. 이 경우 OpenClaw는 로컬 browser를 실행하지 않습니다.

중지 동작은 프로필 모드에 따라 다릅니다.

- 로컬 관리형 프로필: `openclaw browser stop`은 OpenClaw가 실행한 browser 프로세스를 중지합니다.
- attach-only 및 원격 CDP 프로필: `openclaw browser stop`은 활성 제어 세션을 닫고 Playwright/CDP 에뮬레이션 override(뷰포트, 색상 구성표, 로캘, 시간대, 오프라인 모드 및 유사 상태)를 해제합니다. 이 경우 OpenClaw가 browser 프로세스를 실행한 것은 아닙니다.

원격 CDP URL에는 인증 정보를 포함할 수 있습니다.

- 쿼리 토큰(예: `https://provider.example?token=<token>`)
- HTTP Basic 인증(예: `https://user:pass@provider.example`)

OpenClaw는 `/json/*` endpoint를 호출할 때와 CDP WebSocket에 연결할 때 이 인증 정보를 유지합니다. token은 config 파일에 커밋하지 말고 환경 변수나 secrets manager를 사용하는 것이 좋습니다.

## Node browser 프록시(기본 zero-config)

browser가 있는 머신에서 **Node 호스트**를 실행하면 OpenClaw는 추가 browser config 없이 browser 도구 호출을 해당 Node로 자동 라우팅할 수 있습니다. 이것이 원격 gateway의 기본 경로입니다.

참고:

- Node 호스트는 로컬 browser 제어 서버를 **프록시 명령**으로 노출합니다.
- 프로필은 Node 자체의 `browser.profiles` config에서 가져옵니다(로컬과 동일).
- `nodeHost.browserProxy.allowProfiles`는 선택 사항입니다. 비워 두면 레거시/기본 동작을 사용하며, profile create/delete 경로를 포함해 구성된 모든 프로필에 프록시를 통해 접근할 수 있습니다.
- `nodeHost.browserProxy.allowProfiles`를 설정하면 OpenClaw는 이를 최소 권한 경계로 취급합니다. allowlist에 있는 프로필만 대상으로 삼을 수 있고, 영구 profile create/delete 경로는 프록시 표면에서 차단됩니다.
- 원하지 않으면 비활성화하세요.
  - Node에서: `nodeHost.browserProxy.enabled=false`
  - gateway에서: `gateway.nodes.browser.mode="off"`

## Browserless(호스팅된 원격 CDP)

[Browserless](https://browserless.io)는 HTTPS와 WebSocket을 통해 CDP 연결 URL을 노출하는 호스팅 Chromium 서비스입니다. OpenClaw는 두 형식을 모두 사용할 수 있지만, 원격 browser 프로필에서는 Browserless 연결 문서에 나온 직접 WebSocket URL을 사용하는 것이 가장 단순합니다.

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

- `<BROWSERLESS_API_KEY>`는 실제 Browserless token으로 바꾸세요.
- Browserless 계정에 맞는 리전 endpoint를 선택하세요(해당 문서 참고).
- Browserless가 HTTPS 기본 URL을 제공하는 경우, 직접 CDP 연결을 위해 `wss://`로 변환하거나 HTTPS URL을 그대로 두고 OpenClaw가 `/json/version`을 탐색하게 할 수 있습니다.

## 직접 WebSocket CDP provider

일부 호스팅 browser 서비스는 표준 HTTP 기반 CDP 탐색(`/json/version`) 대신 **직접 WebSocket** endpoint를 제공합니다. OpenClaw는 세 가지 CDP URL 형식을 받아들이며 적절한 연결 전략을 자동으로 선택합니다.

- **HTTP(S) 탐색** — `http://host[:port]` 또는 `https://host[:port]`  
  OpenClaw가 `/json/version`을 호출해 WebSocket debugger URL을 찾은 뒤 연결합니다. WebSocket fallback은 없습니다.
- **직접 WebSocket endpoint** — `ws://host[:port]/devtools/<kind>/<id>` 또는 `/devtools/browser|page|worker|shared_worker|service_worker/<id>` 경로가 있는 `wss://...`  
  OpenClaw는 WebSocket 핸드셰이크로 직접 연결하고 `/json/version`은 완전히 건너뜁니다.
- **기본 WebSocket 루트** — `/devtools/...` 경로 없이 `ws://host[:port]` 또는 `wss://host[:port]`(예: [Browserless](https://browserless.io), [Browserbase](https://www.browserbase.com))  
  OpenClaw는 먼저 HTTP `/json/version` 탐색을 시도하고(스킴을 `http`/`https`로 정규화), 탐색 결과에 `webSocketDebuggerUrl`이 있으면 그것을 사용합니다. 그렇지 않으면 기본 루트에서 직접 WebSocket 핸드셰이크로 fallback합니다. 이렇게 하면 로컬 Chrome을 가리키는 기본 `ws://`도 연결할 수 있습니다. Chrome은 `/json/version`에서 얻은 특정 대상 경로에서만 WebSocket 업그레이드를 허용하기 때문입니다.

### Browserbase

[Browserbase](https://www.browserbase.com)는 내장 CAPTCHA 해결, stealth 모드, residential proxy를 제공하는 클라우드 헤드리스 browser 플랫폼입니다.

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
- Browserbase는 WebSocket 연결 시 browser 세션을 자동 생성하므로 수동 세션 생성 단계가 필요 없습니다.
- 무료 플랜은 동시 세션 1개와 월 1 browser hour를 허용합니다. 유료 플랜 제한은 [요금제](https://www.browserbase.com/pricing)를 참고하세요.
- 전체 API 참조, SDK 가이드, 통합 예시는 [Browserbase 문서](https://docs.browserbase.com)를 참고하세요.

## 보안

핵심 개념:

- Browser 제어는 루프백 전용이며, 접근은 Gateway 인증 또는 node pairing을 통해 이뤄집니다.
- 독립형 루프백 browser HTTP API는 **공유 secret 인증만** 사용합니다.  
  gateway token bearer 인증, `x-openclaw-password`, 또는 구성된 gateway 비밀번호를 사용하는 HTTP Basic 인증입니다.
- Tailscale Serve identity 헤더와 `gateway.auth.mode: "trusted-proxy"`는 이 독립형 루프백 browser API를 인증하지 **않습니다**.
- browser 제어가 활성화되어 있고 공유 secret 인증이 구성되지 않으면, OpenClaw는 시작 시 `gateway.auth.token`을 자동 생성하고 이를 config에 저장합니다.
- `gateway.auth.mode`가 이미 `password`, `none`, 또는 `trusted-proxy`인 경우 OpenClaw는 해당 token을 자동 생성하지 **않습니다**.
- Gateway와 모든 node host는 사설 네트워크(Tailscale)에 두고, 공개 노출은 피하세요.
- 원격 CDP URL/token은 secret으로 취급하고, 환경 변수나 secrets manager를 사용하는 것이 좋습니다.

원격 CDP 팁:

- 가능하면 암호화된 endpoint(HTTPS 또는 WSS)와 짧은 수명의 token을 사용하세요.
- 오래 지속되는 token을 config 파일에 직접 넣는 것은 피하세요.

## 프로필(다중 browser)

OpenClaw는 여러 개의 이름 있는 프로필(라우팅 config)을 지원합니다. 프로필은 다음 중 하나일 수 있습니다.

- **openclaw 관리형**: 자체 user data directory와 CDP port를 갖는 전용 Chromium 기반 browser 인스턴스
- **원격**: 명시적인 CDP URL(다른 곳에서 실행 중인 Chromium 기반 browser)
- **기존 세션**: Chrome DevTools MCP 자동 연결을 통한 기존 Chrome 프로필

기본값:

- `openclaw` 프로필은 없으면 자동 생성됩니다.
- `user` 프로필은 Chrome MCP 기존 세션 연결용으로 내장되어 있습니다.
- 기존 세션 프로필은 `user` 외에는 opt-in입니다. `--driver existing-session`으로 생성하세요.
- 로컬 CDP 포트는 기본적으로 **18800–18899** 범위에서 할당됩니다.
- 프로필을 삭제하면 로컬 데이터 디렉터리가 휴지통으로 이동합니다.

모든 제어 endpoint는 `?profile=<name>`을 허용하며, CLI는 `--browser-profile`을 사용합니다.

## Chrome DevTools MCP를 통한 기존 세션

OpenClaw는 공식 Chrome DevTools MCP 서버를 통해 실행 중인 Chromium 기반 browser 프로필에 연결할 수도 있습니다. 이렇게 하면 해당 browser 프로필에서 이미 열려 있는 탭과 로그인 상태를 재사용할 수 있습니다.

공식 배경 및 설정 참고 자료:

- [Chrome for Developers: 브라우저 세션에서 Chrome DevTools MCP 사용하기](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

내장 프로필:

- `user`

선택 사항: 다른 이름, 색상, browser 데이터 디렉터리를 원하면 사용자 정의 기존 세션 프로필을 만들 수 있습니다.

기본 동작:

- 내장 `user` 프로필은 Chrome MCP 자동 연결을 사용하며, 기본 로컬 Google Chrome 프로필을 대상으로 합니다.

Brave, Edge, Chromium 또는 기본이 아닌 Chrome 프로필에는 `userDataDir`를 사용하세요.

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

그다음 해당 browser에서 다음을 수행하세요.

1. 해당 browser의 원격 디버깅 inspect 페이지를 엽니다.
2. 원격 디버깅을 활성화합니다.
3. browser를 계속 실행한 상태로 두고, OpenClaw가 연결할 때 표시되는 연결 프롬프트를 승인합니다.

일반적인 inspect 페이지:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

실시간 연결 smoke 테스트:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

성공 시 모습:

- `status`에 `driver: existing-session`이 표시됨
- `status`에 `transport: chrome-mcp`가 표시됨
- `status`에 `running: true`가 표시됨
- `tabs`에 이미 열려 있는 browser 탭이 나열됨
- `snapshot`이 선택된 라이브 탭의 ref를 반환함

연결이 되지 않을 때 확인할 사항:

- 대상 Chromium 기반 browser 버전이 `144+`인지
- 해당 browser inspect 페이지에서 원격 디버깅이 활성화되어 있는지
- browser가 연결 동의 프롬프트를 표시했고, 이를 수락했는지
- `openclaw doctor`는 오래된 확장 기반 browser config를 마이그레이션하고 기본 자동 연결 프로필에 대해 Chrome이 로컬에 설치되어 있는지 확인하지만, browser 측 원격 디버깅을 대신 활성화해 주지는 않습니다

에이전트 사용:

- 사용자의 로그인된 browser 상태가 필요할 때는 `profile="user"`를 사용하세요.
- 사용자 정의 기존 세션 프로필을 사용한다면 그 명시적 프로필 이름을 전달하세요.
- 이 모드는 사용자가 컴퓨터 앞에 있어 연결 프롬프트를 승인할 수 있을 때만 선택하세요.
- Gateway 또는 node host는 `npx chrome-devtools-mcp@latest --autoConnect`를 실행할 수 있습니다.

참고:

- 이 경로는 로그인된 browser 세션 내부에서 동작할 수 있으므로, 격리된 `openclaw` 프로필보다 위험도가 더 높습니다.
- OpenClaw는 이 드라이버에서 browser를 실행하지 않고 연결만 수행합니다.
- OpenClaw는 여기서 공식 Chrome DevTools MCP `--autoConnect` 흐름을 사용합니다. `userDataDir`가 설정되어 있으면 해당 사용자 데이터 디렉터리를 대상으로 하도록 전달됩니다.
- 기존 세션은 선택된 호스트에서 직접 연결되거나 연결된 browser Node를 통해 연결될 수 있습니다. Chrome이 다른 위치에 있고 browser Node가 연결되어 있지 않다면 원격 CDP 또는 Node 호스트를 대신 사용하세요.

<Accordion title="기존 세션 기능 제한">

관리형 `openclaw` 프로필과 비교하면 기존 세션 드라이버는 제약이 더 많습니다.

- **스크린샷** — 페이지 캡처와 `--ref` 요소 캡처는 가능하지만 CSS `--element` 선택자는 지원하지 않습니다. `--full-page`는 `--ref` 또는 `--element`와 함께 사용할 수 없습니다. 페이지 또는 ref 기반 요소 스크린샷에는 Playwright가 필요하지 않습니다.
- **액션** — `click`, `type`, `hover`, `scrollIntoView`, `drag`, `select`는 snapshot ref가 필요하며 CSS 선택자는 사용할 수 없습니다. `click`은 왼쪽 버튼만 지원합니다. `type`은 `slowly=true`를 지원하지 않으므로 `fill` 또는 `press`를 사용하세요. `press`는 `delayMs`를 지원하지 않습니다. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill`, `evaluate`는 호출별 시간 제한을 지원하지 않습니다. `select`는 단일 값만 허용합니다.
- **대기 / 업로드 / 대화상자** — `wait --url`은 정확 일치, 부분 문자열, glob 패턴을 지원하지만 `wait --load networkidle`은 지원하지 않습니다. 업로드 hook은 `ref` 또는 `inputRef`가 필요하며, 한 번에 파일 하나만 지원하고 CSS `element`는 지원하지 않습니다. 대화상자 hook은 시간 제한 override를 지원하지 않습니다.
- **관리형 전용 기능** — batch action, PDF 내보내기, 다운로드 가로채기, `responsebody`는 여전히 관리형 browser 경로가 필요합니다.

</Accordion>

## 격리 보장

- **전용 사용자 데이터 디렉터리**: 개인 browser 프로필을 절대 건드리지 않습니다.
- **전용 포트**: 개발 워크플로와의 충돌을 피하기 위해 `9222`를 사용하지 않습니다.
- **결정론적 탭 제어**: “마지막 탭”이 아니라 `targetId`로 탭을 지정합니다.

## Browser 선택

로컬에서 실행할 때 OpenClaw는 사용 가능한 다음 browser 중 첫 번째를 선택합니다.

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

`browser.executablePath`로 override할 수 있습니다.

플랫폼별 동작:

- macOS: `/Applications`와 `~/Applications`를 확인합니다.
- Linux: `google-chrome`, `brave`, `microsoft-edge`, `chromium` 등을 찾습니다.
- Windows: 일반적인 설치 위치를 확인합니다.

## 제어 API(선택 사항)

스크립팅과 디버깅을 위해 Gateway는 작은 **루프백 전용 HTTP 제어 API**와 이에 대응하는 `openclaw browser` CLI를 제공합니다(스냅샷, ref, wait 확장 기능, JSON 출력, 디버그 워크플로). 전체 참조는 [Browser 제어 API](/ko/tools/browser-control)를 참고하세요.

## 문제 해결

Linux 전용 문제(특히 snap Chromium)는 [Browser 문제 해결](/ko/tools/browser-linux-troubleshooting)을 참고하세요.

WSL2 Gateway + Windows Chrome 분리 호스트 구성은 [WSL2 + Windows + 원격 Chrome CDP 문제 해결](/ko/tools/browser-wsl2-windows-remote-cdp-troubleshooting)을 참고하세요.

### CDP 시작 실패 대 navigation SSRF 차단

이 둘은 서로 다른 실패 유형이며, 서로 다른 코드 경로를 가리킵니다.

- **CDP 시작 또는 준비 상태 실패**는 OpenClaw가 browser 제어 평면이 정상인지 확인할 수 없다는 뜻입니다.
- **Navigation SSRF 차단**은 browser 제어 평면은 정상인데, 페이지 navigation 대상이 정책에 의해 거부되었다는 뜻입니다.

일반적인 예시:

- CDP 시작 또는 준비 상태 실패:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Navigation SSRF 차단:
  - `start`와 `tabs`는 동작하지만 `open`, `navigate`, snapshot, 또는 탭 열기 흐름이 browser/network 정책 오류로 실패함

이 둘을 구분하려면 다음 최소 순서를 사용하세요.

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

결과 해석 방법:

- `start`가 `not reachable after start`로 실패하면 먼저 CDP 준비 상태를 해결하세요.
- `start`는 성공하지만 `tabs`가 실패하면 제어 평면이 여전히 비정상입니다. 이를 페이지 navigation 문제가 아니라 CDP 연결 문제로 취급하세요.
- `start`와 `tabs`는 성공하지만 `open` 또는 `navigate`가 실패하면 browser 제어 평면은 정상이고, 실패 원인은 navigation 정책이나 대상 페이지에 있습니다.
- `start`, `tabs`, `open`이 모두 성공하면 기본 관리형 browser 제어 경로는 정상입니다.

중요한 동작 세부사항:

- `browser.ssrfPolicy`를 따로 설정하지 않아도 browser config는 기본적으로 fail-closed SSRF 정책 객체를 사용합니다.
- 로컬 루프백 `openclaw` 관리형 프로필의 경우, CDP 상태 검사는 OpenClaw 자체 로컬 제어 평면에 대해서는 의도적으로 browser SSRF 연결 가능 여부 강제를 건너뜁니다.
- Navigation 보호는 별개입니다. `start` 또는 `tabs`가 성공했다고 해서 이후 `open` 또는 `navigate` 대상이 허용된다는 뜻은 아닙니다.

보안 지침:

- 기본적으로 browser SSRF 정책을 완화하지 마세요.
- 광범위한 사설 네트워크 접근보다 `hostnameAllowlist` 또는 `allowedHostnames` 같은 좁은 호스트 예외를 선호하세요.
- `dangerouslyAllowPrivateNetwork: true`는 사설 네트워크 browser 접근이 필요하고 검토된, 의도적으로 신뢰된 환경에서만 사용하세요.

## 에이전트 도구 + 제어 방식

에이전트는 browser 자동화를 위해 **하나의 도구**를 받습니다.

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

매핑 방식:

- `browser snapshot`은 안정적인 UI 트리(AI 또는 ARIA)를 반환합니다.
- `browser act`는 snapshot의 `ref` ID를 사용해 click/type/drag/select를 수행합니다.
- `browser screenshot`은 픽셀을 캡처합니다(전체 페이지 또는 요소).
- `browser`는 다음을 받습니다.
  - `profile`: 이름 있는 browser 프로필(openclaw, chrome, 또는 원격 CDP) 선택
  - `target` (`sandbox` | `host` | `node`): browser가 존재하는 위치 선택
  - sandbox 세션에서 `target: "host"`를 사용하려면 `agents.defaults.sandbox.browser.allowHostControl=true`가 필요합니다.
  - `target`을 생략하면: sandbox 세션은 기본적으로 `sandbox`, 비-sandbox 세션은 기본적으로 `host`
  - browser capability가 있는 Node가 연결되어 있으면 `target="host"` 또는 `target="node"`로 고정하지 않는 한 도구가 자동으로 해당 Node로 라우팅될 수 있습니다.

이렇게 하면 에이전트 동작이 결정론적으로 유지되고 취약한 선택자를 피할 수 있습니다.

## 관련 항목

- [도구 개요](/ko/tools) — 사용 가능한 모든 에이전트 도구
- [샌드박싱](/ko/gateway/sandboxing) — 샌드박스 환경에서의 browser 제어
- [보안](/ko/gateway/security) — browser 제어 위험과 강화 방법
