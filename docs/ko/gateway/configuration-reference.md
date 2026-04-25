---
read_when:
    - 정확한 필드 수준의 config 의미나 기본값이 필요합니다
    - 채널, 모델, gateway, 또는 도구 config 블록을 검증하고 있습니다
summary: 핵심 OpenClaw 키, 기본값, 그리고 전용 하위 시스템 참조로 연결되는 링크를 위한 Gateway config 참조
title: 구성 참조
x-i18n:
    generated_at: "2026-04-25T18:19:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b7e904455845a9559a0a8ed67b217597819f4a8abc38e6c8ecb69b6481528e8
    source_path: gateway/configuration-reference.md
    workflow: 15
---

`~/.openclaw/openclaw.json`용 핵심 config 참조입니다. 작업 중심 개요는 [Configuration](/ko/gateway/configuration)을 참고하세요.

주요 OpenClaw config 표면을 다루며, 하위 시스템에 자체적인 더 깊은 참조가 있는 경우 해당 링크로 연결합니다. 채널 및 플러그인 소유 명령 카탈로그와 심층 memory/QMD 조정 항목은 이 페이지가 아니라 각 전용 페이지에 있습니다.

코드 기준 진실:

- `openclaw config schema`는 검증과 Control UI에 사용되는 실제 JSON Schema를 출력하며, 사용 가능한 경우 번들/플러그인/채널 메타데이터가 병합됩니다
- `config.schema.lookup`은 드릴다운 도구용으로 경로 범위의 스키마 노드 하나를 반환합니다
- `pnpm config:docs:check` / `pnpm config:docs:gen`은 현재 스키마 표면에 대해 config-doc 기준 해시를 검증합니다

전용 심층 참조:

- `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations`, 그리고 `plugins.entries.memory-core.config.dreaming` 아래의 dreaming config는 [Memory configuration reference](/ko/reference/memory-config)
- 현재 내장 + 번들 명령 카탈로그는 [Slash commands](/ko/tools/slash-commands)
- 채널별 명령 표면은 해당 채널/플러그인 페이지

Config 형식은 **JSON5**입니다(주석 + 후행 쉼표 허용). 모든 필드는 선택 사항이며, 생략하면 OpenClaw가 안전한 기본값을 사용합니다.

---

## 채널

채널별 config 키는 전용 페이지로 이동했습니다. `channels.*`에 대해서는 [Configuration — channels](/ko/gateway/config-channels)를 참고하세요.

여기에는 Slack, Discord, Telegram, WhatsApp, Matrix, iMessage, 기타 번들 채널의 인증, 접근 제어, 다중 계정, 멘션 게이팅이 포함됩니다.

## Agent 기본값, 멀티 에이전트, 세션, 메시지

전용 페이지로 이동했습니다. 다음 항목은 [Configuration — agents](/ko/gateway/config-agents)를 참고하세요.

- `agents.defaults.*` (workspace, model, thinking, heartbeat, memory, media, skills, sandbox)
- `multiAgent.*` (멀티 에이전트 라우팅 및 바인딩)
- `session.*` (세션 수명 주기, Compaction, pruning)
- `messages.*` (메시지 전달, TTS, markdown 렌더링)
- `talk.*` (Talk 모드)
  - `talk.silenceTimeoutMs`: 설정되지 않으면 Talk는 전사를 전송하기 전에 플랫폼 기본 일시정지 시간을 유지합니다(`macOS와 Android에서는 700 ms, iOS에서는 900 ms`)

## 도구 및 커스텀 provider

도구 정책, 실험적 토글, provider 기반 도구 config, 커스텀 provider / base-URL 설정은 전용 페이지로 이동했습니다. [Configuration — tools and custom providers](/ko/gateway/config-tools)를 참고하세요.

## MCP

OpenClaw가 관리하는 MCP 서버 정의는 `mcp.servers` 아래에 있으며, 임베디드 Pi 및 기타 런타임 어댑터에서 사용됩니다. `openclaw mcp list`, `show`, `set`, `unset` 명령은 config 편집 중 대상 서버에 연결하지 않고 이 블록을 관리합니다.

```json5
{
  mcp: {
    // Optional. Default: 600000 ms (10 minutes). Set 0 to disable idle eviction.
    sessionIdleTtlMs: 600000,
    servers: {
      docs: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-fetch"],
      },
      remote: {
        url: "https://example.com/mcp",
        transport: "streamable-http", // streamable-http | sse
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
      },
    },
  },
}
```

- `mcp.servers`: 구성된 MCP 도구를 노출하는 런타임을 위한 이름 있는 stdio 또는 원격 MCP 서버 정의입니다.
- `mcp.sessionIdleTtlMs`: 세션 범위 번들 MCP 런타임의 유휴 TTL입니다. 일회성 임베디드 실행은 실행 종료 시 정리를 요청하며, 이 TTL은 장기 실행 세션과 향후 호출자에 대한 안전장치입니다.
- `mcp.*` 아래의 변경 사항은 캐시된 세션 MCP 런타임을 폐기하여 즉시 적용됩니다. 다음 도구 검색/사용 시 새 config로 다시 생성되므로 제거된 `mcp.servers` 항목은 유휴 TTL을 기다리지 않고 즉시 정리됩니다.

