---
read_when:
    - 에이전트 제어 브라우저 자동화를 추가하는 중입니다
    - OpenClaw가 사용자의 Chrome에 간섭하는 이유를 디버그하는 중입니다
    - macOS 앱에서 브라우저 설정 + 수명 주기를 구현하는 중입니다
summary: 통합 브라우저 제어 서비스 + 액션 명령어
title: 브라우저(OpenClaw 관리)
x-i18n:
    generated_at: "2026-04-11T02:48:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: da6fed36a6f40a50e825f90e5616778954545bd7e52397f7e088b85251ee024f
    source_path: tools/browser.md
    workflow: 15
---

# 브라우저(OpenClaw 관리)

OpenClaw는 에이전트가 제어하는 **전용 Chrome/Brave/Edge/Chromium 프로필**을 실행할 수 있습니다.
이 프로필은 개인 브라우저와 분리되어 있으며 Gateway 내부의 작은 로컬 제어 서비스(루프백 전용)를 통해 관리됩니다.

초보자 관점:

- 이것은 **별도의 에이전트 전용 브라우저**라고 생각하면 됩니다.
- `openclaw` 프로필은 개인 브라우저 프로필에 **영향을 주지 않습니다**.
- 에이전트는 안전한 경로에서 **탭을 열고, 페이지를 읽고, 클릭하고, 입력할 수 있습니다**.
- 내장 `user` 프로필은 Chrome MCP를 통해 실제 로그인된 Chrome 세션에 연결됩니다.

## 제공되는 기능

- **openclaw**라는 이름의 별도 브라우저 프로필(기본적으로 주황색 강조).
- 결정적인 탭 제어(list/open/focus/close).
- 에이전트 작업(click/type/drag/select), 스냅샷, 스크린샷, PDF.
- 선택적 다중 프로필 지원(`openclaw`, `work`, `remote`, ...).

이 브라우저는 **일상적으로 쓰는 기본 브라우저가 아닙니다**. 에이전트 자동화 및 검증을 위한 안전하고 격리된 표면입니다.

## 빠른 시작

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

“Browser disabled”가 표시되면 구성에서 이를 활성화하고(아래 참조) Gateway를 재시작하세요.

