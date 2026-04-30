---
read_when:
    - 에이전트 제어 브라우저 자동화 추가
    - openclaw가 사용자의 Chrome을 방해하는 이유 디버깅
    - macOS 앱에서 브라우저 설정 + 수명 주기 구현하기
summary: 통합 브라우저 제어 서비스 + 동작 명령
title: 브라우저(OpenClaw 관리형)
x-i18n:
    generated_at: "2026-04-30T06:52:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: a8f0456505f4e1711626a539a0a0c48d67ca10d4788838eb53855bc83c766d2f
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw는 에이전트가 제어하는 **전용 Chrome/Brave/Edge/Chromium 프로필**을 실행할 수 있습니다.
이 프로필은 개인 브라우저와 격리되며 Gateway 내부의 작은 로컬
제어 서비스(local loopback 전용)를 통해 관리됩니다.

초보자 관점:

- 이를 **별도의 에이전트 전용 브라우저**라고 생각하면 됩니다.
- `openclaw` 프로필은 개인 브라우저 프로필을 **건드리지 않습니다**.
- 에이전트는 안전한 경로에서 **탭을 열고, 페이지를 읽고, 클릭하고, 입력**할 수 있습니다.
- 기본 제공 `user` 프로필은 Chrome MCP를 통해 실제 로그인된 Chrome 세션에 연결됩니다.

## 제공되는 기능

- **openclaw**라는 별도 브라우저 프로필(기본적으로 주황색 강조색).
- 결정적 탭 제어(list/open/focus/close).
- 에이전트 동작(click/type/drag/select), 스냅샷, 스크린샷, PDF.
- 브라우저
  Plugin이 활성화되어 있을 때 에이전트에게 스냅샷,
  안정적 탭, 오래된 참조, 수동 차단 요소 복구 루프를 알려주는 기본 제공 `browser-automation` skill.
- 선택적 다중 프로필 지원(`openclaw`, `work`, `remote`, ...).

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

“Browser disabled”가 표시되면 설정에서 활성화하고(아래 참조)
Gateway를 다시 시작하세요.