런타임 동작은 [MCP](/ko/cli/mcp#openclaw-as-an-mcp-client-registry) 및 [CLI backends](/ko/gateway/cli-backends#bundle-mcp-overlays)를 참고하세요.

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: 번들 Skills에만 적용되는 선택적 allowlist입니다(관리형/workspace Skills에는 영향 없음).
- `load.extraDirs`: 추가 공유 skill 루트입니다(가장 낮은 우선순위).
- `install.preferBrew`: `true`이면 `brew`를 사용할 수 있을 때 다른 설치 방식으로 대체하기 전에 Homebrew 설치 프로그램을 우선합니다.
- `install.nodeManager`: `metadata.openclaw.install` spec에 대한 Node 설치 관리자 기본 설정입니다(`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false`는 번들되었거나 설치된 경우에도 해당 skill을 비활성화합니다.
- `entries.<skillKey>.apiKey`: 기본 env var를 선언하는 skill을 위한 편의 필드입니다(평문 문자열 또는 SecretRef 객체).

---

## 플러그인

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-plugin"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions`, 그리고 `plugins.load.paths`에서 로드됩니다.
- 검색은 네이티브 OpenClaw 플러그인과 호환 Codex 번들 및 Claude 번들을 허용하며, 매니페스트가 없는 Claude 기본 레이아웃 번들도 포함됩니다.
- **Config 변경에는 gateway 재시작이 필요합니다.**
- `allow`: 선택적 allowlist입니다(목록에 있는 플러그인만 로드됨). `deny`가 우선합니다.
- `plugins.entries.<id>.apiKey`: 플러그인 수준 API 키 편의 필드입니다(플러그인이 지원하는 경우).
- `plugins.entries.<id>.env`: 플러그인 범위 env var 맵입니다.
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false`이면 core는 `before_prompt_build`를 차단하고, 레거시 `before_agent_start`의 프롬프트 변형 필드는 무시하되 레거시 `modelOverride`와 `providerOverride`는 유지합니다. 네이티브 플러그인 hook 및 지원되는 번들 제공 hook 디렉터리에 적용됩니다.
- `plugins.entries.<id>.hooks.allowConversationAccess`: `true`이면 신뢰된 번들 외 플러그인은 `llm_input`, `llm_output`, `agent_end` 같은 타입 지정 hook에서 원시 대화 콘텐츠를 읽을 수 있습니다.
- `plugins.entries.<id>.subagent.allowModelOverride`: 백그라운드 subagent 실행에 대해 이 플러그인이 실행별 `provider` 및 `model` override를 요청하도록 명시적으로 신뢰합니다.
- `plugins.entries.<id>.subagent.allowedModels`: 신뢰된 subagent override를 위한 표준 `provider/model` 대상의 선택적 allowlist입니다. 모든 모델을 허용하려는 의도가 명확한 경우에만 `"*"`를 사용하세요.
- `plugins.entries.<id>.config`: 플러그인이 정의한 config 객체입니다(가능한 경우 네이티브 OpenClaw 플러그인 스키마로 검증됨).
- 채널 플러그인 계정/런타임 설정은 `channels.<id>` 아래에 있으며, 중앙 OpenClaw 옵션 레지스트리가 아니라 해당 플러그인의 매니페스트 `channelConfigs` 메타데이터로 설명되어야 합니다.
- `plugins.entries.firecrawl.config.webFetch`: Firecrawl 웹 가져오기 provider 설정입니다.
  - `apiKey`: Firecrawl API 키입니다(SecretRef 허용). `plugins.entries.firecrawl.config.webSearch.apiKey`, 레거시 `tools.web.fetch.firecrawl.apiKey`, 또는 `FIRECRAWL_API_KEY` env var로 대체됩니다.
  - `baseUrl`: Firecrawl API 기본 URL입니다(기본값: `https://api.firecrawl.dev`).
  - `onlyMainContent`: 페이지에서 본문 콘텐츠만 추출합니다(기본값: `true`).
  - `maxAgeMs`: 최대 캐시 수명(밀리초)입니다(기본값: `172800000` / 2일).
  - `timeoutSeconds`: 스크레이프 요청 제한 시간(초)입니다(기본값: `60`).
- `plugins.entries.xai.config.xSearch`: xAI X Search(Grok 웹 검색) 설정입니다.
  - `enabled`: X Search provider를 활성화합니다.
  - `model`: 검색에 사용할 Grok 모델입니다(예: `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: memory Dreaming 설정입니다. 단계와 임곗값은 [Dreaming](/ko/concepts/dreaming)을 참고하세요.
  - `enabled`: Dreaming 마스터 스위치입니다(기본값 `false`).
  - `frequency`: 각 전체 Dreaming 스윕의 Cron 주기입니다(기본값 `"0 3 * * *"`).
  - 단계 정책과 임곗값은 구현 세부 사항이며 사용자 대상 config 키가 아닙니다.
- 전체 memory config는 [Memory configuration reference](/ko/reference/memory-config)에 있습니다.
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 활성화된 Claude 번들 플러그인은 `settings.json`에서 임베디드 Pi 기본값도 제공할 수 있으며, OpenClaw는 이를 원시 OpenClaw config 패치가 아니라 정제된 agent 설정으로 적용합니다.
- `plugins.slots.memory`: 활성 memory 플러그인 id를 선택하거나, memory 플러그인을 비활성화하려면 `"none"`을 지정합니다.
- `plugins.slots.contextEngine`: 활성 context engine 플러그인 id를 선택합니다. 다른 엔진을 설치하고 선택하지 않으면 기본값은 `"legacy"`입니다.
- `plugins.installs`: `openclaw plugins update`에서 사용하는 CLI 관리형 설치 메타데이터입니다.
  - `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`를 포함합니다.
  - `plugins.installs.*`는 관리형 상태로 취급하세요. 수동 편집보다 CLI 명령 사용을 권장합니다.

[Plugins](/ko/tools/plugin)를 참고하세요.

---

## 브라우저

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    tabCleanup: {
      enabled: true,
      idleMinutes: 120,
      maxTabsPerSession: 8,
      sweepMinutes: 5,
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false`는 `act:evaluate`와 `wait --fn`을 비활성화합니다.
- `tabCleanup`은 유휴 시간이 지난 후 또는 세션이 한도를 초과할 때 추적된 기본 agent 탭을 회수합니다. 개별 정리 모드를 비활성화하려면 `idleMinutes: 0` 또는 `maxTabsPerSession: 0`으로 설정하세요.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork`는 설정되지 않으면 비활성화되므로, 브라우저 탐색은 기본적으로 엄격하게 유지됩니다.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: true`는 사설 네트워크 브라우저 탐색을 의도적으로 신뢰하는 경우에만 설정하세요.
- 엄격 모드에서는 원격 CDP 프로필 엔드포인트(`profiles.*.cdpUrl`)도 도달 가능성/검색 검사 중 동일한 사설 네트워크 차단의 적용을 받습니다.
- `ssrfPolicy.allowPrivateNetwork`는 레거시 별칭으로 계속 지원됩니다.
- 엄격 모드에서는 명시적 예외를 위해 `ssrfPolicy.hostnameAllowlist`와 `ssrfPolicy.allowedHostnames`를 사용하세요.
- 원격 프로필은 attach-only입니다(시작/중지/재설정 비활성화).
- `profiles.*.cdpUrl`은 `http://`, `https://`, `ws://`, `wss://`를 허용합니다.
  OpenClaw가 `/json/version`을 검색하도록 하려면 HTTP(S)를 사용하세요. provider가 직접 DevTools WebSocket URL을 제공하는 경우에는 WS(S)를 사용하세요.
- `remoteCdpTimeoutMs`와 `remoteCdpHandshakeTimeoutMs`는 원격 및 `attachOnly` CDP 도달 가능성과 탭 열기 요청에 적용됩니다. 관리되는 loopback 프로필은 로컬 CDP 기본값을 유지합니다.
- 외부에서 관리되는 CDP 서비스가 loopback을 통해 도달 가능하다면 해당 프로필의 `attachOnly: true`를 설정하세요. 그렇지 않으면 OpenClaw는 loopback 포트를 로컬 관리형 브라우저 프로필로 간주하여 로컬 포트 소유 오류를 보고할 수 있습니다.
- `existing-session` 프로필은 CDP 대신 Chrome MCP를 사용하며, 선택한 호스트 또는 연결된 browser node를 통해 연결할 수 있습니다.
- `existing-session` 프로필은 Brave나 Edge 같은 특정 Chromium 기반 브라우저 프로필을 대상으로 하기 위해 `userDataDir`를 설정할 수 있습니다.
- `existing-session` 프로필은 현재 Chrome MCP 경로 제한을 유지합니다. 즉, CSS selector 대상 지정 대신 snapshot/ref 기반 작업, 단일 파일 업로드 hook, dialog timeout override 없음, `wait --load networkidle` 없음, 그리고 `responsebody`, PDF 내보내기, 다운로드 가로채기, 배치 작업이 없습니다.
- 로컬 관리형 `openclaw` 프로필은 `cdpPort`와 `cdpUrl`을 자동 할당합니다. 원격 CDP에만 `cdpUrl`을 명시적으로 설정하세요.
- 로컬 관리형 프로필은 해당 프로필에 대해 전역 `browser.executablePath`를 재정의하기 위해 `executablePath`를 설정할 수 있습니다. 이를 사용하면 한 프로필은 Chrome에서, 다른 프로필은 Brave에서 실행할 수 있습니다.
- 로컬 관리형 프로필은 프로세스 시작 후 Chrome CDP HTTP 검색에 `browser.localLaunchTimeoutMs`를 사용하고, 시작 후 CDP websocket 준비 상태에는 `browser.localCdpReadyTimeoutMs`를 사용합니다. Chrome은 성공적으로 시작되지만 준비 상태 검사가 시작과 경쟁하는 느린 호스트에서는 이 값을 높이세요.
- 자동 감지 순서: 기본 브라우저가 Chromium 기반인 경우 기본 브라우저 → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath`는 OS 홈 디렉터리에 대해 `~`를 허용합니다.
- Control 서비스: loopback 전용(포트는 `gateway.port`에서 파생되며 기본값은 `18791`).
- `extraArgs`는 로컬 Chromium 시작에 추가 실행 플래그를 덧붙입니다(예: `--disable-gpu`, 창 크기 설정, 또는 디버그 플래그).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
```

- `seamColor`: 네이티브 앱 UI 크롬용 강조 색상입니다(Talk 모드 버블 틴트 등).
- `assistant`: Control UI 식별 정보 override입니다. 활성 agent 식별 정보로 대체됩니다.

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // dangerous: allow absolute external http(s) embed URLs
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Optional. Default false.
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // Optional. Default unset/disabled.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Gateway 필드 세부 정보">

- `mode`: `local`(gateway 실행) 또는 `remote`(원격 gateway에 연결)입니다. Gateway는 `local`이 아니면 시작을 거부합니다.
- `port`: WS + HTTP를 위한 단일 멀티플렉스 포트입니다. 우선순위: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback`(기본값), `lan`(`0.0.0.0`), `tailnet`(Tailscale IP만), 또는 `custom`입니다.
- **레거시 bind 별칭**: `gateway.bind`에는 호스트 별칭(`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`)이 아니라 bind 모드 값(`auto`, `loopback`, `lan`, `tailnet`, `custom`)을 사용하세요.
- **Docker 참고**: 기본 `loopback` bind는 컨테이너 내부에서 `127.0.0.1`로 수신합니다. Docker 브리지 네트워킹(`-p 18789:18789`)에서는 트래픽이 `eth0`로 들어오므로 gateway에 도달할 수 없습니다. `--network host`를 사용하거나, 모든 인터페이스에서 수신하도록 `bind: "lan"`(또는 `customBindHost: "0.0.0.0"`와 함께 `bind: "custom"`)을 설정하세요.
- **Auth**: 기본적으로 필요합니다. loopback이 아닌 bind에는 gateway auth가 필요합니다. 실제로는 공유 token/password 또는 `gateway.auth.mode: "trusted-proxy"`를 사용하는 identity-aware 리버스 프록시를 의미합니다. 온보딩 마법사는 기본적으로 token을 생성합니다.
- `gateway.auth.token`과 `gateway.auth.password`가 모두 구성된 경우(SecretRef 포함), `gateway.auth.mode`를 `token` 또는 `password`로 명시적으로 설정하세요. 둘 다 구성되어 있고 mode가 설정되지 않으면 시작 및 서비스 설치/복구 흐름이 실패합니다.
- `gateway.auth.mode: "none"`: 명시적 무인증 모드입니다. 신뢰된 로컬 loopback 설정에서만 사용하세요. 이 옵션은 의도적으로 온보딩 프롬프트에 제공되지 않습니다.
- `gateway.auth.mode: "trusted-proxy"`: 인증을 identity-aware 리버스 프록시에 위임하고 `gateway.trustedProxies`의 identity 헤더를 신뢰합니다([Trusted Proxy Auth](/ko/gateway/trusted-proxy-auth) 참고). 이 모드는 **non-loopback** 프록시 소스를 전제로 하며, 동일 호스트의 loopback 리버스 프록시는 trusted-proxy auth 조건을 충족하지 않습니다.
- `gateway.auth.allowTailscale`: `true`이면 Tailscale Serve identity 헤더가 Control UI/WebSocket auth를 충족할 수 있습니다(`tailscale whois`로 검증). HTTP API 엔드포인트는 이 Tailscale 헤더 auth를 사용하지 않으며, 대신 gateway의 일반 HTTP auth 모드를 따릅니다. 이 token 없는 흐름은 gateway 호스트가 신뢰된다는 전제를 둡니다. `tailscale.mode = "serve"`일 때 기본값은 `true`입니다.
- `gateway.auth.rateLimit`: 선택적 인증 실패 제한기입니다. 클라이언트 IP별 및 auth 범위별로 적용됩니다(공유 시크릿과 디바이스 token은 독립적으로 추적됨). 차단된 시도는 `429` + `Retry-After`를 반환합니다.
  - 비동기 Tailscale Serve Control UI 경로에서는 동일한 `{scope, clientIp}`에 대한 실패 시도가 실패 기록 전에 직렬화됩니다. 따라서 동일 클라이언트의 동시 잘못된 시도는 둘 다 일반 불일치로 통과하는 대신 두 번째 요청에서 제한기에 걸릴 수 있습니다.
  - `gateway.auth.rateLimit.exemptLoopback`의 기본값은 `true`입니다. localhost 트래픽도 의도적으로 속도 제한하려면(테스트 설정 또는 엄격한 프록시 배포용) `false`로 설정하세요.
- 브라우저 원본 WS auth 시도는 항상 loopback 예외를 비활성화한 상태로 제한됩니다(localhost에 대한 브라우저 기반 무차별 대입 공격 방어 심화).
- loopback에서는 이러한 브라우저 원본 잠금이 정규화된 `Origin` 값별로 분리되므로, 한 localhost origin에서 반복 실패가 발생해도 다른 origin이 자동으로 잠기지는 않습니다.
- `tailscale.mode`: `serve`(tailnet 전용, loopback bind) 또는 `funnel`(공개, auth 필요)입니다.
- `controlUi.allowedOrigins`: Gateway WebSocket 연결용 명시적 브라우저 origin allowlist입니다. 브라우저 클라이언트가 non-loopback origin에서 연결할 것으로 예상되면 필요합니다.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: Host 헤더 origin 정책에 의도적으로 의존하는 배포를 위해 Host 헤더 origin fallback을 활성화하는 위험한 모드입니다.
- `remote.transport`: `ssh`(기본값) 또는 `direct`(ws/wss)입니다. `direct`의 경우 `remote.url`은 `ws://` 또는 `wss://`여야 합니다.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: 신뢰된 사설 네트워크 IP에 대한 평문 `ws://`를 허용하는 클라이언트 측 프로세스 환경의 긴급 우회 override입니다. 기본값은 평문에 대해 loopback 전용으로 유지됩니다. 이에 해당하는 `openclaw.json` 설정은 없으며, `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` 같은 브라우저 사설 네트워크 config도 Gateway WebSocket 클라이언트에는 영향을 주지 않습니다.
- `gateway.remote.token` / `.password`는 원격 클라이언트 자격 증명 필드입니다. 이것만으로 gateway auth를 구성하지는 않습니다.
- `gateway.push.apns.relay.baseUrl`: 공식/TestFlight iOS 빌드가 relay 기반 등록을 gateway에 게시한 뒤 사용하는 외부 APNs relay의 기본 HTTPS URL입니다. 이 URL은 iOS 빌드에 컴파일된 relay URL과 일치해야 합니다.
- `gateway.push.apns.relay.timeoutMs`: gateway에서 relay로 전송할 때의 타임아웃(밀리초)입니다. 기본값은 `10000`입니다.
- relay 기반 등록은 특정 gateway identity에 위임됩니다. 페어링된 iOS 앱은 `gateway.identity.get`을 가져오고, 그 identity를 relay 등록에 포함하며, 등록 범위 send grant를 gateway로 전달합니다. 다른 gateway는 저장된 해당 등록을 재사용할 수 없습니다.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: 위 relay config에 대한 임시 env override입니다.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: loopback HTTP relay URL을 위한 개발 전용 비상 탈출구입니다. 운영 relay URL은 HTTPS를 유지해야 합니다.
- `gateway.channelHealthCheckMinutes`: 채널 상태 모니터 간격(분)입니다. 전역적으로 상태 모니터 재시작을 비활성화하려면 `0`으로 설정하세요. 기본값: `5`.
- `gateway.channelStaleEventThresholdMinutes`: 오래된 소켓 임계값(분)입니다. 이 값은 `gateway.channelHealthCheckMinutes`보다 크거나 같게 유지하세요. 기본값: `30`.
- `gateway.channelMaxRestartsPerHour`: 롤링 1시간 동안 채널/계정별 상태 모니터 최대 재시작 횟수입니다. 기본값: `10`.
- `channels.<provider>.healthMonitor.enabled`: 전역 모니터는 유지하면서 상태 모니터 재시작만 채널별로 opt-out하는 설정입니다.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: 다중 계정 채널용 계정별 override입니다. 설정되면 채널 수준 override보다 우선합니다.
- 로컬 gateway 호출 경로는 `gateway.auth.*`가 설정되지 않은 경우에만 fallback으로 `gateway.remote.*`를 사용할 수 있습니다.
- `gateway.auth.token` / `gateway.auth.password`가 SecretRef로 명시적으로 구성되었지만 해결되지 않으면, 해결은 실패하도록 닫혀 있습니다(원격 fallback이 이를 가리지 않음).
- `trustedProxies`: TLS를 종료하거나 전달된 클라이언트 헤더를 주입하는 리버스 프록시 IP입니다. 직접 제어하는 프록시만 나열하세요. loopback 항목은 동일 호스트 프록시/로컬 감지 설정(예: Tailscale Serve 또는 로컬 리버스 프록시)에서는 여전히 유효하지만, loopback 요청이 `gateway.auth.mode: "trusted-proxy"` 대상이 되게 하지는 않습니다.
- `allowRealIpFallback`: `true`이면 `X-Forwarded-For`가 없을 때 gateway가 `X-Real-IP`를 허용합니다. 실패하도록 닫히는 동작을 위해 기본값은 `false`입니다.
- `gateway.nodes.pairing.autoApproveCidrs`: 요청된 범위가 없는 최초 node 디바이스 페어링을 자동 승인하기 위한 선택적 CIDR/IP allowlist입니다. 설정되지 않으면 비활성화됩니다. 이는 operator/browser/Control UI/WebChat 페어링을 자동 승인하지 않으며, role, scope, metadata, 공개 키 업그레이드도 자동 승인하지 않습니다.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: 페어링 및 allowlist 평가 후 선언된 node 명령에 대한 전역 allow/deny 형태 지정입니다.
- `gateway.tools.deny`: HTTP `POST /tools/invoke`에 대해 추가로 차단할 도구 이름입니다(기본 deny 목록 확장).
- `gateway.tools.allow`: 기본 HTTP deny 목록에서 도구 이름을 제거합니다.

</Accordion>

### OpenAI 호환 엔드포인트

- Chat Completions: 기본적으로 비활성화되어 있습니다. `gateway.http.endpoints.chatCompletions.enabled: true`로 활성화하세요.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Responses URL 입력 강화:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    빈 allowlist는 설정되지 않은 것으로 처리됩니다. URL 가져오기를 비활성화하려면 `gateway.http.endpoints.responses.files.allowUrl=false` 및/또는 `gateway.http.endpoints.responses.images.allowUrl=false`를 사용하세요.
- 선택적 응답 강화 헤더:
  - `gateway.http.securityHeaders.strictTransportSecurity`(직접 제어하는 HTTPS origin에 대해서만 설정하세요. [Trusted Proxy Auth](/ko/gateway/trusted-proxy-auth#tls-termination-and-hsts) 참고)

### 다중 인스턴스 격리

고유한 포트와 state dir로 하나의 호스트에서 여러 gateway를 실행합니다.

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

편의 플래그: `--dev`(`~/.openclaw-dev` + 포트 `19001` 사용), `--profile <name>`(`~/.openclaw-<name>` 사용).

[Multiple Gateways](/ko/gateway/multiple-gateways)를 참고하세요.

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`: gateway 리스너에서 TLS 종료(HTTPS/WSS)를 활성화합니다(기본값: `false`).
- `autoGenerate`: 명시적 파일이 구성되지 않은 경우 로컬 자체 서명 cert/key 쌍을 자동 생성합니다. 로컬/개발용으로만 사용하세요.
- `certPath`: TLS 인증서 파일의 파일시스템 경로입니다.
- `keyPath`: TLS 개인 키 파일의 파일시스템 경로입니다. 권한을 제한해 두세요.
- `caPath`: 클라이언트 검증 또는 커스텀 신뢰 체인용 선택적 CA 번들 경로입니다.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 0,
    },
  },
}
```

- `mode`: config 편집을 런타임에 어떻게 적용할지 제어합니다.
  - `"off"`: 실시간 편집을 무시합니다. 변경 사항에는 명시적 재시작이 필요합니다.
  - `"restart"`: config가 변경되면 항상 gateway 프로세스를 재시작합니다.
  - `"hot"`: 재시작 없이 프로세스 내에서 변경 사항을 적용합니다.
  - `"hybrid"`(기본값): 먼저 핫 리로드를 시도하고, 필요하면 재시작으로 대체합니다.
- `debounceMs`: config 변경을 적용하기 전의 디바운스 창(밀리초)입니다(음수가 아닌 정수).
- `deferralTimeoutMs`: 진행 중인 작업을 기다린 뒤 강제로 재시작하기까지의 선택적 최대 시간(밀리초)입니다. 생략하거나 `0`으로 설정하면 무기한 대기하며, 여전히 대기 중이라는 경고를 주기적으로 기록합니다.

---

## Hook

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

인증: `Authorization: Bearer <token>` 또는 `x-openclaw-token: <token>`.
쿼리 문자열 hook token은 거부됩니다.

검증 및 안전 참고:

- `hooks.enabled=true`에는 비어 있지 않은 `hooks.token`이 필요합니다.
- `hooks.token`은 `gateway.auth.token`과 **달라야** 합니다. Gateway token 재사용은 거부됩니다.
- `hooks.path`는 `/`일 수 없습니다. `/hooks` 같은 전용 하위 경로를 사용하세요.
- `hooks.allowRequestSessionKey=true`인 경우 `hooks.allowedSessionKeyPrefixes`를 제한하세요(예: `["hook:"]`).
- 매핑 또는 preset이 템플릿화된 `sessionKey`를 사용한다면 `hooks.allowedSessionKeyPrefixes`와 `hooks.allowRequestSessionKey=true`를 설정하세요. 정적 매핑 키에는 이 opt-in이 필요하지 않습니다.

**엔드포인트:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - 요청 payload의 `sessionKey`는 `hooks.allowRequestSessionKey=true`일 때만 허용됩니다(기본값: `false`).
- `POST /hooks/<name>` → `hooks.mappings`를 통해 해석됨
  - 템플릿으로 렌더링된 매핑 `sessionKey` 값은 외부에서 제공된 것으로 취급되며, 이 경우에도 `hooks.allowRequestSessionKey=true`가 필요합니다.

<Accordion title="매핑 세부 정보">

- `match.path`는 `/hooks` 뒤의 하위 경로와 일치합니다(예: `/hooks/gmail` → `gmail`).
- `match.source`는 일반 경로에 대해 payload 필드와 일치합니다.
- `{{messages[0].subject}}` 같은 템플릿은 payload에서 읽습니다.
- `transform`은 hook 작업을 반환하는 JS/TS 모듈을 가리킬 수 있습니다.
  - `transform.module`은 상대 경로여야 하며 `hooks.transformsDir` 내부에 머물러야 합니다(절대 경로 및 상위 경로 탐색은 거부됨).
- `agentId`는 특정 agent로 라우팅합니다. 알 수 없는 ID는 기본값으로 대체됩니다.
- `allowedAgentIds`: 명시적 라우팅을 제한합니다(`*` 또는 생략 = 모두 허용, `[]` = 모두 거부).
- `defaultSessionKey`: 명시적 `sessionKey`가 없는 hook agent 실행에 대한 선택적 고정 세션 키입니다.
- `allowRequestSessionKey`: `/hooks/agent` 호출자와 템플릿 기반 매핑 세션 키가 `sessionKey`를 설정하도록 허용합니다(기본값: `false`).
- `allowedSessionKeyPrefixes`: 명시적 `sessionKey` 값(요청 + 매핑)에 대한 선택적 접두사 allowlist입니다(예: `["hook:"]`). 매핑이나 preset이 템플릿화된 `sessionKey`를 사용할 경우 필수가 됩니다.
- `deliver: true`는 최종 응답을 채널로 전송합니다. `channel` 기본값은 `last`입니다.
- `model`은 이 hook 실행에 사용할 LLM을 override합니다(모델 카탈로그가 설정된 경우 허용되어야 함).

</Accordion>

### Gmail 통합

- 내장 Gmail preset은 `sessionKey: "hook:gmail:{{messages[0].id}}"`를 사용합니다.
- 이 메시지별 라우팅을 유지하려면 `hooks.allowRequestSessionKey: true`를 설정하고, `hooks.allowedSessionKeyPrefixes`를 Gmail 네임스페이스에 맞게 제한하세요. 예: `["hook:", "hook:gmail:"]`.
- `hooks.allowRequestSessionKey: false`가 필요하다면, preset의 템플릿 기본값 대신 정적 `sessionKey`로 override하세요.

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- 구성된 경우 Gateway는 부팅 시 `gog gmail watch serve`를 자동 시작합니다. 비활성화하려면 `OPENCLAW_SKIP_GMAIL_WATCHER=1`을 설정하세요.
- Gateway와 함께 별도의 `gog gmail watch serve`를 실행하지 마세요.

---

## Canvas 호스트

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Gateway 포트 아래의 HTTP로 agent가 편집 가능한 HTML/CSS/JS 및 A2UI를 제공합니다.
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- 로컬 전용: `gateway.bind: "loopback"`(기본값)을 유지하세요.
- non-loopback bind: canvas 라우트는 다른 Gateway HTTP 표면과 동일하게 Gateway auth(token/password/trusted-proxy)가 필요합니다.
- Node WebView는 일반적으로 auth 헤더를 보내지 않습니다. node가 페어링되고 연결된 후에는 Gateway가 canvas/A2UI 접근을 위한 node 범위 capability URL을 광고합니다.
- capability URL은 활성 node WS 세션에 바인딩되며 빠르게 만료됩니다. IP 기반 fallback은 사용되지 않습니다.
- 제공된 HTML에 live-reload 클라이언트를 주입합니다.
- 비어 있으면 시작용 `index.html`을 자동 생성합니다.
- `/__openclaw__/a2ui/`에서도 A2UI를 제공합니다.
- 변경 사항에는 gateway 재시작이 필요합니다.
- 디렉터리가 크거나 `EMFILE` 오류가 발생하는 경우 live reload를 비활성화하세요.

---

## 검색

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal`(기본값): TXT 레코드에서 `cliPath` + `sshPort`를 생략합니다.
- `full`: `cliPath` + `sshPort`를 포함합니다.
- 호스트 이름 기본값은 `openclaw`입니다. `OPENCLAW_MDNS_HOSTNAME`으로 override하세요.

### 광역(Wide-area, DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

`~/.openclaw/dns/` 아래에 유니캐스트 DNS-SD 존을 기록합니다. 네트워크 간 검색을 위해 DNS 서버(CoreDNS 권장) + Tailscale split DNS와 함께 사용하세요.

설정: `openclaw dns setup --apply`.

---

## 환경

### `env` (인라인 env var)

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- 인라인 env var는 프로세스 env에 해당 키가 없을 때만 적용됩니다.
- `.env` 파일: 현재 작업 디렉터리의 `.env` + `~/.openclaw/.env`(둘 다 기존 var를 override하지 않음).
- `shellEnv`: 로그인 셸 프로필에서 누락된 예상 키를 가져옵니다.
- 전체 우선순위는 [Environment](/ko/help/environment)를 참고하세요.

### Env var 치환

모든 config 문자열에서 `${VAR_NAME}`으로 env var를 참조할 수 있습니다.

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- 일치하는 이름은 대문자 형식만 허용됩니다: `[A-Z_][A-Z0-9_]*`.
- 누락되었거나 비어 있는 var는 config 로드 시 오류를 발생시킵니다.
- 리터럴 `${VAR}`가 필요하면 `$${VAR}`로 이스케이프하세요.
- `$include`와 함께 동작합니다.

---

## 시크릿

SecretRef는 추가 방식입니다. 평문 값도 계속 사용할 수 있습니다.

### `SecretRef`

하나의 객체 형태를 사용하세요.

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

검증:

- `provider` 패턴: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` id 패턴: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id: 절대 JSON 포인터(예: `"/providers/openai/apiKey"`)
- `source: "exec"` id 패턴: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"` id에는 `.` 또는 `..` 같은 슬래시 구분 경로 세그먼트가 포함되면 안 됩니다(예: `a/../b`는 거부됨)

### 지원되는 자격 증명 표면

- 정식 매트릭스: [SecretRef Credential Surface](/ko/reference/secretref-credential-surface)
- `secrets apply`는 지원되는 `openclaw.json` 자격 증명 경로를 대상으로 합니다.
- `auth-profiles.json` ref는 런타임 해결 및 감사 범위에 포함됩니다.

### Secret provider config

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // optional explicit env provider
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

참고:

- `file` provider는 `mode: "json"`과 `mode: "singleValue"`를 지원합니다(`singleValue` 모드에서는 `id`가 `"value"`여야 함).
- File 및 exec provider 경로는 Windows ACL 검증을 사용할 수 없으면 실패하도록 닫혀 있습니다. 검증할 수 없는 신뢰된 경로에 대해서만 `allowInsecurePath: true`를 설정하세요.
- `exec` provider는 절대 `command` 경로가 필요하며 stdin/stdout의 프로토콜 payload를 사용합니다.
- 기본적으로 심볼릭 링크 command 경로는 거부됩니다. 해결된 대상 경로를 검증하면서 심볼릭 링크 경로를 허용하려면 `allowSymlinkCommand: true`를 설정하세요.
- `trustedDirs`가 구성된 경우, 신뢰 디렉터리 검사는 해결된 대상 경로에 적용됩니다.
- `exec` 자식 환경은 기본적으로 최소화되어 있습니다. 필요한 변수는 `passEnv`로 명시적으로 전달하세요.
- Secret ref는 활성화 시점에 메모리 내 스냅샷으로 해결되며, 이후 요청 경로는 이 스냅샷만 읽습니다.
- 활성 표면 필터링은 활성화 중 적용됩니다. 활성화된 표면의 해결되지 않은 ref는 시작/리로드를 실패시키고, 비활성 표면은 diagnostics와 함께 건너뜁니다.

---

## 인증 저장소

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- 에이전트별 프로필은 `<agentDir>/auth-profiles.json`에 저장됩니다.
- `auth-profiles.json`은 정적 자격 증명 모드에 대해 값 수준 ref(`api_key`용 `keyRef`, `token`용 `tokenRef`)를 지원합니다.
- OAuth 모드 프로필(`auth.profiles.<id>.mode = "oauth"`)은 SecretRef 기반 auth-profile 자격 증명을 지원하지 않습니다.
- 정적 런타임 자격 증명은 메모리 내 해결된 스냅샷에서 오며, 레거시 정적 `auth.json` 항목은 발견되면 제거됩니다.
- 레거시 OAuth는 `~/.openclaw/credentials/oauth.json`에서 가져옵니다.
- [OAuth](/ko/concepts/oauth)를 참고하세요.
- Secrets 런타임 동작과 `audit/configure/apply` 도구: [Secrets Management](/ko/gateway/secrets).

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`: 프로필이 실제 청구/크레딧 부족 오류로 실패할 때 적용되는 기본 backoff 시간(시간 단위)입니다(기본값: `5`). 명시적인 청구 관련 텍스트는 `401`/`403` 응답에서도 여기에 들어올 수 있지만, provider별 텍스트 매처는 해당 provider 범위로 제한됩니다(예: OpenRouter `Key limit exceeded`). 재시도 가능한 HTTP `402` 사용량 창 또는 organization/workspace 지출 한도 메시지는 대신 `rate_limit` 경로에 남습니다.
- `billingBackoffHoursByProvider`: 청구 backoff 시간에 대한 선택적 provider별 override입니다.
- `billingMaxHours`: 청구 backoff 지수 증가의 상한(시간 단위)입니다(기본값: `24`).
- `authPermanentBackoffMinutes`: 신뢰도가 높은 `auth_permanent` 실패에 대한 기본 backoff 시간(분 단위)입니다(기본값: `10`).
- `authPermanentMaxMinutes`: `auth_permanent` backoff 증가의 상한(분 단위)입니다(기본값: `60`).
- `failureWindowHours`: backoff 카운터에 사용되는 롤링 윈도우(시간 단위)입니다(기본값: `24`).
- `overloadedProfileRotations`: 모델 fallback으로 전환하기 전 overloaded 오류에 대해 동일 provider auth-profile을 회전할 수 있는 최대 횟수입니다(기본값: `1`). `ModelNotReadyException` 같은 provider-busy 형태가 여기에 해당합니다.
- `overloadedBackoffMs`: overloaded provider/profile 회전을 재시도하기 전의 고정 지연 시간입니다(기본값: `0`).
- `rateLimitedProfileRotations`: 모델 fallback으로 전환하기 전 rate-limit 오류에 대해 동일 provider auth-profile을 회전할 수 있는 최대 횟수입니다(기본값: `1`). 이 rate-limit 버킷에는 `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `resource exhausted` 같은 provider 형태 텍스트도 포함됩니다.

---

## 로깅

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- 기본 로그 파일: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- 고정 경로가 필요하면 `logging.file`을 설정하세요.
- `consoleLevel`은 `--verbose`일 때 `debug`로 올라갑니다.
- `maxFileBytes`: 쓰기를 억제하기 전 로그 파일의 최대 크기(바이트)입니다(양의 정수, 기본값: `524288000` = 500 MB). 운영 배포에서는 외부 로그 로테이션을 사용하세요.

---

## 진단

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
      },
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`: 계측 출력용 마스터 토글입니다(기본값: `true`).
- `flags`: 대상 지정 로그 출력을 활성화하는 플래그 문자열 배열입니다(예: `"telegram.*"` 또는 `"*"` 같은 와일드카드 지원).
- `stuckSessionWarnMs`: 세션이 처리 상태에 머무는 동안 멈춘 세션 경고를 출력하기 위한 수명 임계값(밀리초)입니다.
- `otel.enabled`: OpenTelemetry 내보내기 파이프라인을 활성화합니다(기본값: `false`).
- `otel.endpoint`: OTel 내보내기용 collector URL입니다.
- `otel.protocol`: `"http/protobuf"`(기본값) 또는 `"grpc"`입니다.
- `otel.headers`: OTel 내보내기 요청과 함께 전송되는 추가 HTTP/gRPC 메타데이터 헤더입니다.
- `otel.serviceName`: 리소스 속성용 서비스 이름입니다.
- `otel.traces` / `otel.metrics` / `otel.logs`: trace, metrics, 또는 log 내보내기를 활성화합니다.
- `otel.sampleRate`: trace 샘플링 비율 `0`–`1`입니다.
- `otel.flushIntervalMs`: 주기적 telemetry flush 간격(밀리초)입니다.
- `otel.captureContent`: OTEL span 속성에 대한 원시 콘텐츠 캡처 opt-in입니다. 기본값은 비활성입니다. 불리언 `true`는 system이 아닌 메시지/도구 콘텐츠를 캡처하고, 객체 형태는 `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt`를 명시적으로 활성화할 수 있게 합니다.
- `OPENCLAW_OTEL_PRELOADED=1`: 이미 전역 OpenTelemetry SDK를 등록한 호스트용 환경 토글입니다. 그러면 OpenClaw는 플러그인 소유 SDK 시작/종료를 건너뛰고 진단 리스너는 계속 활성 상태로 유지합니다.
- `cacheTrace.enabled`: 임베디드 실행용 캐시 추적 스냅샷을 기록합니다(기본값: `false`).
- `cacheTrace.filePath`: 캐시 추적 JSONL 출력 경로입니다(기본값: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: 캐시 추적 출력에 포함할 항목을 제어합니다(모두 기본값: `true`).

---

## 업데이트

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`: npm/git 설치용 릴리스 채널입니다 — `"stable"`, `"beta"`, 또는 `"dev"`.
- `checkOnStart`: gateway 시작 시 npm 업데이트를 확인합니다(기본값: `true`).
- `auto.enabled`: 패키지 설치에 대한 백그라운드 자동 업데이트를 활성화합니다(기본값: `false`).
- `auto.stableDelayHours`: stable 채널 자동 적용 전 최소 지연 시간(시간 단위)입니다(기본값: `6`; 최대: `168`).
- `auto.stableJitterHours`: stable 채널 롤아웃 분산용 추가 시간 창(시간 단위)입니다(기본값: `12`; 최대: `168`).
- `auto.betaCheckIntervalHours`: beta 채널 확인이 실행되는 간격(시간 단위)입니다(기본값: `1`; 최대: `24`).

---

## ACP

```json5
{
  acp: {
    enabled: false,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`: 전역 ACP 기능 게이트입니다(기본값: `false`).
- `dispatch.enabled`: ACP 세션 turn dispatch용 독립 게이트입니다(기본값: `true`). ACP 명령은 계속 사용할 수 있게 두면서 실행만 막으려면 `false`로 설정하세요.
- `backend`: 기본 ACP 런타임 backend id입니다(등록된 ACP 런타임 플러그인과 일치해야 함).
- `defaultAgent`: spawn이 명시적 대상을 지정하지 않을 때의 fallback ACP 대상 agent id입니다.
- `allowedAgents`: ACP 런타임 세션에 허용된 agent id의 allowlist입니다. 비어 있으면 추가 제한이 없음을 의미합니다.
- `maxConcurrentSessions`: 동시에 활성화될 수 있는 ACP 세션의 최대 수입니다.
- `stream.coalesceIdleMs`: 스트리밍 텍스트용 유휴 flush 창(밀리초)입니다.
- `stream.maxChunkChars`: 스트리밍 블록 투영을 분할하기 전 최대 청크 크기입니다.
- `stream.repeatSuppression`: turn별 반복 상태/도구 줄을 억제합니다(기본값: `true`).
- `stream.deliveryMode`: `"live"`는 점진적으로 스트리밍하고, `"final_only"`는 turn 종료 이벤트까지 버퍼링합니다.
- `stream.hiddenBoundarySeparator`: 숨겨진 도구 이벤트 뒤 가시 텍스트 앞에 넣는 구분자입니다(기본값: `"paragraph"`).
- `stream.maxOutputChars`: ACP turn별로 투영되는 assistant 출력 최대 문자 수입니다.
- `stream.maxSessionUpdateChars`: 투영되는 ACP 상태/업데이트 줄의 최대 문자 수입니다.
- `stream.tagVisibility`: 스트리밍 이벤트용 태그 이름과 불리언 가시성 override의 기록입니다.
- `runtime.ttlMinutes`: ACP 세션 워커가 정리 대상이 되기 전 유휴 TTL(분 단위)입니다.
- `runtime.installCommand`: ACP 런타임 환경을 부트스트랩할 때 실행할 선택적 설치 명령입니다.

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode`는 배너 태그라인 스타일을 제어합니다.
  - `"random"`(기본값): 순환하는 재미있는/계절성 태그라인.
  - `"default"`: 고정된 중립 태그라인(`All your chats, one OpenClaw.`).
  - `"off"`: 태그라인 텍스트 없음(배너 제목/버전은 계속 표시됨).
- 전체 배너를 숨기려면(태그라인만이 아니라) env `OPENCLAW_HIDE_BANNER=1`을 설정하세요.

---

## 마법사

CLI 안내 설정 흐름(`onboard`, `configure`, `doctor`)이 기록하는 메타데이터:

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## Identity

[Agent defaults](/ko/gateway/config-agents#agent-defaults)의 `agents.list` identity 필드를 참고하세요.

---

## Bridge (레거시, 제거됨)

현재 빌드에는 더 이상 TCP bridge가 포함되지 않습니다. Node는 Gateway WebSocket을 통해 연결됩니다. `bridge.*` 키는 더 이상 config schema의 일부가 아닙니다(제거할 때까지 검증 실패, `openclaw doctor --fix`로 알 수 없는 키를 제거할 수 있음).

<Accordion title="레거시 bridge config (과거 참조용)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2,
    webhook: "https://example.invalid/legacy", // deprecated fallback for stored notify:true jobs
    webhookToken: "replace-with-dedicated-token", // optional bearer token for outbound webhook auth
    sessionRetention: "24h", // duration string or false
    runLog: {
      maxBytes: "2mb", // default 2_000_000 bytes
      keepLines: 2000, // default 2000
    },
  },
}
```

- `sessionRetention`: 완료된 격리 cron 실행 세션을 `sessions.json`에서 정리하기 전까지 유지하는 기간입니다. 보관된 삭제 cron 전사 정리도 제어합니다. 기본값: `24h`; 비활성화하려면 `false`로 설정하세요.
- `runLog.maxBytes`: 정리 전 실행 로그 파일(`cron/runs/<jobId>.jsonl`)당 최대 크기입니다. 기본값: `2_000_000` 바이트.
- `runLog.keepLines`: 실행 로그 정리가 트리거될 때 유지되는 최신 줄 수입니다. 기본값: `2000`.
- `webhookToken`: cron Webhook POST 전달(`delivery.mode = "webhook"`)에 사용하는 bearer token입니다. 생략하면 auth 헤더를 보내지 않습니다.
- `webhook`: 저장된 작업 중 여전히 `notify: true`가 있는 작업에만 사용되는 더 이상 권장되지 않는 레거시 fallback Webhook URL(http/https)입니다.

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`: 일회성 작업에서 일시적 오류 발생 시 최대 재시도 횟수입니다(기본값: `3`; 범위: `0`–`10`).
- `backoffMs`: 각 재시도 시도에 대한 backoff 지연 시간 배열(밀리초)입니다(기본값: `[30000, 60000, 300000]`; 1–10개 항목).
- `retryOn`: 재시도를 트리거하는 오류 유형입니다 — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. 생략하면 모든 일시적 유형을 재시도합니다.

일회성 cron 작업에만 적용됩니다. 반복 작업은 별도의 실패 처리를 사용합니다.

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: cron 작업 실패 알림을 활성화합니다(기본값: `false`).
- `after`: 알림이 발생하기 전 연속 실패 횟수입니다(양의 정수, 최소: `1`).
- `cooldownMs`: 동일 작업에 대해 반복 알림 사이의 최소 시간(밀리초)입니다(음수가 아닌 정수).
- `mode`: 전달 모드입니다 — `"announce"`는 채널 메시지로 전송하고, `"webhook"`은 구성된 Webhook으로 POST합니다.
- `accountId`: 알림 전달 범위를 제한하는 선택적 계정 또는 채널 id입니다.

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- 모든 작업에 걸친 cron 실패 알림의 기본 대상입니다.
- `mode`: `"announce"` 또는 `"webhook"`이며, 충분한 대상 데이터가 있으면 기본값은 `"announce"`입니다.
- `channel`: announce 전달용 채널 override입니다. `"last"`는 마지막으로 알려진 전달 채널을 재사용합니다.
- `to`: 명시적 announce 대상 또는 Webhook URL입니다. Webhook 모드에서는 필수입니다.
- `accountId`: 전달용 선택적 계정 override입니다.
- 작업별 `delivery.failureDestination`은 이 전역 기본값을 override합니다.
- 전역 또는 작업별 실패 대상이 모두 설정되지 않은 경우, 이미 `announce`로 전달되는 작업은 실패 시 해당 기본 announce 대상으로 fallback합니다.
- `delivery.failureDestination`은 작업의 기본 `delivery.mode`가 `"webhook"`인 경우를 제외하고 `sessionTarget="isolated"` 작업에서만 지원됩니다.

[Cron Jobs](/ko/automation/cron-jobs)를 참고하세요. 격리된 cron 실행은 [background tasks](/ko/automation/tasks)로 추적됩니다.

---

## 미디어 모델 템플릿 변수

`tools.media.models[].args`에서 확장되는 템플릿 placeholder:

| 변수               | 설명                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | 전체 수신 메시지 본문                             |
| `{{RawBody}}`      | 원시 본문(기록/발신자 래퍼 없음)                  |
| `{{BodyStripped}}` | 그룹 멘션이 제거된 본문                           |
| `{{From}}`         | 발신자 식별자                                     |
| `{{To}}`           | 대상 식별자                                       |
| `{{MessageSid}}`   | 채널 메시지 id                                    |
| `{{SessionId}}`    | 현재 세션 UUID                                    |
| `{{IsNewSession}}` | 새 세션이 생성되면 `"true"`                       |
| `{{MediaUrl}}`     | 수신 미디어 의사 URL                              |
| `{{MediaPath}}`    | 로컬 미디어 경로                                  |
| `{{MediaType}}`    | 미디어 유형(image/audio/document/…)               |
| `{{Transcript}}`   | 오디오 전사                                       |
| `{{Prompt}}`       | CLI 항목에 대해 해석된 미디어 프롬프트            |
| `{{MaxChars}}`     | CLI 항목에 대해 해석된 최대 출력 문자 수          |
| `{{ChatType}}`     | `"direct"` 또는 `"group"`                         |
| `{{GroupSubject}}` | 그룹 제목(best effort)                            |
| `{{GroupMembers}}` | 그룹 구성원 미리보기(best effort)                 |
| `{{SenderName}}`   | 발신자 표시 이름(best effort)                     |
| `{{SenderE164}}`   | 발신자 전화번호(best effort)                      |
| `{{Provider}}`     | Provider 힌트(whatsapp, telegram, discord 등)     |

---

## Config include (`$include`)

Config를 여러 파일로 분할합니다.

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**병합 동작:**

- 단일 파일: 포함하는 객체를 대체합니다.
- 파일 배열: 순서대로 깊게 병합됩니다(뒤 항목이 앞 항목을 override).
- 형제 키: include 뒤에 병합됩니다(포함된 값을 override).
- 중첩 include: 최대 10단계 깊이까지 가능합니다.
- 경로: 포함하는 파일을 기준으로 해석되지만, 최상위 config 디렉터리(`openclaw.json`의 `dirname`) 내부에 있어야 합니다. 절대 경로/`../` 형식도 최종적으로 그 경계 내부로 해석되는 경우에만 허용됩니다.
- 하나의 최상위 섹션만 단일 파일 include로 구성되어 있을 때 해당 섹션을 변경하는 OpenClaw 소유 쓰기는 그 포함 파일에 직접 기록됩니다. 예를 들어 `plugins install`은 `plugins: { $include: "./plugins.json5" }`에 대해 `plugins.json5`를 업데이트하고 `openclaw.json`은 그대로 둡니다.
- 루트 include, include 배열, 형제 override가 있는 include는 OpenClaw 소유 쓰기에서 읽기 전용입니다. 이러한 쓰기는 config를 평탄화하는 대신 실패하도록 닫혀 있습니다.
- 오류: 누락된 파일, 파싱 오류, 순환 include에 대해 명확한 메시지를 제공합니다.

---

_관련 항목: [Configuration](/ko/gateway/configuration) · [Configuration Examples](/ko/gateway/configuration-examples) · [Doctor](/ko/gateway/doctor)_

## 관련 항목

- [Configuration](/ko/gateway/configuration)
- [구성 예시](/ko/gateway/configuration-examples)