`openclaw browser` 명령 자체가 없거나 에이전트가 브라우저 도구를 사용할 수 없다고 말하면, [브라우저 명령 또는 도구 누락](/ko/tools/browser#missing-browser-command-or-tool)으로 이동하세요.

## 플러그인 제어

기본 `browser` 도구는 이제 기본적으로 활성화된 상태로 제공되는 번들 플러그인입니다. 즉, OpenClaw의 나머지 플러그인 시스템을 제거하지 않고도 이를 비활성화하거나 교체할 수 있습니다:

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

같은 `browser` 도구 이름을 제공하는 다른 플러그인을 설치하기 전에 번들 플러그인을 비활성화하세요. 기본 브라우저 경험에는 다음 두 가지가 모두 필요합니다:

- `plugins.entries.browser.enabled`가 비활성화되지 않은 상태
- `browser.enabled=true`

플러그인만 꺼두면 번들 브라우저 CLI(`openclaw browser`), 게이트웨이 메서드(`browser.request`), 에이전트 도구, 기본 브라우저 제어 서비스가 모두 함께 사라집니다. `browser.*` 구성은 대체 플러그인이 재사용할 수 있도록 그대로 유지됩니다.

이제 번들 브라우저 플러그인은 브라우저 런타임 구현도 소유합니다. 코어는 공유 Plugin SDK 도우미와 이전 내부 import 경로용 호환성 재수출만 유지합니다. 실제로는 브라우저 플러그인 패키지를 제거하거나 교체하면 코어 소유 런타임이 하나 더 남는 대신 브라우저 기능 세트 자체가 제거됩니다.

브라우저 구성 변경은 여전히 Gateway 재시작이 필요합니다. 그래야 번들 플러그인이 새 설정으로 브라우저 서비스를 다시 등록할 수 있습니다.

## 브라우저 명령 또는 도구 누락

업그레이드 후 갑자기 `openclaw browser`가 알 수 없는 명령이 되거나 에이전트가 브라우저 도구가 없다고 보고하면, 가장 흔한 원인은 `browser`가 포함되지 않은 제한적인 `plugins.allow` 목록입니다.

잘못된 구성 예시:

```json5
{
  plugins: {
    allow: ["telegram"],
  },
}
```

플러그인 허용 목록에 `browser`를 추가해 해결하세요:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

중요한 참고 사항:

- `plugins.allow`가 설정된 경우 `browser.enabled=true`만으로는 충분하지 않습니다.
- `plugins.allow`가 설정된 경우 `plugins.entries.browser.enabled=true`만으로도 충분하지 않습니다.
- `tools.alsoAllow: ["browser"]`는 번들 브라우저 플러그인을 로드하지 **않습니다**. 이는 플러그인이 이미 로드된 후 도구 정책만 조정합니다.
- 제한적인 플러그인 허용 목록이 필요 없다면 `plugins.allow`를 제거해도 기본 번들 브라우저 동작이 복원됩니다.

일반적인 증상:

- `openclaw browser`가 알 수 없는 명령입니다.
- `browser.request`가 없습니다.
- 에이전트가 브라우저 도구를 사용할 수 없거나 누락되었다고 보고합니다.

## 프로필: `openclaw` 대 `user`

- `openclaw`: 관리되고 격리된 브라우저(확장 프로그램 불필요).
- `user`: 실제 **로그인된 Chrome** 세션을 위한 내장 Chrome MCP 연결 프로필.

에이전트 브라우저 도구 호출 시:

- 기본값: 격리된 `openclaw` 브라우저를 사용합니다.
- 기존 로그인 세션이 중요하고 사용자가 컴퓨터 앞에서 연결 프롬프트를 클릭/승인할 수 있을 때는 `profile="user"`를 선호하세요.
- 특정 브라우저 모드를 원할 때 `profile`이 명시적 재정의입니다.

기본적으로 관리 모드를 사용하려면 `browser.defaultProfile: "openclaw"`를 설정하세요.

## 구성

브라우저 설정은 `~/.openclaw/openclaw.json`에 있습니다.

```json5
{
  browser: {
    enabled: true, // 기본값: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // 신뢰된 사설 네트워크 액세스에만 선택적으로 활성화
      // allowPrivateNetwork: true, // 레거시 별칭
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // 레거시 단일 프로필 재정의
    remoteCdpTimeoutMs: 1500, // 원격 CDP HTTP 타임아웃(ms)
    remoteCdpHandshakeTimeoutMs: 3000, // 원격 CDP WebSocket 핸드셰이크 타임아웃(ms)
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

참고:

- 브라우저 제어 서비스는 `gateway.port`에서 파생된 포트(기본값: `18791`, 즉 gateway + 2)로 루프백에 바인딩됩니다.
- Gateway 포트(`gateway.port` 또는 `OPENCLAW_GATEWAY_PORT`)를 재정의하면, 파생된 브라우저 포트도 같은 “계열”을 유지하도록 함께 이동합니다.
- `cdpUrl`이 설정되지 않으면 기본적으로 관리되는 로컬 CDP 포트를 사용합니다.
- `remoteCdpTimeoutMs`는 원격(비루프백) CDP 도달 가능성 검사에 적용됩니다.
- `remoteCdpHandshakeTimeoutMs`는 원격 CDP WebSocket 도달 가능성 검사에 적용됩니다.
- 브라우저 내비게이션/탭 열기는 내비게이션 전에 SSRF 보호를 거치며, 내비게이션 후 최종 `http(s)` URL에 대해서도 최선의 노력으로 다시 검사됩니다.
- 엄격한 SSRF 모드에서는 원격 CDP 엔드포인트 검색/프로브(`cdpUrl`, `/json/version` 조회 포함)도 검사됩니다.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`는 기본적으로 비활성화되어 있습니다. 사설 네트워크 브라우저 액세스를 의도적으로 신뢰할 때만 `true`로 설정하세요.
- `browser.ssrfPolicy.allowPrivateNetwork`는 호환성을 위한 레거시 별칭으로 계속 지원됩니다.
- `attachOnly: true`는 “로컬 브라우저를 절대 실행하지 않고, 이미 실행 중일 때만 연결”을 의미합니다.
- `color` 및 프로필별 `color`는 어떤 프로필이 활성 상태인지 쉽게 확인할 수 있도록 브라우저 UI에 색을 입힙니다.
- 기본 프로필은 `openclaw`입니다(OpenClaw 관리 독립 브라우저). 로그인된 사용자 브라우저를 선택하려면 `defaultProfile: "user"`를 사용하세요.
- 자동 감지 순서: 시스템 기본 브라우저가 Chromium 기반이면 그것을 사용하고, 아니면 Chrome → Brave → Edge → Chromium → Chrome Canary 순입니다.
- 로컬 `openclaw` 프로필은 `cdpPort`/`cdpUrl`을 자동 할당하므로, 원격 CDP에 대해서만 이를 설정하세요.
- `driver: "existing-session"`은 원시 CDP 대신 Chrome DevTools MCP를 사용합니다. 해당 드라이버에는 `cdpUrl`을 설정하지 마세요.
- 기존 세션 프로필이 Brave나 Edge 같은 기본이 아닌 Chromium 사용자 프로필에 연결해야 하면 `browser.profiles.<name>.userDataDir`를 설정하세요.

## Brave(또는 다른 Chromium 기반 브라우저) 사용

**시스템 기본 브라우저**가 Chromium 기반(Chrome/Brave/Edge 등)이면 OpenClaw는 이를 자동으로 사용합니다. 자동 감지를 재정의하려면 `browser.executablePath`를 설정하세요:

CLI 예시:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

```json5
// macOS
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
  }
}

// Windows
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
  }
}

// Linux
{
  browser: {
    executablePath: "/usr/bin/brave-browser"
  }
}
```

## 로컬 제어와 원격 제어

- **로컬 제어(기본값):** Gateway가 루프백 제어 서비스를 시작하고 로컬 브라우저를 실행할 수 있습니다.
- **원격 제어(node host):** 브라우저가 있는 머신에서 node host를 실행하면 Gateway가 브라우저 작업을 해당 호스트로 프록시합니다.
- **원격 CDP:** 원격 Chromium 기반 브라우저에 연결하려면 `browser.profiles.<name>.cdpUrl`(또는 `browser.cdpUrl`)을 설정하세요. 이 경우 OpenClaw는 로컬 브라우저를 실행하지 않습니다.

중지 동작은 프로필 모드에 따라 다릅니다:

- 로컬 관리 프로필: `openclaw browser stop`은 OpenClaw가 실행한 브라우저 프로세스를 중지합니다
- attach-only 및 원격 CDP 프로필: `openclaw browser stop`은 활성 제어 세션을 닫고 Playwright/CDP 에뮬레이션 재정의(뷰포트, 색 구성표, 로캘, 시간대, 오프라인 모드 등 유사 상태)를 해제합니다. 이 경우 OpenClaw가 브라우저 프로세스를 실행하지 않았더라도 적용됩니다

원격 CDP URL에는 인증을 포함할 수 있습니다:

- 쿼리 토큰(예: `https://provider.example?token=<token>`)
- HTTP Basic 인증(예: `https://user:pass@provider.example`)

OpenClaw는 `/json/*` 엔드포인트를 호출할 때와 CDP WebSocket에 연결할 때 인증 정보를 보존합니다. 토큰은 구성 파일에 커밋하는 대신 환경 변수나 비밀 관리자 사용을 권장합니다.

## Node 브라우저 프록시(기본 무구성)

브라우저가 있는 머신에서 **node host**를 실행하면 OpenClaw는 추가 브라우저 구성 없이도 브라우저 도구 호출을 해당 노드로 자동 라우팅할 수 있습니다. 이것이 원격 게이트웨이의 기본 경로입니다.

참고:

- node host는 **프록시 명령**을 통해 자신의 로컬 브라우저 제어 서버를 노출합니다.
- 프로필은 노드 자체의 `browser.profiles` 구성(로컬과 동일)에서 가져옵니다.
- `nodeHost.browserProxy.allowProfiles`는 선택 사항입니다. 비워 두면 레거시/기본 동작이 적용되어, 프로필 생성/삭제 경로를 포함한 모든 구성된 프로필이 프록시를 통해 계속 접근 가능합니다.
- `nodeHost.browserProxy.allowProfiles`를 설정하면 OpenClaw는 이를 최소 권한 경계로 취급합니다. 허용 목록에 있는 프로필만 대상으로 지정할 수 있고, 영구 프로필 생성/삭제 경로는 프록시 표면에서 차단됩니다.
- 원하지 않으면 비활성화하세요:
  - 노드에서: `nodeHost.browserProxy.enabled=false`
  - 게이트웨이에서: `gateway.nodes.browser.mode="off"`

## Browserless(호스팅 원격 CDP)

[Browserless](https://browserless.io)는 HTTPS와 WebSocket을 통해 CDP 연결 URL을 노출하는 호스팅 Chromium 서비스입니다. OpenClaw는 두 형식을 모두 사용할 수 있지만, 원격 브라우저 프로필에서는 Browserless 연결 문서의 직접 WebSocket URL이 가장 간단한 선택입니다.

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
- Browserless 계정에 맞는 리전 엔드포인트를 선택하세요(자세한 내용은 해당 문서 참조).
- Browserless가 HTTPS 기본 URL을 제공하는 경우, 직접 CDP 연결을 위해 이를 `wss://`로 변환하거나 HTTPS URL을 유지한 채 OpenClaw가 `/json/version`을 검색하게 둘 수 있습니다.

## 직접 WebSocket CDP 제공자

일부 호스팅 브라우저 서비스는 표준 HTTP 기반 CDP 검색(`/json/version`) 대신 **직접 WebSocket** 엔드포인트를 노출합니다. OpenClaw는 두 방식 모두를 지원합니다:

- **HTTP(S) 엔드포인트** — OpenClaw가 `/json/version`을 호출해 WebSocket 디버거 URL을 검색한 다음 연결합니다.
- **WebSocket 엔드포인트** (`ws://` / `wss://`) — OpenClaw가 `/json/version`을 건너뛰고 직접 연결합니다. [Browserless](https://browserless.io), [Browserbase](https://www.browserbase.com), 또는 WebSocket URL을 제공하는 모든 서비스에 이 방식을 사용하세요.

### Browserbase

[Browserbase](https://www.browserbase.com)는 내장 CAPTCHA 해결, 스텔스 모드, 주거용 프록시를 갖춘 헤드리스 브라우저 실행용 클라우드 플랫폼입니다.

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

- [회원 가입](https://www.browserbase.com/sign-up) 후 [Overview dashboard](https://www.browserbase.com/overview)에서 **API Key**를 복사하세요.
- `<BROWSERBASE_API_KEY>`를 실제 Browserbase API 키로 바꾸세요.
- Browserbase는 WebSocket 연결 시 브라우저 세션을 자동 생성하므로 수동 세션 생성 단계가 필요 없습니다.
- 무료 요금제는 동시 세션 1개와 월 1 브라우저 시간을 허용합니다. 유료 요금제 제한은 [pricing](https://www.browserbase.com/pricing)을 참조하세요.
- 전체 API 참조, SDK 가이드, 통합 예시는 [Browserbase docs](https://docs.browserbase.com)를 참조하세요.

## 보안

핵심 개념:

- 브라우저 제어는 루프백 전용이며, 액세스는 Gateway 인증 또는 노드 페어링을 통해 흐릅니다.
- 독립형 루프백 브라우저 HTTP API는 **공유 비밀 인증만** 사용합니다: 게이트웨이 토큰 bearer 인증, `x-openclaw-password`, 또는 구성된 게이트웨이 비밀번호를 사용하는 HTTP Basic 인증.
- Tailscale Serve 신원 헤더와 `gateway.auth.mode: "trusted-proxy"`는 이 독립형 루프백 브라우저 API를 인증하지 **않습니다**.
- 브라우저 제어가 활성화되어 있고 공유 비밀 인증이 구성되지 않은 경우, OpenClaw는 시작 시 `gateway.auth.token`을 자동 생성해 구성에 저장합니다.
- `gateway.auth.mode`가 이미 `password`, `none`, `trusted-proxy`인 경우에는 OpenClaw가 해당 토큰을 자동 생성하지 않습니다.
- Gateway와 모든 node host는 사설 네트워크(Tailscale)에 유지하고 공개 노출은 피하세요.
- 원격 CDP URL/토큰은 비밀로 취급하고, 환경 변수나 비밀 관리자를 사용하는 것이 좋습니다.

원격 CDP 팁:

- 가능하면 암호화된 엔드포인트(HTTPS 또는 WSS)와 짧은 수명의 토큰을 선호하세요.
- 장기 토큰을 구성 파일에 직접 포함하지 마세요.

## 프로필(다중 브라우저)

OpenClaw는 여러 개의 이름 있는 프로필(라우팅 구성)을 지원합니다. 프로필은 다음 중 하나일 수 있습니다:

- **OpenClaw 관리형**: 자체 사용자 데이터 디렉터리와 CDP 포트를 가진 전용 Chromium 기반 브라우저 인스턴스
- **원격**: 명시적 CDP URL(다른 곳에서 실행 중인 Chromium 기반 브라우저)
- **기존 세션**: Chrome DevTools MCP 자동 연결을 통한 기존 Chrome 프로필

기본값:

- `openclaw` 프로필은 없으면 자동 생성됩니다.
- `user` 프로필은 Chrome MCP 기존 세션 연결용으로 내장되어 있습니다.
- 기존 세션 프로필은 `user` 외에는 선택적으로만 활성화되며, `--driver existing-session`으로 생성합니다.
- 로컬 CDP 포트는 기본적으로 **18800–18899** 범위에서 할당됩니다.
- 프로필을 삭제하면 로컬 데이터 디렉터리는 휴지통으로 이동합니다.

모든 제어 엔드포인트는 `?profile=<name>`을 받으며, CLI는 `--browser-profile`을 사용합니다.

## Chrome DevTools MCP를 통한 기존 세션

OpenClaw는 공식 Chrome DevTools MCP 서버를 통해 실행 중인 Chromium 기반 브라우저 프로필에 연결할 수도 있습니다. 이렇게 하면 해당 브라우저 프로필에 이미 열려 있는 탭과 로그인 상태를 재사용합니다.

공식 배경 설명과 설정 참조:

- [Chrome for Developers: 브라우저 세션과 함께 Chrome DevTools MCP 사용하기](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

내장 프로필:

- `user`

선택 사항: 다른 이름, 색상 또는 브라우저 데이터 디렉터리를 원하면 사용자 정의 기존 세션 프로필을 직접 만들 수 있습니다.

기본 동작:

- 내장 `user` 프로필은 Chrome MCP 자동 연결을 사용하며, 기본 로컬 Google Chrome 프로필을 대상으로 합니다.

Brave, Edge, Chromium 또는 기본이 아닌 Chrome 프로필에는 `userDataDir`를 사용하세요:

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

1. 원격 디버깅용 검사 페이지를 엽니다.
2. 원격 디버깅을 활성화합니다.
3. 브라우저를 계속 실행한 상태로 두고 OpenClaw가 연결할 때 연결 프롬프트를 승인합니다.

일반적인 검사 페이지:

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

성공 시 확인되는 사항:

- `status`에 `driver: existing-session`이 표시됩니다
- `status`에 `transport: chrome-mcp`가 표시됩니다
- `status`에 `running: true`가 표시됩니다
- `tabs`에 이미 열려 있는 브라우저 탭이 나열됩니다
- `snapshot`이 선택된 라이브 탭의 참조를 반환합니다

연결이 작동하지 않을 때 확인할 사항:

- 대상 Chromium 기반 브라우저 버전이 `144+`인지
- 해당 브라우저의 검사 페이지에서 원격 디버깅이 활성화되었는지
- 브라우저가 연결 동의 프롬프트를 표시했고 이를 수락했는지
- `openclaw doctor`는 이전 확장 기반 브라우저 구성을 마이그레이션하고 기본 자동 연결 프로필용으로 Chrome이 로컬에 설치되어 있는지 검사하지만, 브라우저 측 원격 디버깅을 대신 활성화해 주지는 않습니다

에이전트 사용:

- 사용자의 로그인된 브라우저 상태가 필요할 때 `profile="user"`를 사용하세요.
- 사용자 정의 기존 세션 프로필을 사용하는 경우, 해당 명시적 프로필 이름을 전달하세요.
- 사용자가 컴퓨터 앞에서 연결 프롬프트를 승인할 수 있을 때만 이 모드를 선택하세요.
- Gateway 또는 node host는 `npx chrome-devtools-mcp@latest --autoConnect`를 실행할 수 있습니다

참고:

- 이 경로는 로그인된 브라우저 세션 내부에서 동작할 수 있으므로 격리된 `openclaw` 프로필보다 위험도가 더 높습니다.
- OpenClaw는 이 드라이버에서 브라우저를 실행하지 않으며, 기존 세션에만 연결합니다.
- OpenClaw는 여기서 공식 Chrome DevTools MCP `--autoConnect` 흐름을 사용합니다. `userDataDir`가 설정되어 있으면 이를 전달해 해당 명시적 Chromium 사용자 데이터 디렉터리를 대상으로 합니다.
- 기존 세션 스크린샷은 페이지 캡처와 스냅샷의 `--ref` 요소 캡처를 지원하지만 CSS `--element` 선택자는 지원하지 않습니다.
- 기존 세션 페이지 스크린샷은 Playwright 없이도 Chrome MCP를 통해 작동합니다. 참조 기반 요소 스크린샷(`--ref`)도 여기서 작동하지만 `--full-page`는 `--ref` 또는 `--element`와 함께 사용할 수 없습니다.
- 기존 세션 작업은 관리형 브라우저 경로보다 여전히 더 제한적입니다:
  - `click`, `type`, `hover`, `scrollIntoView`, `drag`, `select`는 CSS 선택자 대신 스냅샷 참조가 필요합니다
  - `click`은 왼쪽 버튼만 지원합니다(버튼 재정의나 수정 키 없음)
  - `type`은 `slowly=true`를 지원하지 않습니다. `fill` 또는 `press`를 사용하세요
  - `press`는 `delayMs`를 지원하지 않습니다
  - `hover`, `scrollIntoView`, `drag`, `select`, `fill`, `evaluate`는 호출별 타임아웃 재정의를 지원하지 않습니다
  - `select`는 현재 단일 값만 지원합니다
- 기존 세션 `wait --url`은 다른 브라우저 드라이버처럼 정확 일치, 부분 문자열, glob 패턴을 지원합니다. `wait --load networkidle`은 아직 지원되지 않습니다.
- 기존 세션 업로드 훅은 `ref` 또는 `inputRef`가 필요하고, 한 번에 하나의 파일만 지원하며, CSS `element` 대상 지정은 지원하지 않습니다.
- 기존 세션 대화상자 훅은 타임아웃 재정의를 지원하지 않습니다.
- 배치 작업, PDF 내보내기, 다운로드 가로채기, `responsebody` 등 일부 기능은 여전히 관리형 브라우저 경로가 필요합니다.
- 기존 세션은 호스트 로컬입니다. Chrome이 다른 머신이나 다른 네트워크 네임스페이스에 있다면 대신 원격 CDP 또는 node host를 사용하세요.

## 격리 보장

- **전용 사용자 데이터 디렉터리**: 개인 브라우저 프로필에 절대 영향을 주지 않습니다.
- **전용 포트**: 개발 워크플로와의 충돌을 방지하기 위해 `9222`를 피합니다.
- **결정적인 탭 제어**: “마지막 탭”이 아니라 `targetId`로 탭을 지정합니다.

## 브라우저 선택

로컬에서 실행할 때 OpenClaw는 사용 가능한 첫 번째 브라우저를 선택합니다:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

`browser.executablePath`로 재정의할 수 있습니다.

플랫폼:

- macOS: `/Applications`와 `~/Applications`를 확인합니다.
- Linux: `google-chrome`, `brave`, `microsoft-edge`, `chromium` 등을 찾습니다.
- Windows: 일반적인 설치 위치를 확인합니다.

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

모든 엔드포인트는 `?profile=<name>`을 받습니다.

공유 비밀 기반 게이트웨이 인증이 구성되어 있으면 브라우저 HTTP 경로도 인증이 필요합니다:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` 또는 해당 비밀번호를 사용하는 HTTP Basic 인증

참고:

- 이 독립형 루프백 브라우저 API는 trusted-proxy 또는 Tailscale Serve 신원 헤더를 사용하지 **않습니다**.
- `gateway.auth.mode`가 `none` 또는 `trusted-proxy`인 경우에도 이 루프백 브라우저 경로는 그런 신원 기반 모드를 상속하지 않으므로, 반드시 루프백 전용으로 유지하세요.

### `/act` 오류 계약

`POST /act`는 경로 수준 검증 및 정책 실패를 위해 구조화된 오류 응답을 사용합니다:

```json
{ "error": "<message>", "code": "ACT_*" }
```

현재 `code` 값:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind`가 없거나 인식되지 않습니다.
- `ACT_INVALID_REQUEST` (HTTP 400): 작업 페이로드 정규화 또는 검증에 실패했습니다.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): 지원되지 않는 작업 종류에 `selector`가 사용되었습니다.
- `ACT_EVALUATE_DISABLED` (HTTP 403): 구성에 의해 `evaluate`(또는 `wait --fn`)가 비활성화되어 있습니다.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): 최상위 또는 배치된 `targetId`가 요청 대상과 충돌합니다.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): 기존 세션 프로필에서는 이 작업이 지원되지 않습니다.

기타 런타임 실패는 여전히 `code` 필드 없이 `{ "error": "<message>" }`를 반환할 수 있습니다.

### Playwright 요구 사항

일부 기능(내비게이션/작업/AI 스냅샷/role 스냅샷, 요소 스크린샷, PDF)에는 Playwright가 필요합니다. Playwright가 설치되어 있지 않으면 해당 엔드포인트는 명확한 501 오류를 반환합니다.

Playwright 없이도 작동하는 것:

- ARIA 스냅샷
- 탭별 CDP WebSocket을 사용할 수 있을 때 관리형 `openclaw` 브라우저의 페이지 스크린샷
- `existing-session` / Chrome MCP 프로필의 페이지 스크린샷
- 스냅샷 출력의 기존 세션 참조 기반 스크린샷(`--ref`)

여전히 Playwright가 필요한 것:

- `navigate`
- `act`
- AI 스냅샷 / role 스냅샷
- CSS 선택자 요소 스크린샷(`--element`)
- 전체 브라우저 PDF 내보내기

요소 스크린샷은 `--full-page`도 거부합니다. 이 경로는 `fullPage is not supported for element screenshots`를 반환합니다.

`Playwright is not available in this gateway build`가 표시되면 전체 Playwright 패키지(`playwright-core`가 아님)를 설치한 뒤 게이트웨이를 재시작하거나, 브라우저 지원이 포함된 OpenClaw를 다시 설치하세요.

#### Docker Playwright 설치

Gateway가 Docker에서 실행 중이라면 `npx playwright`는 피하세요(npm override 충돌). 대신 번들된 CLI를 사용하세요:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

브라우저 다운로드를 유지하려면 `PLAYWRIGHT_BROWSERS_PATH`를 설정하고(예: `/home/node/.cache/ms-playwright`), `/home/node`가 `OPENCLAW_HOME_VOLUME` 또는 bind mount를 통해 유지되도록 하세요. 자세한 내용은 [Docker](/ko/install/docker)를 참조하세요.

## 작동 방식(내부)

상위 수준 흐름:

- 작은 **제어 서버**가 HTTP 요청을 받습니다.
- 이 서버는 **CDP**를 통해 Chromium 기반 브라우저(Chrome/Brave/Edge/Chromium)에 연결합니다.
- 고급 작업(click/type/snapshot/PDF)에는 CDP 위에서 **Playwright**를 사용합니다.
- Playwright가 없으면 Playwright 비의존 작업만 사용할 수 있습니다.

이 설계는 에이전트가 안정적이고 결정적인 인터페이스를 사용하도록 유지하면서, 로컬/원격 브라우저와 프로필을 교체할 수 있게 해줍니다.

## CLI 빠른 참조

모든 명령은 특정 프로필을 지정하기 위해 `--browser-profile <name>`을 받을 수 있습니다.
모든 명령은 기계가 읽을 수 있는 출력(안정적인 페이로드)을 위해 `--json`도 지원합니다.

기본:

- `openclaw browser status`
- `openclaw browser start`
- `openclaw browser stop`
- `openclaw browser tabs`
- `openclaw browser tab`
- `openclaw browser tab new`
- `openclaw browser tab select 2`
- `openclaw browser tab close 2`
- `openclaw browser open https://example.com`
- `openclaw browser focus abcd1234`
- `openclaw browser close abcd1234`

검사:

- `openclaw browser screenshot`
- `openclaw browser screenshot --full-page`
- `openclaw browser screenshot --ref 12`
- `openclaw browser screenshot --ref e12`
- `openclaw browser snapshot`
- `openclaw browser snapshot --format aria --limit 200`
- `openclaw browser snapshot --interactive --compact --depth 6`
- `openclaw browser snapshot --efficient`
- `openclaw browser snapshot --labels`
- `openclaw browser snapshot --selector "#main" --interactive`
- `openclaw browser snapshot --frame "iframe#main" --interactive`
- `openclaw browser console --level error`

수명 주기 참고:

- attach-only 및 원격 CDP 프로필의 경우에도 테스트 후 정리 명령으로는 여전히 `openclaw browser stop`이 적절합니다. 이 명령은 기본 브라우저를 종료하는 대신 활성 제어 세션을 닫고 임시 에뮬레이션 재정의 상태를 지웁니다.
- `openclaw browser errors --clear`
- `openclaw browser requests --filter api --clear`
- `openclaw browser pdf`
- `openclaw browser responsebody "**/api" --max-chars 5000`

작업:

- `openclaw browser navigate https://example.com`
- `openclaw browser resize 1280 720`
- `openclaw browser click 12 --double`
- `openclaw browser click e12 --double`
- `openclaw browser type 23 "hello" --submit`
- `openclaw browser press Enter`
- `openclaw browser hover 44`
- `openclaw browser scrollintoview e12`
- `openclaw browser drag 10 11`
- `openclaw browser select 9 OptionA OptionB`
- `openclaw browser download e12 report.pdf`
- `openclaw browser waitfordownload report.pdf`
- `openclaw browser upload /tmp/openclaw/uploads/file.pdf`
- `openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'`
- `openclaw browser dialog --accept`
- `openclaw browser wait --text "Done"`
- `openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"`
- `openclaw browser evaluate --fn '(el) => el.textContent' --ref 7`
- `openclaw browser highlight e12`
- `openclaw browser trace start`
- `openclaw browser trace stop`

상태:

- `openclaw browser cookies`
- `openclaw browser cookies set session abc123 --url "https://example.com"`
- `openclaw browser cookies clear`
- `openclaw browser storage local get`
- `openclaw browser storage local set theme dark`
- `openclaw browser storage session clear`
- `openclaw browser set offline on`
- `openclaw browser set headers --headers-json '{"X-Debug":"1"}'`
- `openclaw browser set credentials user pass`
- `openclaw browser set credentials --clear`
- `openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"`
- `openclaw browser set geo --clear`
- `openclaw browser set media dark`
- `openclaw browser set timezone America/New_York`
- `openclaw browser set locale en-US`
- `openclaw browser set device "iPhone 14"`

참고:

- `upload`와 `dialog`는 **사전 준비(arming)** 호출입니다. 파일 선택기/대화상자를 트리거하는 클릭/입력 전에 먼저 실행하세요.
- 다운로드 및 trace 출력 경로는 OpenClaw 임시 루트로 제한됩니다:
  - traces: `/tmp/openclaw` (대체값: `${os.tmpdir()}/openclaw`)
  - downloads: `/tmp/openclaw/downloads` (대체값: `${os.tmpdir()}/openclaw/downloads`)
- 업로드 경로는 OpenClaw 임시 uploads 루트로 제한됩니다:
  - uploads: `/tmp/openclaw/uploads` (대체값: `${os.tmpdir()}/openclaw/uploads`)
- `upload`는 `--input-ref` 또는 `--element`를 통해 파일 입력을 직접 설정할 수도 있습니다.
- `snapshot`:
  - `--format ai`(Playwright가 설치된 경우 기본값): 숫자 참조(`aria-ref="<n>"`)가 포함된 AI 스냅샷을 반환합니다.
  - `--format aria`: 접근성 트리를 반환합니다(참조 없음, 검사 전용).
  - `--efficient`(또는 `--mode efficient`): 압축된 role 스냅샷 프리셋입니다(interactive + compact + depth + 더 낮은 maxChars).
  - 구성 기본값(도구/CLI 전용): 호출자가 모드를 전달하지 않을 때 효율적인 스냅샷을 사용하려면 `browser.snapshotDefaults.mode: "efficient"`를 설정하세요([Gateway 구성](/ko/gateway/configuration-reference#browser) 참조).
  - Role 스냅샷 옵션(`--interactive`, `--compact`, `--depth`, `--selector`)은 `ref=e12` 같은 참조가 포함된 role 기반 스냅샷을 강제합니다.
  - `--frame "<iframe selector>"`는 role 스냅샷 범위를 iframe으로 제한합니다(`e12` 같은 role 참조와 함께 사용).
  - `--interactive`는 대화형 요소의 평면적이고 선택하기 쉬운 목록을 출력합니다(작업 수행에 가장 적합).
  - `--labels`는 참조 라벨이 오버레이된 뷰포트 전용 스크린샷을 추가합니다(`MEDIA:<path>` 출력).
- `click`/`type` 등은 `snapshot`에서 얻은 `ref`(숫자 `12` 또는 role 참조 `e12`)가 필요합니다.
  작업에는 의도적으로 CSS 선택자가 지원되지 않습니다.

## 스냅샷과 참조

OpenClaw는 두 가지 “스냅샷” 스타일을 지원합니다:

- **AI 스냅샷(숫자 참조)**: `openclaw browser snapshot`(기본값, `--format ai`)
  - 출력: 숫자 참조가 포함된 텍스트 스냅샷
  - 작업: `openclaw browser click 12`, `openclaw browser type 23 "hello"`
  - 내부적으로 참조는 Playwright의 `aria-ref`를 통해 해석됩니다

- **Role 스냅샷(`e12` 같은 role 참조)**: `openclaw browser snapshot --interactive`(또는 `--compact`, `--depth`, `--selector`, `--frame`)
  - 출력: `[ref=e12]`(선택적으로 `[nth=1]`)가 포함된 role 기반 목록/트리
  - 작업: `openclaw browser click e12`, `openclaw browser highlight e12`
  - 내부적으로 참조는 `getByRole(...)`(중복에 대해서는 `nth()` 추가)로 해석됩니다
  - `--labels`를 추가하면 `e12` 라벨이 오버레이된 뷰포트 스크린샷이 포함됩니다

참조 동작:

- 참조는 **내비게이션 간에 안정적이지 않습니다**. 무언가 실패하면 `snapshot`을 다시 실행하고 새 참조를 사용하세요.
- role 스냅샷이 `--frame`과 함께 생성된 경우, 해당 role 참조는 다음 role 스냅샷 전까지 그 iframe 범위로 제한됩니다.

## Wait 강화 기능

단순히 시간/텍스트 외에도 여러 조건을 기다릴 수 있습니다:

- URL 대기(Playwright의 glob 지원):
  - `openclaw browser wait --url "**/dash"`
- 로드 상태 대기:
  - `openclaw browser wait --load networkidle`
- JS predicate 대기:
  - `openclaw browser wait --fn "window.ready===true"`
- 선택자가 표시될 때까지 대기:
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
2. `click <ref>` / `type <ref>`를 사용합니다(대화형 모드에서는 role 참조 권장)
3. 그래도 실패하면: `openclaw browser highlight <ref>`로 Playwright가 무엇을 대상으로 하는지 확인합니다
4. 페이지 동작이 이상하면:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. 더 깊은 디버깅이 필요하면 trace를 기록합니다:
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

JSON의 role 스냅샷에는 `refs`와 작은 `stats` 블록(lines/chars/refs/interactive)이 포함되어, 도구가 페이로드 크기와 밀도를 판단할 수 있습니다.

## 상태 및 환경 제어 항목

이 기능들은 “사이트가 X처럼 동작하게 만들기” 워크플로에 유용합니다:

- 쿠키: `cookies`, `cookies set`, `cookies clear`
- 스토리지: `storage local|session get|set|clear`
- 오프라인: `set offline on|off`
- 헤더: `set headers --headers-json '{"X-Debug":"1"}'`(레거시 `set headers --json '{"X-Debug":"1"}'`도 계속 지원)
- HTTP 기본 인증: `set credentials user pass`(또는 `--clear`)
- 위치 정보: `set geo <lat> <lon> --origin "https://example.com"`(또는 `--clear`)
- 미디어: `set media dark|light|no-preference|none`
- 시간대 / 로캘: `set timezone ...`, `set locale ...`
- 디바이스 / 뷰포트:
  - `set device "iPhone 14"`(Playwright 디바이스 프리셋)
  - `set viewport 1280 720`

## 보안 및 개인정보

- openclaw 브라우저 프로필에는 로그인된 세션이 포함될 수 있으므로 민감 정보로 취급하세요.
- `browser act kind=evaluate` / `openclaw browser evaluate` 및 `wait --fn`은 페이지 컨텍스트에서 임의의 JavaScript를 실행합니다. 프롬프트 인젝션이 이를 유도할 수 있습니다. 필요하지 않다면 `browser.evaluateEnabled=false`로 비활성화하세요.
- 로그인 및 안티봇 참고 사항(X/Twitter 등)은 [브라우저 로그인 + X/Twitter 게시](/ko/tools/browser-login)를 참조하세요.
- Gateway/node host는 비공개 상태(루프백 또는 tailnet 전용)로 유지하세요.
- 원격 CDP 엔드포인트는 강력한 권한을 가지므로 터널링하고 보호해야 합니다.

엄격 모드 예시(기본적으로 사설/내부 대상 차단):

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

## 문제 해결

Linux 전용 문제(특히 snap Chromium)는 [브라우저 문제 해결](/ko/tools/browser-linux-troubleshooting)을 참조하세요.

WSL2 Gateway + Windows Chrome 분리 호스트 설정은 [WSL2 + Windows + 원격 Chrome CDP 문제 해결](/ko/tools/browser-wsl2-windows-remote-cdp-troubleshooting)을 참조하세요.

## 에이전트 도구 + 제어 방식

에이전트는 브라우저 자동화를 위해 **하나의 도구**를 받습니다:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

매핑 방식:

- `browser snapshot`은 안정적인 UI 트리(AI 또는 ARIA)를 반환합니다.
- `browser act`는 스냅샷 `ref` ID를 사용해 click/type/drag/select를 수행합니다.
- `browser screenshot`은 픽셀을 캡처합니다(전체 페이지 또는 요소).
- `browser`는 다음을 받습니다:
  - `profile`: 이름 있는 브라우저 프로필(openclaw, chrome, 또는 원격 CDP)을 선택
  - `target` (`sandbox` | `host` | `node`): 브라우저가 어디에 있는지 선택
  - 샌드박스 세션에서 `target: "host"`를 사용하려면 `agents.defaults.sandbox.browser.allowHostControl=true`가 필요합니다.
  - `target`을 생략하면 샌드박스 세션은 기본적으로 `sandbox`, 비샌드박스 세션은 기본적으로 `host`를 사용합니다.
  - 브라우저 사용 가능 노드가 연결되어 있으면 `target="host"` 또는 `target="node"`로 고정하지 않는 한 도구가 자동으로 해당 노드로 라우팅될 수 있습니다.

이 방식은 에이전트를 결정적으로 유지하고 취약한 선택자를 피하게 합니다.

## 관련 항목

- [도구 개요](/ko/tools) — 사용 가능한 모든 에이전트 도구
- [샌드박싱](/ko/gateway/sandboxing) — 샌드박스 환경에서의 브라우저 제어
- [보안](/ko/gateway/security) — 브라우저 제어 위험 및 강화