`openclaw browser`가 완전히 없거나 에이전트가 브라우저 도구를
사용할 수 없다고 말하면 [브라우저 명령 또는 도구 누락](/ko/tools/browser#missing-browser-command-or-tool)으로 이동하세요.

## Plugin 제어

기본 `browser` 도구는 번들 Plugin입니다. 동일한 `browser` 도구 이름을 등록하는 다른 Plugin으로 대체하려면 비활성화하세요.

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

기본값에는 `plugins.entries.browser.enabled` **및** `browser.enabled=true`가 모두 필요합니다. Plugin만 비활성화하면 `openclaw browser` CLI, `browser.request` gateway 메서드, 에이전트 도구, 제어 서비스가 하나의 단위로 제거됩니다. `browser.*` 설정은 대체 항목을 위해 그대로 유지됩니다.

브라우저 설정 변경은 Plugin이 서비스를 다시 등록할 수 있도록 Gateway 재시작이 필요합니다.

## 에이전트 지침

도구 프로필 참고: `tools.profile: "coding"`에는 `web_search`와
`web_fetch`가 포함되지만 전체 `browser` 도구는 포함되지 않습니다. 에이전트 또는
생성된 하위 에이전트가 브라우저 자동화를 사용해야 한다면 프로필
단계에서 브라우저를 추가하세요.

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

단일 에이전트의 경우 `agents.list[].tools.alsoAllow: ["browser"]`를 사용하세요.
`tools.subagents.tools.allow: ["browser"]`만으로는 충분하지 않습니다. 하위 에이전트
정책은 프로필 필터링 후에 적용되기 때문입니다.

브라우저 Plugin은 두 수준의 에이전트 지침을 제공합니다.

- `browser` 도구 설명에는 간결한 상시 계약이 포함됩니다. 올바른
  프로필 선택, 동일한 탭의 참조 유지, 탭 대상 지정을 위한 `tabId`/라벨 사용,
  다단계 작업을 위한 브라우저 skill 로드.
- 기본 제공 `browser-automation` skill에는 더 긴 운영 루프가 포함됩니다.
  먼저 상태/탭 확인, 작업 탭 라벨 지정, 동작 전 스냅샷, UI 변경 후 재스냅샷,
  오래된 참조 한 번 복구, 로그인/2FA/captcha 또는
  카메라/마이크 차단 요소를 추측하지 않고 수동 조치로 보고.

Plugin 번들 skills는 Plugin이 활성화되어 있을 때 에이전트의 사용 가능한 skills에
나열됩니다. 전체 skill 지침은 필요할 때 로드되므로 일상적인
턴에서는 전체 토큰 비용을 지불하지 않습니다.

## 브라우저 명령 또는 도구 누락

업그레이드 후 `openclaw browser`를 알 수 없거나, `browser.request`가 없거나, 에이전트가 브라우저 도구를 사용할 수 없다고 보고하는 경우, 일반적인 원인은 `plugins.allow` 목록에 `browser`가 빠져 있고 루트 `browser` 설정 블록이 없는 것입니다. 다음을 추가하세요.

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

예를 들어 `browser.enabled=true` 또는 `browser.profiles.<name>` 같은 명시적 루트 `browser` 블록은 제한적인 `plugins.allow` 아래에서도 번들 브라우저 Plugin을 활성화하며, 이는 채널 설정 동작과 일치합니다. `plugins.entries.browser.enabled=true`와 `tools.alsoAllow: ["browser"]`는 그 자체로 허용 목록 멤버십을 대체하지 않습니다. `plugins.allow`를 완전히 제거해도 기본값이 복원됩니다.

## 프로필: `openclaw` 대 `user`

- `openclaw`: 관리형, 격리된 브라우저(확장 프로그램 필요 없음).
- `user`: **실제 로그인된 Chrome**
  세션용 기본 제공 Chrome MCP 연결 프로필.

에이전트 브라우저 도구 호출의 경우:

- 기본값: 격리된 `openclaw` 브라우저를 사용합니다.
- 기존 로그인 세션이 중요하고 사용자가 컴퓨터 앞에서 연결 프롬프트를
  클릭/승인할 수 있을 때는 `profile="user"`를 선호하세요.
- 특정 브라우저 모드를 원할 때 `profile`이 명시적 재정의입니다.

관리형 모드를 기본값으로 사용하려면 `browser.defaultProfile: "openclaw"`를 설정하세요.

## 설정

브라우저 설정은 `~/.openclaw/openclaw.json`에 있습니다.

```json5
{
  browser: {
    enabled: true, // default: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // legacy single-profile override
    remoteCdpTimeoutMs: 1500, // remote CDP HTTP timeout (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // remote CDP WebSocket handshake timeout (ms)
    localLaunchTimeoutMs: 15000, // local managed Chrome discovery timeout (ms)
    localCdpReadyTimeoutMs: 8000, // local managed post-launch CDP readiness timeout (ms)
    actionTimeoutMs: 60000, // default browser act timeout (ms)
    tabCleanup: {
      enabled: true, // default: true
      idleMinutes: 120, // set 0 to disable idle cleanup
      maxTabsPerSession: 8, // set 0 to disable the per-session cap
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

- 제어 서비스는 `gateway.port`에서 파생된 포트의 loopback에 바인딩됩니다(기본값 `18791` = gateway + 2). `gateway.port` 또는 `OPENCLAW_GATEWAY_PORT`를 재정의하면 파생 포트가 같은 계열에서 함께 이동합니다.
- 로컬 `openclaw` 프로필은 `cdpPort`/`cdpUrl`을 자동 할당합니다. 원격 CDP에만 이를 설정하세요. `cdpUrl`은 설정되지 않은 경우 관리형 로컬 CDP 포트로 기본 설정됩니다.
- `remoteCdpTimeoutMs`는 원격 및 `attachOnly` CDP HTTP 도달 가능성
  확인과 탭 열기 HTTP 요청에 적용됩니다. `remoteCdpHandshakeTimeoutMs`는
  해당 CDP WebSocket 핸드셰이크에 적용됩니다.
- `localLaunchTimeoutMs`는 로컬에서 실행된 관리형 Chrome
  프로세스가 CDP HTTP 엔드포인트를 노출하기 위한 예산입니다. `localCdpReadyTimeoutMs`는
  프로세스가 발견된 후 CDP websocket 준비 상태를 위한
  후속 예산입니다.
  Chromium이 느리게 시작되는 Raspberry Pi, 저사양 VPS 또는 오래된 하드웨어에서는 이 값을 높이세요. 값은 `120000`ms 이하의 양의 정수여야 하며, 잘못된
  설정 값은 거부됩니다.
- 반복되는 관리형 Chrome 실행/준비 실패는 프로필별로 회로 차단됩니다.
  여러 번 연속 실패한 후 OpenClaw는 모든 브라우저 도구 호출마다 Chromium을 생성하는 대신 새 실행
  시도를 잠시 일시 중지합니다. 시작 문제를 해결하거나, 브라우저가 필요하지 않으면 비활성화하거나,
  복구 후 Gateway를 다시 시작하세요.
- `actionTimeoutMs`는 호출자가 `timeoutMs`를 전달하지 않을 때 브라우저 `act` 요청의 기본 예산입니다. 클라이언트 전송은 작은 여유 창을 추가해 긴 대기가 HTTP 경계에서 시간 초과되지 않고 완료될 수 있게 합니다.
- `tabCleanup`은 기본 에이전트 브라우저 세션이 연 탭을 위한 최선 노력 정리입니다. 하위 에이전트, Cron, ACP 수명 주기 정리는 여전히 세션 종료 시 명시적으로 추적된 탭을 닫습니다. 기본 세션은 활성 탭을 재사용 가능하게 유지한 다음, 유휴 상태이거나 초과된 추적 탭을 백그라운드에서 닫습니다.

</Accordion>

<Accordion title="SSRF 정책">

- 브라우저 탐색과 탭 열기는 탐색 전에 SSRF 보호를 적용하고 이후 최종 `http(s)` URL에서 최선 노력으로 다시 확인합니다.
- 엄격한 SSRF 모드에서는 원격 CDP 엔드포인트 검색과 `/json/version` 프로브(`cdpUrl`)도 확인됩니다.
- Gateway/제공자 `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, `NO_PROXY` 환경 변수는 OpenClaw 관리형 브라우저를 자동으로 프록시하지 않습니다. 관리형 Chrome은 기본적으로 직접 실행되므로 제공자 프록시 설정이 브라우저 SSRF 검사를 약화하지 않습니다.
- 관리형 브라우저 자체를 프록시하려면 `--proxy-server=...` 또는 `--proxy-pac-url=...` 같은 명시적 Chrome 프록시 플래그를 `browser.extraArgs`를 통해 전달하세요. 엄격한 SSRF 모드는 private-network 브라우저 접근이 의도적으로 활성화되지 않는 한 명시적 브라우저 프록시 라우팅을 차단합니다.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`는 기본적으로 꺼져 있습니다. private-network 브라우저 접근을 의도적으로 신뢰할 때만 활성화하세요.
- `browser.ssrfPolicy.allowPrivateNetwork`는 레거시 별칭으로 계속 지원됩니다.

</Accordion>

<Accordion title="프로필 동작">

- `attachOnly: true`는 로컬 브라우저를 절대 실행하지 않고, 이미 실행 중인 경우에만 연결한다는 뜻입니다.
- `headless`는 전역 또는 로컬 관리 프로필별로 설정할 수 있습니다. 프로필별 값은 `browser.headless`를 재정의하므로, 로컬에서 실행된 한 프로필은 헤드리스로 유지하고 다른 프로필은 계속 보이게 둘 수 있습니다.
- `POST /start?headless=true`와 `openclaw browser start --headless`는
  `browser.headless` 또는 프로필 구성을 다시 쓰지 않고 로컬 관리 프로필에 대해
  일회성 헤드리스 실행을 요청합니다. 기존 세션, attach-only, 원격 CDP
  프로필은 OpenClaw가 해당 브라우저 프로세스를 실행하지 않으므로 재정의를
  거부합니다.
- `DISPLAY` 또는 `WAYLAND_DISPLAY`가 없는 Linux 호스트에서는 환경이나 프로필/전역
  구성이 명시적으로 headed 모드를 선택하지 않은 경우 로컬 관리 프로필이
  자동으로 헤드리스로 기본 설정됩니다. `openclaw browser status --json`은
  `headlessSource`를 `env`, `profile`, `config`,
  `request`, `linux-display-fallback` 또는 `default`로 보고합니다.
- `OPENCLAW_BROWSER_HEADLESS=1`은 현재 프로세스의 로컬 관리 실행을 헤드리스로
  강제합니다. `OPENCLAW_BROWSER_HEADLESS=0`은 일반 시작에 대해 headed 모드를
  강제하고, 디스플레이 서버가 없는 Linux 호스트에서는 실행 가능한 오류를
  반환합니다. 명시적인 `start --headless` 요청은 그 한 번의 실행에 대해서는
  여전히 우선합니다.
- `executablePath`는 전역 또는 로컬 관리 프로필별로 설정할 수 있습니다. 프로필별 값은 `browser.executablePath`를 재정의하므로, 서로 다른 관리 프로필이 서로 다른 Chromium 기반 브라우저를 실행할 수 있습니다. 두 형식 모두 OS 홈 디렉터리에 대해 `~`를 허용합니다.
- `color`(최상위 및 프로필별)는 브라우저 UI에 색조를 입혀 어떤 프로필이 활성 상태인지 볼 수 있게 합니다.
- 기본 프로필은 `openclaw`(관리형 독립 실행)입니다. 로그인된 사용자 브라우저를 사용하려면 `defaultProfile: "user"`를 사용하세요.
- 자동 감지 순서: Chromium 기반인 경우 시스템 기본 브라우저, 그렇지 않으면 Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"`은 원시 CDP 대신 Chrome DevTools MCP를 사용합니다. 해당 드라이버에는 `cdpUrl`을 설정하지 마세요.
- existing-session 프로필이 기본값이 아닌 Chromium 사용자 프로필(Brave, Edge 등)에 연결해야 하는 경우 `browser.profiles.<name>.userDataDir`를 설정하세요. 이 경로도 OS 홈 디렉터리에 대해 `~`를 허용합니다.

</Accordion>

</AccordionGroup>

## Brave 또는 다른 Chromium 기반 브라우저 사용

**시스템 기본** 브라우저가 Chromium 기반(Chrome/Brave/Edge 등)이면
OpenClaw가 자동으로 사용합니다. 자동 감지를 재정의하려면 `browser.executablePath`를
설정하세요. 최상위 및 프로필별 `executablePath` 값은 OS 홈 디렉터리에 대해 `~`를
허용합니다.

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

또는 플랫폼별로 구성에서 설정하세요.

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

프로필별 `executablePath`는 OpenClaw가 실행하는 로컬 관리 프로필에만 영향을
줍니다. `existing-session` 프로필은 대신 이미 실행 중인 브라우저에 연결하고,
원격 CDP 프로필은 `cdpUrl` 뒤의 브라우저를 사용합니다.

## 로컬 제어와 원격 제어

- **로컬 제어(기본값):** Gateway가 loopback 제어 서비스를 시작하고 로컬 브라우저를 실행할 수 있습니다.
- **원격 제어(Node 호스트):** 브라우저가 있는 머신에서 Node 호스트를 실행합니다. Gateway는 브라우저 동작을 해당 호스트로 프록시합니다.
- **원격 CDP:** 원격 Chromium 기반 브라우저에 연결하려면
  `browser.profiles.<name>.cdpUrl`(또는 `browser.cdpUrl`)을 설정하세요.
  이 경우 OpenClaw는 로컬 브라우저를 실행하지 않습니다.
- loopback의 외부 관리 CDP 서비스(예: Docker에서 `127.0.0.1`로 게시된
  Browserless)의 경우 `attachOnly: true`도 설정하세요. `attachOnly` 없는
  loopback CDP는 로컬 OpenClaw 관리 브라우저 프로필로 취급됩니다.
- `headless`는 OpenClaw가 실행하는 로컬 관리 프로필에만 영향을 줍니다. 기존 세션 또는 원격 CDP 브라우저를 다시 시작하거나 변경하지 않습니다.
- `executablePath`도 동일한 로컬 관리 프로필 규칙을 따릅니다. 실행 중인 로컬
  관리 프로필에서 이를 변경하면 해당 프로필이 재시작/조정 대상으로 표시되어
  다음 실행에서 새 바이너리를 사용합니다.

중지 동작은 프로필 모드에 따라 다릅니다.

- 로컬 관리 프로필: `openclaw browser stop`은 OpenClaw가 실행한 브라우저
  프로세스를 중지합니다.
- attach-only 및 원격 CDP 프로필: OpenClaw가 브라우저 프로세스를 실행하지
  않았더라도 `openclaw browser stop`은 활성 제어 세션을 닫고
  Playwright/CDP 에뮬레이션 재정의(뷰포트, 색 구성표, 로케일, 시간대,
  오프라인 모드 및 유사한 상태)를 해제합니다.

원격 CDP URL에는 인증이 포함될 수 있습니다.

- 쿼리 토큰(예: `https://provider.example?token=<token>`)
- HTTP 기본 인증(예: `https://user:pass@provider.example`)

OpenClaw는 `/json/*` 엔드포인트를 호출할 때와 CDP WebSocket에 연결할 때
인증을 보존합니다. 토큰은 구성 파일에 커밋하지 말고 환경 변수 또는 시크릿
관리자를 사용하는 것이 좋습니다.

## Node 브라우저 프록시(무구성 기본값)

브라우저가 있는 머신에서 **Node 호스트**를 실행하면 OpenClaw가 추가 브라우저
구성 없이 브라우저 도구 호출을 해당 Node로 자동 라우팅할 수 있습니다.
이는 원격 Gateway의 기본 경로입니다.

참고:

- Node 호스트는 **프록시 명령**을 통해 로컬 브라우저 제어 서버를 노출합니다.
- 프로필은 Node 자체의 `browser.profiles` 구성에서 가져옵니다(로컬과 동일).
- `nodeHost.browserProxy.allowProfiles`는 선택 사항입니다. 레거시/기본 동작을 사용하려면 비워 두세요. 구성된 모든 프로필은 프로필 생성/삭제 경로를 포함해 프록시를 통해 계속 접근할 수 있습니다.
- `nodeHost.browserProxy.allowProfiles`를 설정하면 OpenClaw는 이를 최소 권한 경계로 취급합니다. 허용 목록에 있는 프로필만 대상으로 지정할 수 있으며, 영구 프로필 생성/삭제 경로는 프록시 표면에서 차단됩니다.
- 원하지 않으면 비활성화하세요.
  - Node에서: `nodeHost.browserProxy.enabled=false`
  - Gateway에서: `gateway.nodes.browser.mode="off"`

## Browserless(호스팅 원격 CDP)

[Browserless](https://browserless.io)는 HTTPS 및 WebSocket을 통해 CDP 연결 URL을
노출하는 호스팅 Chromium 서비스입니다. OpenClaw는 두 형식을 모두 사용할 수
있지만, 원격 브라우저 프로필의 가장 간단한 옵션은 Browserless 연결 문서의
직접 WebSocket URL입니다.

예:

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
- Browserless 계정과 일치하는 리전 엔드포인트를 선택하세요(해당 문서 참조).
- Browserless가 HTTPS 기본 URL을 제공하는 경우 직접 CDP 연결을 위해
  `wss://`로 변환하거나, HTTPS URL을 유지하고 OpenClaw가 `/json/version`을
  발견하도록 할 수 있습니다.

### 같은 호스트의 Browserless Docker

Browserless를 Docker에서 자체 호스팅하고 OpenClaw가 호스트에서 실행되는 경우
Browserless를 외부 관리 CDP 서비스로 취급하세요.

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

`browser.profiles.browserless.cdpUrl`의 주소는 OpenClaw 프로세스에서 도달할 수
있어야 합니다. Browserless도 일치하는 도달 가능한 엔드포인트를 알려야 합니다.
Browserless `EXTERNAL`을 `ws://127.0.0.1:3000`, `ws://browserless:3000` 또는
안정적인 비공개 Docker 네트워크 주소처럼 OpenClaw에서 접근 가능한 동일한
공개 WebSocket 기반 주소로 설정하세요. `/json/version`이 OpenClaw가 도달할 수
없는 주소를 가리키는 `webSocketDebuggerUrl`을 반환하면, CDP HTTP는 정상처럼
보여도 WebSocket 연결은 여전히 실패할 수 있습니다.

loopback Browserless 프로필에 `attachOnly`를 설정하지 않은 상태로 두지 마세요.
`attachOnly`가 없으면 OpenClaw는 loopback 포트를 로컬 관리 브라우저 프로필로
취급하며, 포트가 사용 중이지만 OpenClaw가 소유하지 않았다고 보고할 수 있습니다.

## 직접 WebSocket CDP 제공자

일부 호스팅 브라우저 서비스는 표준 HTTP 기반 CDP 탐색(`/json/version`)이 아닌
**직접 WebSocket** 엔드포인트를 노출합니다. OpenClaw는 세 가지 CDP URL 형태를
허용하고 올바른 연결 전략을 자동으로 선택합니다.

- **HTTP(S) 탐색** — `http://host[:port]` 또는 `https://host[:port]`.
  OpenClaw는 `/json/version`을 호출해 WebSocket 디버거 URL을 찾은 뒤
  연결합니다. WebSocket 폴백은 없습니다.
- **직접 WebSocket 엔드포인트** — `ws://host[:port]/devtools/<kind>/<id>` 또는
  `/devtools/browser|page|worker|shared_worker|service_worker/<id>` 경로가 있는
  `wss://...`. OpenClaw는 WebSocket 핸드셰이크를 통해 직접 연결하고
  `/json/version`을 완전히 건너뜁니다.
- **기본 WebSocket 루트** — `/devtools/...` 경로가 없는
  `ws://host[:port]` 또는 `wss://host[:port]`(예: [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw는 먼저 HTTP
  `/json/version` 탐색을 시도합니다(스킴을 `http`/`https`로 정규화).
  탐색이 `webSocketDebuggerUrl`을 반환하면 이를 사용하고, 그렇지 않으면 OpenClaw는
  기본 루트에서 직접 WebSocket 핸드셰이크로 폴백합니다. 알려진 WebSocket
  엔드포인트가 CDP 핸드셰이크를 거부하지만 구성된 기본 루트가 이를 허용하면
  OpenClaw는 해당 루트로도 폴백합니다. 이렇게 하면 로컬 Chrome을 가리키는 기본
  `ws://`도 계속 연결될 수 있습니다. Chrome은 `/json/version`의 특정 대상별
  경로에서만 WebSocket 업그레이드를 허용하는 반면, 호스팅 제공자는 탐색
  엔드포인트가 Playwright CDP에 적합하지 않은 단기 URL을 알리는 경우에도 루트
  WebSocket 엔드포인트를 계속 사용할 수 있기 때문입니다.

### Browserbase

[Browserbase](https://www.browserbase.com)는 내장 CAPTCHA 해결, 스텔스 모드,
주거용 프록시가 포함된 헤드리스 브라우저 실행용 클라우드 플랫폼입니다.

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

- [가입](https://www.browserbase.com/sign-up)하고 [개요 대시보드](https://www.browserbase.com/overview)에서
  **API Key**를 복사하세요.
- `<BROWSERBASE_API_KEY>`를 실제 Browserbase API 키로 바꾸세요.
- Browserbase는 WebSocket 연결 시 브라우저 세션을 자동으로 생성하므로
  수동 세션 생성 단계가 필요하지 않습니다.
- 무료 티어는 동시 세션 1개와 월별 브라우저 1시간을 허용합니다.
  유료 플랜 제한은 [가격](https://www.browserbase.com/pricing)을 참조하세요.
- 전체 API 참조, SDK 가이드 및 통합 예제는 [Browserbase 문서](https://docs.browserbase.com)를
  참조하세요.

## 보안

핵심 개념:

- 브라우저 제어는 루프백 전용입니다. 액세스 흐름은 Gateway의 인증 또는 Node 페어링을 통합니다.
- 독립형 루프백 브라우저 HTTP API는 **공유 비밀 인증만** 사용합니다:
  Gateway 토큰 베어러 인증, `x-openclaw-password`, 또는 구성된 Gateway 비밀번호를
  사용하는 HTTP Basic 인증입니다.
- Tailscale Serve ID 헤더와 `gateway.auth.mode: "trusted-proxy"`는
  이 독립형 루프백 브라우저 API를 **인증하지 않습니다**.
- 브라우저 제어가 활성화되어 있고 공유 비밀 인증이 구성되어 있지 않으면 OpenClaw는
  시작 시 `gateway.auth.token`을 자동 생성하고 구성에 유지합니다.
- `gateway.auth.mode`가 이미 `password`, `none` 또는 `trusted-proxy`인 경우
  OpenClaw는 해당 토큰을 자동 생성하지 **않습니다**.
- Gateway와 모든 Node 호스트를 비공개 네트워크(Tailscale)에 유지하고 공개 노출을 피하세요.
- 원격 CDP URL/토큰을 비밀 정보로 취급하세요. env vars 또는 시크릿 관리자를 선호하세요.

원격 CDP 팁:

- 가능한 경우 암호화된 엔드포인트(HTTPS 또는 WSS)와 수명이 짧은 토큰을 선호하세요.
- 수명이 긴 토큰을 구성 파일에 직접 포함하지 마세요.

## 프로필(다중 브라우저)

OpenClaw는 이름이 지정된 여러 프로필(라우팅 구성)을 지원합니다. 프로필은 다음일 수 있습니다:

- **openclaw-managed**: 자체 사용자 데이터 디렉터리와 CDP 포트가 있는 전용 Chromium 기반 브라우저 인스턴스
- **remote**: 명시적 CDP URL(다른 곳에서 실행 중인 Chromium 기반 브라우저)
- **existing session**: Chrome DevTools MCP 자동 연결을 통한 기존 Chrome 프로필

기본값:

- `openclaw` 프로필이 없으면 자동 생성됩니다.
- `user` 프로필은 Chrome MCP 기존 세션 연결용으로 기본 제공됩니다.
- 기존 세션 프로필은 `user` 외에는 옵트인입니다. `--driver existing-session`으로 생성하세요.
- 로컬 CDP 포트는 기본적으로 **18800-18899**에서 할당됩니다.
- 프로필을 삭제하면 해당 로컬 데이터 디렉터리가 휴지통으로 이동됩니다.

모든 제어 엔드포인트는 `?profile=<name>`을 허용하며, CLI는 `--browser-profile`을 사용합니다.

## Chrome DevTools MCP를 통한 기존 세션

OpenClaw는 공식 Chrome DevTools MCP 서버를 통해 실행 중인 Chromium 기반 브라우저 프로필에도
연결할 수 있습니다. 이렇게 하면 해당 브라우저 프로필에 이미 열려 있는 탭과 로그인 상태를
재사용합니다.

공식 배경 및 설정 참고 자료:

- [Chrome for Developers: Chrome DevTools MCP를 브라우저 세션과 함께 사용](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

기본 제공 프로필:

- `user`

선택 사항: 다른 이름, 색상 또는 브라우저 데이터 디렉터리를 원하면
사용자 지정 기존 세션 프로필을 생성하세요.

기본 동작:

- 기본 제공 `user` 프로필은 Chrome MCP 자동 연결을 사용하며, 이는
  기본 로컬 Google Chrome 프로필을 대상으로 합니다.

Brave, Edge, Chromium 또는 기본값이 아닌 Chrome 프로필에는 `userDataDir`를 사용하세요.
`~`는 OS 홈 디렉터리로 확장됩니다:

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

그런 다음 일치하는 브라우저에서:

1. 원격 디버깅용 브라우저 검사 페이지를 엽니다.
2. 원격 디버깅을 활성화합니다.
3. 브라우저를 계속 실행하고 OpenClaw가 연결할 때 연결 프롬프트를 승인합니다.

일반적인 검사 페이지:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

실시간 연결 스모크 테스트:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

성공 시 모습:

- `status`에 `driver: existing-session`이 표시됩니다
- `status`에 `transport: chrome-mcp`가 표시됩니다
- `status`에 `running: true`가 표시됩니다
- `tabs`가 이미 열려 있는 브라우저 탭을 나열합니다
- `snapshot`이 선택된 실시간 탭의 참조를 반환합니다

연결이 작동하지 않을 때 확인할 사항:

- 대상 Chromium 기반 브라우저 버전이 `144+`인지
- 해당 브라우저의 검사 페이지에서 원격 디버깅이 활성화되어 있는지
- 브라우저가 연결 동의 프롬프트를 표시했고 사용자가 이를 수락했는지
- `openclaw doctor`는 이전 확장 기반 브라우저 구성을 마이그레이션하고
  기본 자동 연결 프로필용 Chrome이 로컬에 설치되어 있는지 확인하지만,
  브라우저 측 원격 디버깅을 대신 활성화할 수는 없습니다

에이전트 사용:

- 사용자의 로그인된 브라우저 상태가 필요할 때 `profile="user"`를 사용하세요.
- 사용자 지정 기존 세션 프로필을 사용하는 경우 해당 명시적 프로필 이름을 전달하세요.
- 사용자가 컴퓨터 앞에서 연결 프롬프트를 승인할 수 있을 때만 이 모드를 선택하세요.
- Gateway 또는 Node 호스트가 `npx chrome-devtools-mcp@latest --autoConnect`를 생성할 수 있습니다

참고:

- 이 경로는 로그인된 브라우저 세션 내부에서 동작할 수 있으므로 격리된 `openclaw` 프로필보다 위험이 더 높습니다.
- OpenClaw는 이 드라이버에 대해 브라우저를 실행하지 않고 연결만 합니다.
- OpenClaw는 여기서 공식 Chrome DevTools MCP `--autoConnect` 흐름을 사용합니다. `userDataDir`가 설정된 경우 해당 사용자 데이터 디렉터리를 대상으로 전달됩니다.
- 기존 세션은 선택된 호스트 또는 연결된 브라우저 Node를 통해 연결할 수 있습니다. Chrome이 다른 곳에 있고 연결된 브라우저 Node가 없으면 원격 CDP 또는 Node 호스트를 대신 사용하세요.

### 사용자 지정 Chrome MCP 실행

기본 `npx chrome-devtools-mcp@latest` 흐름이 원하는 방식이 아닐 때(오프라인 호스트,
고정 버전, 벤더링된 바이너리) 프로필별로 생성되는 Chrome DevTools MCP 서버를 재정의하세요:

| 필드         | 수행하는 작업                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | `npx` 대신 생성할 실행 파일입니다. 있는 그대로 해석되며 절대 경로가 존중됩니다.                                          |
| `mcpArgs`    | `mcpCommand`에 그대로 전달되는 인수 배열입니다. 기본 `chrome-devtools-mcp@latest --autoConnect` 인수를 대체합니다. |

기존 세션 프로필에 `cdpUrl`이 설정되면 OpenClaw는
`--autoConnect`를 건너뛰고 엔드포인트를 Chrome MCP에 자동으로 전달합니다:

- `http(s)://...` → `--browserUrl <url>` (DevTools HTTP 검색 엔드포인트).
- `ws(s)://...` → `--wsEndpoint <url>` (직접 CDP WebSocket).

엔드포인트 플래그와 `userDataDir`는 함께 사용할 수 없습니다. `cdpUrl`이 설정되면
Chrome MCP가 프로필 디렉터리를 여는 대신 엔드포인트 뒤의 실행 중인 브라우저에 연결하므로
Chrome MCP 실행에서 `userDataDir`가 무시됩니다.

<Accordion title="기존 세션 기능 제한">

관리형 `openclaw` 프로필과 비교하면 기존 세션 드라이버는 더 제한적입니다:

- **스크린샷** — 페이지 캡처와 `--ref` 요소 캡처는 작동하지만 CSS `--element` 셀렉터는 작동하지 않습니다. `--full-page`는 `--ref` 또는 `--element`와 함께 사용할 수 없습니다. 페이지 또는 참조 기반 요소 스크린샷에는 Playwright가 필요하지 않습니다.
- **작업** — `click`, `type`, `hover`, `scrollIntoView`, `drag`, `select`에는 스냅샷 참조가 필요합니다(CSS 셀렉터 없음). `click-coords`는 보이는 뷰포트 좌표를 클릭하며 스냅샷 참조가 필요하지 않습니다. `click`은 왼쪽 버튼만 지원합니다. `type`은 `slowly=true`를 지원하지 않습니다. `fill` 또는 `press`를 사용하세요. `press`는 `delayMs`를 지원하지 않습니다. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill`, `evaluate`는 호출별 타임아웃을 지원하지 않습니다. `select`는 단일 값을 허용합니다.
- **대기 / 업로드 / 대화상자** — `wait --url`은 정확한 일치, 부분 문자열, glob 패턴을 지원합니다. `wait --load networkidle`은 지원되지 않습니다. 업로드 훅에는 `ref` 또는 `inputRef`가 필요하며, 한 번에 파일 하나만 가능하고 CSS `element`는 사용할 수 없습니다. 대화상자 훅은 타임아웃 재정의를 지원하지 않습니다.
- **관리형 전용 기능** — 배치 작업, PDF 내보내기, 다운로드 가로채기, `responsebody`는 여전히 관리형 브라우저 경로가 필요합니다.

</Accordion>

## 격리 보장

- **전용 사용자 데이터 디렉터리**: 개인 브라우저 프로필을 절대 건드리지 않습니다.
- **전용 포트**: 개발 워크플로와의 충돌을 방지하기 위해 `9222`를 피합니다.
- **결정적 탭 제어**: `tabs`는 먼저 `suggestedTargetId`를 반환한 다음
  `t1` 같은 안정적인 `tabId` 핸들, 선택적 레이블, 원시 `targetId`를 반환합니다.
  에이전트는 `suggestedTargetId`를 재사용해야 합니다. 원시 ID는
  디버깅 및 호환성을 위해 계속 사용할 수 있습니다.

## 브라우저 선택

로컬에서 실행할 때 OpenClaw는 사용 가능한 첫 번째 항목을 선택합니다:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

`browser.executablePath`로 재정의할 수 있습니다.

플랫폼:

- macOS: `/Applications`와 `~/Applications`를 확인합니다.
- Linux: `/usr/bin`, `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium`,
  `/usr/lib/chromium-browser` 아래의 일반적인 Chrome/Brave/Edge/Chromium 위치를 확인합니다.
- Windows: 일반적인 설치 위치를 확인합니다.

## 제어 API(선택 사항)

스크립팅과 디버깅을 위해 Gateway는 작은 **루프백 전용 HTTP
제어 API**와 이에 대응하는 `openclaw browser` CLI(스냅샷, 참조, 대기
파워업, JSON 출력, 디버그 워크플로)를 노출합니다. 전체 참조는
[브라우저 제어 API](/ko/tools/browser-control)를 참조하세요.

## 문제 해결

Linux 관련 문제(특히 snap Chromium)는
[브라우저 문제 해결](/ko/tools/browser-linux-troubleshooting)을 참조하세요.

WSL2 Gateway + Windows Chrome 분리 호스트 설정은
[WSL2 + Windows + 원격 Chrome CDP 문제 해결](/ko/tools/browser-wsl2-windows-remote-cdp-troubleshooting)을 참조하세요.

### CDP 시작 실패와 탐색 SSRF 차단

이는 서로 다른 실패 유형이며 서로 다른 코드 경로를 가리킵니다.

- **CDP 시작 또는 준비 실패**는 OpenClaw가 브라우저 제어 평면이 정상인지 확인할 수 없다는 뜻입니다.
- **탐색 SSRF 차단**은 브라우저 제어 평면은 정상이나 페이지 탐색 대상이 정책에 의해 거부되었다는 뜻입니다.

일반적인 예:

- CDP 시작 또는 준비 실패:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - 루프백 외부 CDP 서비스가 `attachOnly: true` 없이 구성된 경우
    `Port <port> is in use for profile "<name>" but not by openclaw`
- 탐색 SSRF 차단:
  - `start`와 `tabs`는 여전히 작동하지만 `open`, `navigate`, 스냅샷 또는 탭 열기 흐름이 브라우저/네트워크 정책 오류로 실패합니다

둘을 구분하려면 이 최소 시퀀스를 사용하세요:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

결과 읽는 방법:

- `start`가 `not reachable after start`로 실패하면 먼저 CDP 준비 상태를 문제 해결하세요.
- `start`는 성공하지만 `tabs`가 실패하면 제어 평면이 아직 비정상입니다. 이를 페이지 탐색 문제가 아니라 CDP 도달성 문제로 취급하세요.
- `start`와 `tabs`는 성공하지만 `open` 또는 `navigate`가 실패하면 브라우저 제어 평면은 실행 중이며 실패는 탐색 정책 또는 대상 페이지에 있습니다.
- `start`, `tabs`, `open`이 모두 성공하면 기본 관리형 브라우저 제어 경로가 정상입니다.

중요한 동작 세부 정보:

- `browser.ssrfPolicy`를 구성하지 않아도 브라우저 구성은 기본적으로 장애 시 차단하는 SSRF 정책 객체를 사용합니다.
- 로컬 루프백 `openclaw` 관리형 프로필의 경우 CDP 상태 확인은 OpenClaw 자체 로컬 제어 평면에 대한 브라우저 SSRF 도달성 적용을 의도적으로 건너뜁니다.
- 탐색 보호는 별개입니다. `start` 또는 `tabs` 결과가 성공했다고 해서 이후 `open` 또는 `navigate` 대상이 허용된다는 뜻은 아닙니다.

보안 지침:

- 기본적으로 브라우저 SSRF 정책을 완화하지 **마세요**.
- 광범위한 비공개 네트워크 액세스보다 `hostnameAllowlist` 또는 `allowedHostnames` 같은 좁은 호스트 예외를 선호하세요.
- `dangerouslyAllowPrivateNetwork: true`는 비공개 네트워크 브라우저 액세스가 필요하고 검토된 의도적으로 신뢰되는 환경에서만 사용하세요.

## 에이전트 도구 + 제어 작동 방식

에이전트는 브라우저 자동화를 위해 **하나의 도구**를 받습니다:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

매핑 방식:

- `browser snapshot`은 안정적인 UI 트리(AI 또는 ARIA)를 반환합니다.
- `browser act`는 스냅샷 `ref` ID를 사용해 클릭/입력/드래그/선택합니다.
- `browser screenshot`은 픽셀을 캡처합니다(전체 페이지, 요소 또는 라벨이 지정된 refs).
- `browser doctor`는 Gateway, Plugin, 프로필, 브라우저, 탭 준비 상태를 확인합니다.
- `browser`는 다음을 허용합니다.
  - `profile`: 이름이 지정된 브라우저 프로필(openclaw, chrome 또는 원격 CDP)을 선택합니다.
  - `target`(`sandbox` | `host` | `node`): 브라우저가 있는 위치를 선택합니다.
  - 샌드박스 세션에서 `target: "host"`를 사용하려면 `agents.defaults.sandbox.browser.allowHostControl=true`가 필요합니다.
  - `target`을 생략하면 샌드박스 세션은 기본값이 `sandbox`이고, 샌드박스가 아닌 세션은 기본값이 `host`입니다.
  - 브라우저를 지원하는 노드가 연결되어 있으면, `target="host"` 또는 `target="node"`로 고정하지 않는 한 도구가 자동으로 해당 노드로 라우팅할 수 있습니다.

이렇게 하면 에이전트가 결정적으로 동작하고 취약한 선택자를 피할 수 있습니다.

## 관련 항목

- [도구 개요](/ko/tools) — 사용 가능한 모든 에이전트 도구
- [샌드박싱](/ko/gateway/sandboxing) — 샌드박스 환경의 브라우저 제어
- [보안](/ko/gateway/security) — 브라우저 제어 위험 및 강화
