---
read_when:
    - 정확한 필드 수준 구성 의미 체계나 기본값이 필요한 경우
    - 채널, 모델, Gateway 또는 도구 구성 블록을 검증하고 있습니다
summary: 핵심 OpenClaw 키, 기본값 및 전용 하위 시스템 참조 링크에 대한 Gateway 구성 참조
title: 구성 참조
x-i18n:
    generated_at: "2026-05-12T00:58:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b8e31f7a6ed82faf3b5a50daa286bb6fce0c2e4452ae81a8e792a437004ad54
    source_path: gateway/configuration-reference.md
    workflow: 16
---

핵심 구성은 `~/.openclaw/openclaw.json`을 참조하세요. 작업 중심 개요는 [구성](/ko/gateway/configuration)을 참조하세요.

주요 OpenClaw 구성 표면을 다루고, 하위 시스템에 더 깊은 자체 참조가 있는 경우 링크합니다. 채널 및 Plugin 소유 명령 카탈로그와 심층 메모리/QMD 조정값은 이 페이지가 아니라 각자의 페이지에 있습니다.

코드 기준:

- `openclaw config schema`는 유효성 검사와 Control UI에 사용되는 실시간 JSON Schema를 출력하며, 사용 가능한 경우 번들/Plugin/채널 메타데이터가 병합됩니다
- `config.schema.lookup`은 드릴다운 도구용으로 경로 범위가 지정된 스키마 노드 하나를 반환합니다
- `pnpm config:docs:check` / `pnpm config:docs:gen`은 현재 스키마 표면을 기준으로 구성 문서 기준 해시를 검증합니다

에이전트 조회 경로: 편집 전에 정확한 필드 수준 문서와 제약 조건은
`gateway` 도구 작업 `config.schema.lookup`을 사용하세요. 작업 중심 가이드는
[구성](/ko/gateway/configuration)을 사용하고, 더 넓은 필드 맵, 기본값, 하위 시스템 참조 링크는
이 페이지를 사용하세요.

전용 심층 참조:

- `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations`, 그리고 `plugins.entries.memory-core.config.dreaming` 아래의 dreaming 구성은 [메모리 구성 참조](/ko/reference/memory-config)를 참조하세요
- 현재 내장 + 번들 명령 카탈로그는 [슬래시 명령](/ko/tools/slash-commands)을 참조하세요
- 채널별 명령 표면은 소유 채널/Plugin 페이지를 참조하세요

구성 형식은 **JSON5**입니다(주석 + 후행 쉼표 허용). 모든 필드는 선택 사항입니다. 생략하면 OpenClaw가 안전한 기본값을 사용합니다.

---

## 채널

채널별 구성 키는 전용 페이지로 이동했습니다. Slack, Discord, Telegram, WhatsApp, Matrix, iMessage 및 기타 번들 채널의
`channels.*`(인증, 액세스 제어, 다중 계정, 멘션 게이팅)를 포함한 내용은
[구성 - 채널](/ko/gateway/config-channels)을 참조하세요.

## 에이전트 기본값, 다중 에이전트, 세션, 메시지

전용 페이지로 이동했습니다. 다음 항목은
[구성 - 에이전트](/ko/gateway/config-agents)를 참조하세요.

- `agents.defaults.*`(워크스페이스, 모델, 사고, Heartbeat, 메모리, 미디어, Skills, 샌드박스)
- `multiAgent.*`(다중 에이전트 라우팅 및 바인딩)
- `session.*`(세션 수명 주기, Compaction, 가지치기)
- `messages.*`(메시지 전달, TTS, 마크다운 렌더링)
- `talk.*`(Talk 모드)
  - `talk.consultThinkingLevel`: Control UI Talk 실시간 상담 뒤에서 전체 OpenClaw 에이전트 실행에 적용되는 사고 수준 재정의
  - `talk.consultFastMode`: Control UI Talk 실시간 상담을 위한 일회성 빠른 모드 재정의
  - `talk.speechLocale`: iOS/macOS에서 Talk 음성 인식에 사용할 선택적 BCP 47 로캘 ID
  - `talk.silenceTimeoutMs`: 설정하지 않으면 Talk는 transcript를 보내기 전에 플랫폼 기본 일시 정지 창을 유지합니다(`700 ms on macOS and Android, 900 ms on iOS`)

## 도구 및 사용자 지정 공급자

도구 정책, 실험적 토글, 공급자 기반 도구 구성, 사용자 지정 공급자 / 기본 URL 설정은 전용 페이지로 이동했습니다.
[구성 - 도구 및 사용자 지정 공급자](/ko/gateway/config-tools)를 참조하세요.

## 모델

공급자 정의, 모델 허용 목록, 사용자 지정 공급자 설정은
[구성 - 도구 및 사용자 지정 공급자](/ko/gateway/config-tools#custom-providers-and-base-urls)에 있습니다.
`models` 루트는 전역 모델 카탈로그 동작도 소유합니다.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: 공급자 카탈로그 동작(`merge` 또는 `replace`).
- `models.providers`: 공급자 ID를 키로 하는 사용자 지정 공급자 맵.
- `models.providers.*.localService`: 로컬 모델 서버를 위한 선택적 온디맨드 프로세스 관리자입니다. OpenClaw는 구성된 상태 엔드포인트를 점검하고, 필요할 때 절대 경로 `command`를 시작하며, 준비 완료를 기다린 다음 모델 요청을 보냅니다. [로컬 모델 서비스](/ko/gateway/local-model-services)를 참조하세요.
- `models.pricing.enabled`: 사이드카와 채널이 Gateway 준비 경로에 도달한 뒤 시작되는 백그라운드 가격 부트스트랩을 제어합니다. `false`이면 Gateway는 OpenRouter와 LiteLLM 가격 카탈로그 가져오기를 건너뜁니다. 구성된 `models.providers.*.models[].cost` 값은 로컬 비용 추정에 계속 작동합니다.

## MCP

OpenClaw가 관리하는 MCP 서버 정의는 `mcp.servers` 아래에 있으며 임베디드 Pi와 기타 런타임 어댑터에서 사용됩니다. `openclaw mcp list`, `show`, `set`, `unset` 명령은 구성 편집 중 대상 서버에 연결하지 않고 이 블록을 관리합니다.

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

- `mcp.servers`: 구성된 MCP 도구를 노출하는 런타임을 위한 이름이 지정된 stdio 또는 원격 MCP 서버 정의입니다.
  원격 항목은 `transport: "streamable-http"` 또는 `transport: "sse"`를 사용합니다.
  `type: "http"`는 `openclaw mcp set` 및 `openclaw doctor --fix`가 표준 `transport` 필드로 정규화하는 CLI 네이티브 별칭입니다.
- `mcp.sessionIdleTtlMs`: 세션 범위 번들 MCP 런타임의 유휴 TTL입니다.
  일회성 임베디드 실행은 실행 종료 정리를 요청합니다. 이 TTL은 장기 실행 세션과 향후 호출자를 위한 보루입니다.
- `mcp.*` 아래의 변경 사항은 캐시된 세션 MCP 런타임을 폐기하여 핫 적용됩니다.
  다음 도구 탐색/사용 시 새 구성에서 다시 생성되므로 제거된 `mcp.servers` 항목은 유휴 TTL을 기다리지 않고 즉시 수거됩니다.

런타임 동작은 [MCP](/ko/cli/mcp#openclaw-as-an-mcp-client-registry) 및
[CLI 백엔드](/ko/gateway/cli-backends#bundle-mcp-overlays)를 참조하세요.

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
      allowUploadedArchives: false,
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

- `allowBundled`: 번들 Skills에만 적용되는 선택적 허용 목록입니다(관리형/워크스페이스 Skills에는 영향 없음).
- `load.extraDirs`: 추가 공유 Skill 루트(가장 낮은 우선순위).
- `load.allowSymlinkTargets`: Skill 심볼릭 링크가 구성된 소스 루트 밖에 있을 때 해석될 수 있는 신뢰할 수 있는 실제 대상 루트입니다.
- `install.preferBrew`: true이면 `brew`를 사용할 수 있을 때 다른 설치 관리자 종류로 대체하기 전에 Homebrew 설치 관리자를 우선합니다.
- `install.nodeManager`: `metadata.openclaw.install` 사양에 대한 Node 설치 관리자 선호도입니다(`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: 신뢰할 수 있는 `operator.admin` Gateway 클라이언트가 `skills.upload.*`를 통해 준비된 비공개 zip 아카이브를 설치할 수 있도록 허용합니다(기본값: false). 이는 업로드된 아카이브 경로만 활성화합니다. 일반 ClawHub 설치에는 필요하지 않습니다.
- `entries.<skillKey>.enabled: false`는 번들/설치된 Skill이라도 비활성화합니다.
- `entries.<skillKey>.apiKey`: 기본 env var를 선언하는 Skills를 위한 편의 항목입니다(일반 텍스트 문자열 또는 SecretRef 객체).

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    bundledDiscovery: "allowlist",
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
- 탐색은 네이티브 OpenClaw Plugin과 호환되는 Codex 번들 및 Claude 번들을 허용하며, manifest가 없는 Claude 기본 레이아웃 번들도 포함합니다.
- **구성 변경에는 Gateway 재시작이 필요합니다.**
- `allow`: 선택적 허용 목록입니다(나열된 Plugin만 로드). `deny`가 우선합니다.
- `bundledDiscovery`: 새 구성의 기본값은 `"allowlist"`이므로 비어 있지 않은 `plugins.allow`는 web-search 런타임 공급자를 포함한 번들 공급자 Plugin도 게이팅합니다. Doctor는 마이그레이션된 레거시 허용 목록 구성에 `"compat"`를 기록하여 사용자가 옵트인할 때까지 기존 번들 공급자 동작을 보존합니다.
- `plugins.entries.<id>.apiKey`: Plugin 수준 API 키 편의 필드입니다(Plugin에서 지원하는 경우).
- `plugins.entries.<id>.env`: Plugin 범위 env var 맵입니다.
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false`이면 core는 `before_prompt_build`를 차단하고 레거시 `before_agent_start`의 프롬프트 변경 필드를 무시하는 동시에 레거시 `modelOverride`와 `providerOverride`는 보존합니다. 네이티브 Plugin hook 및 지원되는 번들 제공 hook 디렉터리에 적용됩니다.
- `plugins.entries.<id>.hooks.allowConversationAccess`: `true`이면 신뢰할 수 있는 비번들 Plugin이 `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end` 같은 typed hook에서 원시 대화 콘텐츠를 읽을 수 있습니다.
- `plugins.entries.<id>.subagent.allowModelOverride`: 이 Plugin이 백그라운드 하위 에이전트 실행에 대해 실행별 `provider` 및 `model` 재정의를 요청하도록 명시적으로 신뢰합니다.
- `plugins.entries.<id>.subagent.allowedModels`: 신뢰할 수 있는 하위 에이전트 재정의를 위한 표준 `provider/model` 대상의 선택적 허용 목록입니다. 어떤 모델이든 허용하려는 의도가 있을 때만 `"*"`를 사용하세요.
- `plugins.entries.<id>.llm.allowModelOverride`: 이 Plugin이 `api.runtime.llm.complete`에 대한 모델 재정의를 요청하도록 명시적으로 신뢰합니다.
- `plugins.entries.<id>.llm.allowedModels`: 신뢰할 수 있는 Plugin LLM completion 재정의를 위한 표준 `provider/model` 대상의 선택적 허용 목록입니다. 어떤 모델이든 허용하려는 의도가 있을 때만 `"*"`를 사용하세요.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: 이 Plugin이 기본값이 아닌 에이전트 ID에 대해 `api.runtime.llm.complete`를 실행하도록 명시적으로 신뢰합니다.
- `plugins.entries.<id>.config`: Plugin 정의 구성 객체입니다(사용 가능한 경우 네이티브 OpenClaw Plugin 스키마로 검증).
- 채널 Plugin 계정/런타임 설정은 `channels.<id>` 아래에 있으며, 중앙 OpenClaw 옵션 레지스트리가 아니라 소유 Plugin의 manifest `channelConfigs` 메타데이터로 설명되어야 합니다.

### Codex harness Plugin 구성

번들 `codex` Plugin은 네이티브 Codex app-server harness 설정을
`plugins.entries.codex.config` 아래에 소유합니다. 전체 구성 표면은
[Codex harness 참조](/ko/plugins/codex-harness-reference)를, 런타임 모델은
[Codex harness](/ko/plugins/codex-harness)를 참조하세요.

`codexPlugins`는 네이티브 Codex harness를 선택한 세션에만 적용됩니다.
Pi, 일반 OpenAI 공급자 실행, ACP 대화 바인딩 또는 Codex가 아닌 harness에는 Codex Plugin을 활성화하지 않습니다.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
                allow_destructive_actions: false,
              },
            },
          },
        },
      },
    },
  },
}
```

- `plugins.entries.codex.config.codexPlugins.enabled`: Codex 하네스를 위한 네이티브 Codex
  Plugin/앱 지원을 활성화합니다. 기본값: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  마이그레이션된 Plugin 앱 요청에 대한 기본 파괴적 작업 정책입니다.
  기본값: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: 전역
  `codexPlugins.enabled`도 true일 때 마이그레이션된 Plugin 항목을 활성화합니다.
  명시적 항목의 기본값: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  안정적인 마켓플레이스 식별자입니다. V1은 `"openai-curated"`만 지원합니다.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: 마이그레이션에서 가져온 안정적인
  Codex Plugin 식별자입니다. 예: `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  Plugin별 파괴적 작업 재정의입니다. 생략하면 전역
  `allow_destructive_actions` 값이 사용됩니다.

`codexPlugins.enabled`는 전역 활성화 지시자입니다. 마이그레이션이 작성한 명시적 Plugin
항목은 지속적인 설치 및 복구 자격 집합입니다.
`plugins["*"]`는 지원되지 않으며, `install` 스위치는 없고, 로컬
`marketplacePath` 값은 호스트별 값이므로 의도적으로 구성 필드가 아닙니다.

`app/list` 준비 상태 검사는 한 시간 동안 캐시되며 오래되면
비동기적으로 새로 고쳐집니다. Codex 스레드 앱 구성은 매 턴마다가 아니라 Codex 하네스
세션이 설정될 때 계산됩니다. 네이티브 Plugin 구성을 변경한 후에는 `/new`, `/reset` 또는 Gateway
재시작을 사용하세요.

- `plugins.entries.firecrawl.config.webFetch`: Firecrawl 웹 가져오기 공급자 설정입니다.
  - `apiKey`: Firecrawl API 키입니다(SecretRef 허용). `plugins.entries.firecrawl.config.webSearch.apiKey`, 레거시 `tools.web.fetch.firecrawl.apiKey` 또는 `FIRECRAWL_API_KEY` 환경 변수로 폴백합니다.
  - `baseUrl`: Firecrawl API 기본 URL입니다(기본값: `https://api.firecrawl.dev`; 자체 호스팅 재정의는 비공개/내부 엔드포인트를 대상으로 해야 합니다).
  - `onlyMainContent`: 페이지에서 기본 콘텐츠만 추출합니다(기본값: `true`).
  - `maxAgeMs`: 최대 캐시 수명(밀리초)입니다(기본값: `172800000` / 2일).
  - `timeoutSeconds`: 스크레이프 요청 제한 시간(초)입니다(기본값: `60`).
- `plugins.entries.xai.config.xSearch`: xAI X Search(Grok 웹 검색) 설정입니다.
  - `enabled`: X Search 공급자를 활성화합니다.
  - `model`: 검색에 사용할 Grok 모델입니다(예: `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: 메모리 dreaming 설정입니다. 단계와 임계값은 [Dreaming](/ko/concepts/dreaming)을 참조하세요.
  - `enabled`: 마스터 dreaming 스위치입니다(기본값 `false`).
  - `frequency`: 각 전체 dreaming 스윕의 Cron 주기입니다(기본값 `"0 3 * * *"`).
  - `model`: 선택적 Dream Diary 하위 에이전트 모델 재정의입니다. `plugins.entries.memory-core.subagent.allowModelOverride: true`가 필요합니다. 대상을 제한하려면 `allowedModels`와 함께 사용하세요. 모델 사용 불가 오류는 세션 기본 모델로 한 번 재시도됩니다. 신뢰 또는 허용 목록 실패는 조용히 폴백하지 않습니다.
  - 단계 정책과 임계값은 구현 세부 정보입니다(사용자에게 표시되는 구성 키가 아님).
- 전체 메모리 구성은 [메모리 구성 참조](/ko/reference/memory-config)에 있습니다.
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 활성화된 Claude 번들 Plugin은 `settings.json`에서 임베드된 Pi 기본값도 제공할 수 있습니다. OpenClaw는 이를 원시 OpenClaw 구성 패치가 아니라 정리된 에이전트 설정으로 적용합니다.
- `plugins.slots.memory`: 활성 메모리 Plugin ID를 선택하거나, 메모리 Plugin을 비활성화하려면 `"none"`을 선택합니다.
- `plugins.slots.contextEngine`: 활성 컨텍스트 엔진 Plugin ID를 선택합니다. 다른 엔진을 설치하고 선택하지 않는 한 기본값은 `"legacy"`입니다.

[Plugins](/ko/tools/plugin)를 참조하세요.

---

## 약속

`commitments`는 추론된 후속 메모리를 제어합니다. OpenClaw는 대화 턴에서 체크인을 감지하고 Heartbeat 실행을 통해 전달할 수 있습니다.

- `commitments.enabled`: 추론된 후속 약속을 위한 숨겨진 LLM 추출, 저장 및 Heartbeat 전달을 활성화합니다. 기본값: `false`.
- `commitments.maxPerDay`: 롤링 하루 동안 에이전트 세션당 전달되는 추론된 후속 약속의 최대 개수입니다. 기본값: `3`.

[추론된 약속](/ko/concepts/commitments)을 참조하세요.

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
- `tabCleanup`은 유휴 시간이 지난 후 또는 세션이 한도를 초과할 때 추적 중인 기본 에이전트 탭을 회수합니다. 개별 정리 모드를 비활성화하려면 `idleMinutes: 0` 또는 `maxTabsPerSession: 0`으로 설정하세요.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork`는 설정되지 않으면 비활성화되므로 브라우저 탐색은 기본적으로 엄격하게 유지됩니다.
- 비공개 네트워크 브라우저 탐색을 의도적으로 신뢰할 때만 `ssrfPolicy.dangerouslyAllowPrivateNetwork: true`를 설정하세요.
- 엄격 모드에서는 원격 CDP 프로필 엔드포인트(`profiles.*.cdpUrl`)가 도달 가능성/검색 검사 중 동일한 비공개 네트워크 차단의 적용을 받습니다.
- `ssrfPolicy.allowPrivateNetwork`는 레거시 별칭으로 계속 지원됩니다.
- 엄격 모드에서는 명시적 예외에 `ssrfPolicy.hostnameAllowlist`와 `ssrfPolicy.allowedHostnames`를 사용하세요.
- 원격 프로필은 연결 전용입니다(시작/중지/재설정 비활성화).
- `profiles.*.cdpUrl`은 `http://`, `https://`, `ws://`, `wss://`를 허용합니다.
  OpenClaw가 `/json/version`을 검색하게 하려면 HTTP(S)를 사용하고, 공급자가 직접 DevTools WebSocket URL을 제공하는 경우 WS(S)를 사용하세요.
- `remoteCdpTimeoutMs`와 `remoteCdpHandshakeTimeoutMs`는 원격 및
  `attachOnly` CDP 도달 가능성과 탭 열기 요청에 적용됩니다. 관리형 loopback
  프로필은 로컬 CDP 기본값을 유지합니다.
- 외부에서 관리되는 CDP 서비스가 loopback을 통해 도달 가능한 경우 해당
  프로필의 `attachOnly: true`를 설정하세요. 그렇지 않으면 OpenClaw가 loopback 포트를
  로컬 관리형 브라우저 프로필로 취급하여 로컬 포트 소유권 오류를 보고할 수 있습니다.
- `existing-session` 프로필은 CDP 대신 Chrome MCP를 사용하며 선택한 호스트 또는 연결된 브라우저 노드를 통해 연결할 수 있습니다.
- `existing-session` 프로필은 Brave 또는 Edge 같은 특정
  Chromium 기반 브라우저 프로필을 대상으로 `userDataDir`을 설정할 수 있습니다.
- `existing-session` 프로필은 현재 Chrome MCP 라우트 제한을 유지합니다.
  CSS 선택자 타기팅 대신 스냅샷/ref 기반 작업, 단일 파일 업로드
  훅, 대화 상자 제한 시간 재정의 없음, `wait --load networkidle` 없음, 그리고
  `responsebody`, PDF 내보내기, 다운로드 가로채기 또는 배치 작업 없음.
- 로컬 관리형 `openclaw` 프로필은 `cdpPort`와 `cdpUrl`을 자동 할당합니다. 원격 CDP에만
  `cdpUrl`을 명시적으로 설정하세요.
- 로컬 관리형 프로필은 해당 프로필의 전역
  `browser.executablePath`를 재정의하도록 `executablePath`를 설정할 수 있습니다. 한 프로필은
  Chrome에서, 다른 프로필은 Brave에서 실행하려면 이를 사용하세요.
- 로컬 관리형 프로필은 프로세스 시작 후 Chrome CDP HTTP
  검색에 `browser.localLaunchTimeoutMs`를 사용하고, 실행 후 CDP websocket 준비 상태에는 `browser.localCdpReadyTimeoutMs`를 사용합니다. Chrome이
  정상적으로 시작되지만 준비 상태 검사가 시작과 경합하는 느린 호스트에서는 값을 높이세요. 두 값은 모두
  `120000` ms 이하의 양의 정수여야 하며, 잘못된 구성 값은 거부됩니다.
- 자동 감지 순서: Chromium 기반인 경우 기본 브라우저 → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath`와 `browser.profiles.<name>.executablePath`는 모두
  Chromium 실행 전에 OS 홈 디렉터리를 나타내는 `~`와 `~/...`를 허용합니다.
  `existing-session` 프로필의 프로필별 `userDataDir`도 물결표가 확장됩니다.
- 제어 서비스: loopback 전용(`gateway.port`에서 파생된 포트, 기본값 `18791`).
- `extraArgs`는 로컬 Chromium 시작에 추가 실행 플래그를 덧붙입니다(예:
  `--disable-gpu`, 창 크기 조정 또는 디버그 플래그).

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

- `seamColor`: 네이티브 앱 UI 크롬의 강조 색상입니다(Talk Mode 말풍선 색조 등).
- `assistant`: Control UI ID 재정의입니다. 활성 에이전트 ID로 폴백합니다.

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
      // chatMessageMaxWidth: "min(1280px, 82%)", // optional grouped chat message max-width
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

- `mode`: `local`(Gateway 실행) 또는 `remote`(원격 Gateway에 연결). `local`이 아니면 Gateway가 시작을 거부합니다.
- `port`: WS + HTTP를 위한 단일 다중화 포트. 우선순위: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback`(기본값), `lan`(`0.0.0.0`), `tailnet`(Tailscale IP 전용), 또는 `custom`.
- **레거시 바인드 별칭**: 호스트 별칭(`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`)이 아니라 `gateway.bind`에서 바인드 모드 값(`auto`, `loopback`, `lan`, `tailnet`, `custom`)을 사용하세요.
- **Docker 참고**: 기본 `loopback` 바인드는 컨테이너 내부의 `127.0.0.1`에서 수신합니다. Docker 브리지 네트워킹(`-p 18789:18789`)에서는 트래픽이 `eth0`로 들어오므로 Gateway에 접근할 수 없습니다. 모든 인터페이스에서 수신하려면 `--network host`를 사용하거나 `bind: "lan"`(또는 `customBindHost: "0.0.0.0"`와 함께 `bind: "custom"`)을 설정하세요.
- **인증**: 기본적으로 필요합니다. 비-loopback 바인드에는 Gateway 인증이 필요합니다. 실제로는 공유 토큰/비밀번호 또는 `gateway.auth.mode: "trusted-proxy"`를 사용하는 ID 인식 리버스 프록시를 의미합니다. 온보딩 마법사는 기본적으로 토큰을 생성합니다.
- `gateway.auth.token`과 `gateway.auth.password`가 둘 다 구성된 경우(SecretRefs 포함), `gateway.auth.mode`를 `token` 또는 `password`로 명시적으로 설정하세요. 둘 다 구성되어 있고 모드가 설정되지 않으면 시작 및 서비스 설치/복구 흐름이 실패합니다.
- `gateway.auth.mode: "none"`: 명시적인 무인증 모드입니다. 신뢰할 수 있는 로컬 local loopback 설정에만 사용하세요. 이는 의도적으로 온보딩 프롬프트에서 제공되지 않습니다.
- `gateway.auth.mode: "trusted-proxy"`: 브라우저/사용자 인증을 ID 인식 리버스 프록시에 위임하고 `gateway.trustedProxies`의 ID 헤더를 신뢰합니다([신뢰할 수 있는 프록시 인증](/ko/gateway/trusted-proxy-auth) 참조). 이 모드는 기본적으로 **비-loopback** 프록시 소스를 예상합니다. 같은 호스트의 loopback 리버스 프록시는 명시적으로 `gateway.auth.trustedProxy.allowLoopback = true`가 필요합니다. 내부 같은 호스트 호출자는 로컬 직접 폴백으로 `gateway.auth.password`를 사용할 수 있습니다. `gateway.auth.token`은 trusted-proxy 모드와 계속 상호 배타적입니다.
- `gateway.auth.allowTailscale`: `true`이면 Tailscale Serve ID 헤더가 Control UI/WebSocket 인증을 충족할 수 있습니다(`tailscale whois`로 확인). HTTP API 엔드포인트는 해당 Tailscale 헤더 인증을 **사용하지 않습니다**. 대신 Gateway의 일반 HTTP 인증 모드를 따릅니다. 이 토큰 없는 흐름은 Gateway 호스트를 신뢰한다고 가정합니다. `tailscale.mode = "serve"`일 때 기본값은 `true`입니다.
- `gateway.auth.rateLimit`: 선택적 인증 실패 제한기입니다. 클라이언트 IP별 및 인증 범위별로 적용됩니다(shared-secret 및 device-token은 독립적으로 추적됨). 차단된 시도는 `429` + `Retry-After`를 반환합니다.
  - 비동기 Tailscale Serve Control UI 경로에서는 동일한 `{scope, clientIp}`에 대한 실패 시도가 실패 쓰기 전에 직렬화됩니다. 따라서 동일한 클라이언트의 동시 잘못된 시도는 둘 다 단순 불일치로 경쟁하듯 통과하는 대신 두 번째 요청에서 제한기에 걸릴 수 있습니다.
  - `gateway.auth.rateLimit.exemptLoopback`의 기본값은 `true`입니다. localhost 트래픽도 의도적으로 속도 제한하려는 경우(테스트 설정 또는 엄격한 프록시 배포) `false`로 설정하세요.
- 브라우저 출처 WS 인증 시도는 항상 loopback 면제를 비활성화한 상태로 제한됩니다(브라우저 기반 localhost 무차별 대입에 대한 심층 방어).
- loopback에서는 이러한 브라우저 출처 잠금이 정규화된 `Origin`
  값별로 격리되므로 한 localhost 출처의 반복 실패가 다른 출처를 자동으로
  잠그지는 않습니다.
- `tailscale.mode`: `serve`(tailnet 전용, loopback 바인드) 또는 `funnel`(공개, 인증 필요).
- `tailscale.preserveFunnel`: `true`이고 `tailscale.mode = "serve"`이면 OpenClaw는
  시작 시 Serve를 다시 적용하기 전에 `tailscale funnel status`를 확인하고, 외부에서 구성된 Funnel 경로가 이미 Gateway 포트를 포함하면
  건너뜁니다.
  기본값은 `false`입니다.
- `controlUi.allowedOrigins`: Gateway WebSocket 연결을 위한 명시적 브라우저 출처 허용 목록입니다. 비-loopback 출처에서 브라우저 클라이언트를 예상하는 경우 필요합니다.
- `controlUi.chatMessageMaxWidth`: 그룹화된 Control UI 채팅 메시지의 선택적 최대 너비입니다. `960px`, `82%`, `min(1280px, 82%)`, `calc(100% - 2rem)` 같은 제한된 CSS 너비 값을 허용합니다.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: 의도적으로 Host 헤더 출처 정책에 의존하는 배포를 위해 Host 헤더 출처 폴백을 활성화하는 위험한 모드입니다.
- `remote.transport`: `ssh`(기본값) 또는 `direct`(ws/wss). `direct`의 경우 `remote.url`은 `ws://` 또는 `wss://`여야 합니다.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: 신뢰할 수 있는 사설 네트워크
  IP로의 평문 `ws://`를 허용하는 클라이언트 측 프로세스 환경
  비상 우회 설정입니다. 평문 기본값은 계속 loopback 전용입니다. 이에 대응하는 `openclaw.json`
  설정은 없으며,
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` 같은 브라우저 사설 네트워크 설정은 Gateway
  WebSocket 클라이언트에 영향을 주지 않습니다.
- `gateway.remote.token` / `.password`는 원격 클라이언트 자격 증명 필드입니다. 이것만으로 Gateway 인증을 구성하지 않습니다.
- `gateway.push.apns.relay.baseUrl`: 공식/TestFlight iOS 빌드가 릴레이 기반 등록을 Gateway에 게시한 뒤 사용하는 외부 APNs 릴레이의 기본 HTTPS URL입니다. 이 URL은 iOS 빌드에 컴파일된 릴레이 URL과 일치해야 합니다.
- `gateway.push.apns.relay.timeoutMs`: Gateway에서 릴레이로 보내는 제한 시간(밀리초)입니다. 기본값은 `10000`입니다.
- 릴레이 기반 등록은 특정 Gateway ID에 위임됩니다. 페어링된 iOS 앱은 `gateway.identity.get`을 가져오고, 해당 ID를 릴레이 등록에 포함하며, 등록 범위 전송 권한을 Gateway로 전달합니다. 다른 Gateway는 저장된 해당 등록을 재사용할 수 없습니다.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: 위 릴레이 구성에 대한 임시 환경 재정의입니다.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: loopback HTTP 릴레이 URL을 위한 개발 전용 탈출구입니다. 프로덕션 릴레이 URL은 HTTPS를 유지해야 합니다.
- `gateway.handshakeTimeoutMs`: 인증 전 Gateway WebSocket 핸드셰이크 제한 시간(밀리초)입니다. 기본값: `15000`. 설정된 경우 `OPENCLAW_HANDSHAKE_TIMEOUT_MS`가 우선합니다. 로컬 클라이언트가 연결할 수 있지만 시작 워밍업이 아직 안정화 중인 부하가 있거나 저전력인 호스트에서는 이 값을 늘리세요.
- `gateway.channelHealthCheckMinutes`: 채널 상태 모니터 간격(분)입니다. 상태 모니터 재시작을 전역으로 비활성화하려면 `0`으로 설정하세요. 기본값: `5`.
- `gateway.channelStaleEventThresholdMinutes`: 오래된 소켓 임계값(분)입니다. 이 값은 `gateway.channelHealthCheckMinutes`보다 크거나 같게 유지하세요. 기본값: `30`.
- `gateway.channelMaxRestartsPerHour`: 롤링 1시간 동안 채널/계정당 상태 모니터 재시작 최대 횟수입니다. 기본값: `10`.
- `channels.<provider>.healthMonitor.enabled`: 전역 모니터는 활성화한 상태로 유지하면서 채널별로 상태 모니터 재시작을 끄는 옵션입니다.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: 다중 계정 채널의 계정별 재정의입니다. 설정하면 채널 수준 재정보다 우선합니다.
- 로컬 Gateway 호출 경로는 `gateway.auth.*`가 설정되지 않은 경우에만 `gateway.remote.*`를 폴백으로 사용할 수 있습니다.
- `gateway.auth.token` / `gateway.auth.password`가 SecretRef를 통해 명시적으로 구성되었지만 확인되지 않으면, 확인은 닫힌 상태로 실패합니다(원격 폴백이 가리는 일 없음).
- `trustedProxies`: TLS를 종료하거나 전달된 클라이언트 헤더를 주입하는 리버스 프록시 IP입니다. 직접 제어하는 프록시만 나열하세요. loopback 항목도 같은 호스트 프록시/로컬 감지 설정(예: Tailscale Serve 또는 로컬 리버스 프록시)에는 여전히 유효하지만, loopback 요청이 `gateway.auth.mode: "trusted-proxy"` 대상이 되게 하지는 **않습니다**.
- `allowRealIpFallback`: `true`이면 `X-Forwarded-For`가 없을 때 Gateway가 `X-Real-IP`를 허용합니다. 실패 시 닫힘 동작을 위해 기본값은 `false`입니다.
- `gateway.nodes.pairing.autoApproveCidrs`: 요청된 범위가 없는 최초 노드 디바이스 페어링을 자동 승인하기 위한 선택적 CIDR/IP 허용 목록입니다. 설정되지 않으면 비활성화됩니다. 이는 운영자/브라우저/Control UI/WebChat 페어링을 자동 승인하지 않으며, 역할, 범위, 메타데이터, 공개 키 업그레이드도 자동 승인하지 않습니다.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: 페어링 및 플랫폼 허용 목록 평가 후 선언된 노드 명령에 대한 전역 허용/거부 조정입니다. `camera.snap`, `camera.clip`, `screen.record` 같은 위험한 노드 명령을 옵트인하려면 `allowCommands`를 사용하세요. `denyCommands`는 플랫폼 기본값 또는 명시적 허용에 포함될 명령이라도 제거합니다. 노드가 선언한 명령 목록을 변경한 뒤에는 Gateway가 업데이트된 명령 스냅샷을 저장하도록 해당 디바이스 페어링을 거부하고 다시 승인하세요.
- `gateway.tools.deny`: HTTP `POST /tools/invoke`에서 차단할 추가 도구 이름입니다(기본 거부 목록 확장).
- `gateway.tools.allow`: 기본 HTTP 거부 목록에서 도구 이름을 제거합니다.

</Accordion>

### OpenAI 호환 엔드포인트

- Chat Completions: 기본적으로 비활성화되어 있습니다. `gateway.http.endpoints.chatCompletions.enabled: true`로 활성화하세요.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Responses URL 입력 강화:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    빈 허용 목록은 설정되지 않은 것으로 처리됩니다. URL 가져오기를 비활성화하려면 `gateway.http.endpoints.responses.files.allowUrl=false`
    및/또는 `gateway.http.endpoints.responses.images.allowUrl=false`를 사용하세요.
- 선택적 응답 강화 헤더:
  - `gateway.http.securityHeaders.strictTransportSecurity`(직접 제어하는 HTTPS 출처에만 설정하세요. [신뢰할 수 있는 프록시 인증](/ko/gateway/trusted-proxy-auth#tls-termination-and-hsts) 참조)

### 다중 인스턴스 격리

고유한 포트와 상태 디렉터리로 한 호스트에서 여러 Gateway를 실행하세요.

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

편의 플래그: `--dev`(`~/.openclaw-dev` + 포트 `19001` 사용), `--profile <name>`(`~/.openclaw-<name>` 사용).

[여러 Gateway](/ko/gateway/multiple-gateways)를 참조하세요.

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

- `enabled`: Gateway 리스너에서 TLS 종료(HTTPS/WSS)를 활성화합니다(기본값: `false`).
- `autoGenerate`: 명시적 파일이 구성되지 않았을 때 로컬 자체 서명 인증서/키 쌍을 자동 생성합니다. 로컬/개발 용도로만 사용하세요.
- `certPath`: TLS 인증서 파일의 파일 시스템 경로입니다.
- `keyPath`: TLS 개인 키 파일의 파일 시스템 경로입니다. 권한을 제한된 상태로 유지하세요.
- `caPath`: 클라이언트 검증 또는 사용자 지정 신뢰 체인을 위한 선택적 CA 번들 경로입니다.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 300000,
    },
  },
}
```

- `mode`: 런타임에서 구성 편집을 적용하는 방식을 제어합니다.
  - `"off"`: 실시간 편집을 무시합니다. 변경에는 명시적 재시작이 필요합니다.
  - `"restart"`: 구성 변경 시 항상 Gateway 프로세스를 재시작합니다.
  - `"hot"`: 재시작하지 않고 프로세스 내에서 변경을 적용합니다.
  - `"hybrid"`(기본값): 먼저 핫 리로드를 시도하고, 필요하면 재시작으로 폴백합니다.
- `debounceMs`: 구성 변경을 적용하기 전 디바운스 창(ms, 음수가 아닌 정수)입니다.
- `deferralTimeoutMs`: 재시작 또는 채널 핫 리로드를 강제하기 전에 진행 중인 작업을 기다릴 선택적 최대 시간(ms)입니다. 기본 제한 대기(`300000`)를 사용하려면 생략하세요. 무기한 기다리고 주기적으로 아직 대기 중이라는 경고를 기록하려면 `0`으로 설정하세요.

---

## 후크

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
쿼리 문자열 훅 토큰은 거부됩니다.

검증 및 안전 참고 사항:

- `hooks.enabled=true`에는 비어 있지 않은 `hooks.token`이 필요합니다.
- `hooks.token`은 `gateway.auth.token`과 **달라야** 합니다. Gateway 토큰 재사용은 거부됩니다.
- `hooks.path`는 `/`일 수 없습니다. `/hooks` 같은 전용 하위 경로를 사용하세요.
- `hooks.allowRequestSessionKey=true`이면 `hooks.allowedSessionKeyPrefixes`를 제한하세요(예: `["hook:"]`).
- 매핑 또는 프리셋이 템플릿화된 `sessionKey`를 사용하는 경우 `hooks.allowedSessionKeyPrefixes`를 설정하고 `hooks.allowRequestSessionKey=true`로 설정하세요. 정적 매핑 키에는 해당 옵트인이 필요하지 않습니다.

**엔드포인트:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - 요청 페이로드의 `sessionKey`는 `hooks.allowRequestSessionKey=true`일 때만 허용됩니다(기본값: `false`).
- `POST /hooks/<name>` → `hooks.mappings`를 통해 해석됩니다.
  - 템플릿 렌더링된 매핑 `sessionKey` 값은 외부에서 제공된 것으로 간주되며 마찬가지로 `hooks.allowRequestSessionKey=true`가 필요합니다.

<Accordion title="Mapping details">

- `match.path`는 `/hooks` 뒤의 하위 경로와 일치합니다(예: `/hooks/gmail` → `gmail`).
- `match.source`는 일반 경로에 대해 페이로드 필드와 일치합니다.
- `{{messages[0].subject}}` 같은 템플릿은 페이로드에서 읽습니다.
- `transform`은 훅 작업을 반환하는 JS/TS 모듈을 가리킬 수 있습니다.
  - `transform.module`은 상대 경로여야 하며 `hooks.transformsDir` 내부에 있어야 합니다(절대 경로와 경로 순회는 거부됩니다).
  - `hooks.transformsDir`를 `~/.openclaw/hooks/transforms` 아래에 유지하세요. 워크스페이스 Skills 디렉터리는 거부됩니다. `openclaw doctor`가 이 경로를 유효하지 않다고 보고하면 변환 모듈을 훅 변환 디렉터리로 이동하거나 `hooks.transformsDir`를 제거하세요.
- `agentId`는 특정 에이전트로 라우팅합니다. 알 수 없는 ID는 기본값으로 폴백됩니다.
- `allowedAgentIds`: 명시적 라우팅을 제한합니다(`*` 또는 생략 = 모두 허용, `[]` = 모두 거부).
- `defaultSessionKey`: 명시적 `sessionKey`가 없는 훅 에이전트 실행을 위한 선택적 고정 세션 키입니다.
- `allowRequestSessionKey`: `/hooks/agent` 호출자와 템플릿 기반 매핑 세션 키가 `sessionKey`를 설정하도록 허용합니다(기본값: `false`).
- `allowedSessionKeyPrefixes`: 명시적 `sessionKey` 값(요청 + 매핑)에 대한 선택적 접두사 허용 목록입니다. 예: `["hook:"]`. 매핑 또는 프리셋이 템플릿화된 `sessionKey`를 사용하면 필수가 됩니다.
- `deliver: true`는 최종 응답을 채널로 보냅니다. `channel`의 기본값은 `last`입니다.
- `model`은 이 훅 실행의 LLM을 재정의합니다(모델 카탈로그가 설정된 경우 허용되어야 함).

</Accordion>

### Gmail 통합

- 내장 Gmail 프리셋은 `sessionKey: "hook:gmail:{{messages[0].id}}"`를 사용합니다.
- 이 메시지별 라우팅을 유지하려면 `hooks.allowRequestSessionKey: true`를 설정하고 `hooks.allowedSessionKeyPrefixes`를 Gmail 네임스페이스와 일치하도록 제한하세요. 예: `["hook:", "hook:gmail:"]`.
- `hooks.allowRequestSessionKey: false`가 필요하면 템플릿화된 기본값 대신 정적 `sessionKey`로 프리셋을 재정의하세요.

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

- Gateway는 구성된 경우 부팅 시 `gog gmail watch serve`를 자동 시작합니다. 비활성화하려면 `OPENCLAW_SKIP_GMAIL_WATCHER=1`을 설정하세요.
- Gateway와 함께 별도의 `gog gmail watch serve`를 실행하지 마세요.

---

## Canvas Plugin 호스트

```json5
{
  plugins: {
    entries: {
      canvas: {
        config: {
          host: {
            root: "~/.openclaw/workspace/canvas",
            liveReload: true,
            // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
          },
        },
      },
    },
  },
}
```

- Gateway 포트 아래에서 에이전트가 편집 가능한 HTML/CSS/JS와 A2UI를 HTTP로 제공합니다.
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- 로컬 전용: `gateway.bind: "loopback"`(기본값)을 유지하세요.
- local loopback이 아닌 바인드: 캔버스 라우트에는 다른 Gateway HTTP 표면과 동일하게 Gateway 인증(토큰/비밀번호/신뢰할 수 있는 프록시)이 필요합니다.
- Node WebView는 일반적으로 인증 헤더를 보내지 않습니다. 노드가 페어링되고 연결되면 Gateway는 캔버스/A2UI 액세스를 위한 노드 범위 기능 URL을 광고합니다.
- 기능 URL은 활성 노드 WS 세션에 바인딩되며 빠르게 만료됩니다. IP 기반 폴백은 사용되지 않습니다.
- 제공되는 HTML에 라이브 리로드 클라이언트를 삽입합니다.
- 비어 있을 때 시작용 `index.html`을 자동 생성합니다.
- A2UI도 `/__openclaw__/a2ui/`에서 제공합니다.
- 변경 사항에는 Gateway 재시작이 필요합니다.
- 큰 디렉터리 또는 `EMFILE` 오류가 있는 경우 라이브 리로드를 비활성화하세요.

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

- `minimal`(번들 `bonjour` Plugin이 활성화된 경우 기본값): TXT 레코드에서 `cliPath` + `sshPort`를 생략합니다.
- `full`: `cliPath` + `sshPort`를 포함합니다. LAN 멀티캐스트 광고에는 여전히 번들 `bonjour` Plugin이 활성화되어 있어야 합니다.
- `off`: Plugin 활성화 상태를 변경하지 않고 LAN 멀티캐스트 광고를 억제합니다.
- 번들 `bonjour` Plugin은 macOS 호스트에서 자동 시작되며 Linux, Windows, 컨테이너화된 Gateway 배포에서는 옵트인입니다.
- 호스트 이름은 유효한 DNS 레이블인 경우 시스템 호스트 이름이 기본값이며, 그렇지 않으면 `openclaw`로 폴백됩니다. `OPENCLAW_MDNS_HOSTNAME`으로 재정의하세요.

### 광역 (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

`~/.openclaw/dns/` 아래에 유니캐스트 DNS-SD 영역을 씁니다. 네트워크 간 검색의 경우 DNS 서버(CoreDNS 권장) + Tailscale 분할 DNS와 함께 사용하세요.

설정: `openclaw dns setup --apply`.

---

## 환경

### `env` (인라인 환경 변수)

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

- 인라인 환경 변수는 프로세스 환경에 해당 키가 없을 때만 적용됩니다.
- `.env` 파일: CWD `.env` + `~/.openclaw/.env` (둘 다 기존 변수를 재정의하지 않음).
- `shellEnv`: 로그인 셸 프로필에서 누락된 예상 키를 가져옵니다.
- 전체 우선순위는 [환경](/ko/help/environment)을 참조하세요.

### 환경 변수 치환

모든 구성 문자열에서 `${VAR_NAME}`으로 환경 변수를 참조하세요.

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- 대문자 이름만 일치합니다: `[A-Z_][A-Z0-9_]*`.
- 누락되었거나 비어 있는 변수는 구성 로드 시 오류를 발생시킵니다.
- 리터럴 `${VAR}`에는 `$${VAR}`로 이스케이프하세요.
- `$include`와 함께 작동합니다.

---

## 비밀 정보

비밀 정보 참조는 추가 방식입니다. 일반 텍스트 값도 계속 작동합니다.

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
- `source: "exec"` id에는 슬래시로 구분된 `.` 또는 `..` 경로 세그먼트가 포함되면 안 됩니다(예: `a/../b`는 거부됨).

### 지원되는 자격 증명 표면

- 정규 매트릭스: [SecretRef 자격 증명 표면](/ko/reference/secretref-credential-surface)
- `secrets apply`는 지원되는 `openclaw.json` 자격 증명 경로를 대상으로 합니다.
- `auth-profiles.json` 참조는 런타임 확인 및 감사 범위에 포함됩니다.

### 비밀 정보 공급자 구성

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // 선택 사항인 명시적 env 공급자
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

- `file` 공급자는 `mode: "json"` 및 `mode: "singleValue"`를 지원합니다(`singleValue` 모드에서는 `id`가 `"value"`여야 함).
- Windows ACL 검증을 사용할 수 없으면 파일 및 exec 공급자 경로는 안전하게 실패합니다. 검증할 수 없는 신뢰된 경로에만 `allowInsecurePath: true`를 설정하세요.
- `exec` 공급자는 절대 `command` 경로가 필요하며 stdin/stdout에서 프로토콜 페이로드를 사용합니다.
- 기본적으로 심볼릭 링크 명령 경로는 거부됩니다. 확인된 대상 경로를 검증하면서 심볼릭 링크 경로를 허용하려면 `allowSymlinkCommand: true`를 설정하세요.
- `trustedDirs`가 구성된 경우 신뢰 디렉터리 검사는 확인된 대상 경로에 적용됩니다.
- `exec` 하위 환경은 기본적으로 최소화되어 있습니다. 필요한 변수는 `passEnv`로 명시적으로 전달하세요.
- 비밀 정보 참조는 활성화 시점에 메모리 내 스냅샷으로 확인되며, 이후 요청 경로는 스냅샷만 읽습니다.
- 활성 표면 필터링은 활성화 중에 적용됩니다. 활성화된 표면의 확인되지 않은 참조는 시작/다시 로드에 실패하게 하며, 비활성 표면은 진단과 함께 건너뜁니다.

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
- `auth-profiles.json`은 정적 자격 증명 모드에 대해 값 수준 참조(`api_key`에는 `keyRef`, `token`에는 `tokenRef`)를 지원합니다.
- `{ "provider": { "apiKey": "..." } }` 같은 레거시 플랫 `auth-profiles.json` 맵은 런타임 형식이 아닙니다. `openclaw doctor --fix`는 `.legacy-flat.*.bak` 백업과 함께 이를 정규 `provider:default` API 키 프로필로 다시 작성합니다.
- OAuth 모드 프로필(`auth.profiles.<id>.mode = "oauth"`)은 SecretRef 기반 auth-profile 자격 증명을 지원하지 않습니다.
- 정적 런타임 자격 증명은 메모리 내 확인된 스냅샷에서 가져오며, 레거시 정적 `auth.json` 항목은 발견되면 제거됩니다.
- 레거시 OAuth는 `~/.openclaw/credentials/oauth.json`에서 가져옵니다.
- [OAuth](/ko/concepts/oauth)를 참조하세요.
- 비밀 정보 런타임 동작 및 `audit/configure/apply` 도구: [비밀 정보 관리](/ko/gateway/secrets).

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

- `billingBackoffHours`: 실제 billing/크레딧 부족 오류로 인해 프로필이 실패할 때 시간 단위의 기본 백오프입니다(기본값: `5`). 명시적인 billing 텍스트는 `401`/`403` 응답에서도 여기에 분류될 수 있지만, 공급자별 텍스트 매처는 해당 매처를 소유한 공급자 범위로 유지됩니다(예: OpenRouter `Key limit exceeded`). 재시도 가능한 HTTP `402` 사용량 기간 또는 조직/워크스페이스 지출 한도 메시지는 대신 `rate_limit` 경로에 유지됩니다.
- `billingBackoffHoursByProvider`: billing 백오프 시간에 대한 선택적 공급자별 재정의입니다.
- `billingMaxHours`: billing 백오프 지수 증가의 시간 단위 상한입니다(기본값: `24`).
- `authPermanentBackoffMinutes`: 신뢰도 높은 `auth_permanent` 실패에 대한 분 단위 기본 백오프입니다(기본값: `10`).
- `authPermanentMaxMinutes`: `auth_permanent` 백오프 증가의 분 단위 상한입니다(기본값: `60`).
- `failureWindowHours`: 백오프 카운터에 사용되는 시간 단위의 롤링 기간입니다(기본값: `24`).
- `overloadedProfileRotations`: 모델 폴백으로 전환하기 전에 과부하 오류에 대해 허용되는 동일 공급자 인증 프로필 순환의 최대 횟수입니다(기본값: `1`). `ModelNotReadyException` 같은 공급자 사용량 폭주 형태는 여기에 분류됩니다.
- `overloadedBackoffMs`: 과부하 상태인 공급자/프로필 순환을 재시도하기 전의 고정 지연 시간입니다(기본값: `0`).
- `rateLimitedProfileRotations`: 모델 폴백으로 전환하기 전에 속도 제한 오류에 대해 허용되는 동일 공급자 인증 프로필 순환의 최대 횟수입니다(기본값: `1`). 이 속도 제한 버킷에는 `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `resource exhausted` 같은 공급자 형태의 텍스트가 포함됩니다.

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
- 안정적인 경로를 사용하려면 `logging.file`을 설정하세요.
- `--verbose`일 때 `consoleLevel`은 `debug`로 올라갑니다.
- `maxFileBytes`: 순환 전 활성 로그 파일의 최대 크기(바이트)입니다(양의 정수, 기본값: `104857600` = 100MB). OpenClaw는 활성 파일 옆에 번호가 붙은 아카이브를 최대 5개까지 유지합니다.
- `redactSensitive` / `redactPatterns`: 콘솔 출력, 파일 로그, OTLP 로그 레코드, 저장된 세션 트랜스크립트 텍스트에 대한 최선의 마스킹입니다. `redactSensitive: "off"`는 이 일반 로그/트랜스크립트 정책만 비활성화합니다. UI/도구/진단 안전 표면은 여전히 방출 전에 비밀 값을 마스킹합니다.

---

## 진단

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,
    stuckSessionAbortMs: 600000,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      tracesEndpoint: "https://traces.example.com/v1/traces",
      metricsEndpoint: "https://metrics.example.com/v1/metrics",
      logsEndpoint: "https://logs.example.com/v1/logs",
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

- `enabled`: 계측 출력의 마스터 토글입니다(기본값: `true`).
- `flags`: 대상 로그 출력을 활성화하는 플래그 문자열 배열입니다(`"telegram.*"` 또는 `"*"` 같은 와일드카드 지원).
- `stuckSessionWarnMs`: 장기 실행 처리 세션을 `session.long_running`, `session.stalled`, 또는 `session.stuck`으로 분류하기 위한 무진행 시간 임계값(ms)입니다. 응답, 도구, 상태, 블록, ACP 진행은 타이머를 재설정합니다. 반복되는 `session.stuck` 진단은 변경 사항이 없을 때 백오프됩니다.
- `stuckSessionAbortMs`: 복구를 위해 자격이 있는 정체된 활성 작업을 중단 드레인할 수 있기 전의 무진행 시간 임계값(ms)입니다. 설정하지 않으면 OpenClaw는 최소 10분 및 `stuckSessionWarnMs`의 5배인 더 안전한 확장 임베디드 실행 기간을 사용합니다.
- `otel.enabled`: OpenTelemetry 내보내기 파이프라인을 활성화합니다(기본값: `false`). 전체 구성, 신호 카탈로그, 개인정보 모델은 [OpenTelemetry 내보내기](/ko/gateway/opentelemetry)를 참조하세요.
- `otel.endpoint`: OTel 내보내기용 컬렉터 URL입니다.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: 선택적 신호별 OTLP 엔드포인트입니다. 설정하면 해당 신호에 대해서만 `otel.endpoint`를 재정의합니다.
- `otel.protocol`: `"http/protobuf"`(기본값) 또는 `"grpc"`입니다.
- `otel.headers`: OTel 내보내기 요청과 함께 전송되는 추가 HTTP/gRPC 메타데이터 헤더입니다.
- `otel.serviceName`: 리소스 속성의 서비스 이름입니다.
- `otel.traces` / `otel.metrics` / `otel.logs`: 트레이스, 메트릭 또는 로그 내보내기를 활성화합니다.
- `otel.sampleRate`: 트레이스 샘플링 비율 `0`-`1`입니다.
- `otel.flushIntervalMs`: 주기적 텔레메트리 플러시 간격(ms)입니다.
- `otel.captureContent`: OTEL 스팬 속성에 대한 원시 콘텐츠 캡처를 옵트인합니다. 기본값은 꺼짐입니다. 불리언 `true`는 시스템이 아닌 메시지/도구 콘텐츠를 캡처합니다. 객체 형식에서는 `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt`를 명시적으로 활성화할 수 있습니다.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: 최신 실험적 GenAI 스팬 공급자 속성을 위한 환경 토글입니다. 기본적으로 스팬은 호환성을 위해 레거시 `gen_ai.system` 속성을 유지하며, GenAI 메트릭은 제한된 의미론적 속성을 사용합니다.
- `OPENCLAW_OTEL_PRELOADED=1`: 전역 OpenTelemetry SDK를 이미 등록한 호스트를 위한 환경 토글입니다. 그러면 OpenClaw는 진단 리스너를 활성 상태로 유지하면서 Plugin 소유 SDK 시작/종료를 건너뜁니다.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`, `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: 일치하는 구성 키가 설정되지 않았을 때 사용되는 신호별 엔드포인트 환경 변수입니다.
- `cacheTrace.enabled`: 임베디드 실행에 대한 캐시 트레이스 스냅샷을 기록합니다(기본값: `false`).
- `cacheTrace.filePath`: 캐시 트레이스 JSONL의 출력 경로입니다(기본값: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: 캐시 트레이스 출력에 포함되는 항목을 제어합니다(모두 기본값: `true`).

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

- `channel`: npm/git 설치용 릴리스 채널입니다. `"stable"`, `"beta"`, 또는 `"dev"`입니다.
- `checkOnStart`: gateway가 시작될 때 npm 업데이트를 확인합니다(기본값: `true`).
- `auto.enabled`: 패키지 설치에 대한 백그라운드 자동 업데이트를 활성화합니다(기본값: `false`).
- `auto.stableDelayHours`: stable 채널 자동 적용 전 최소 지연 시간입니다(기본값: `6`, 최대: `168`).
- `auto.stableJitterHours`: stable 채널 롤아웃 분산을 위한 추가 시간 창입니다(기본값: `12`, 최대: `168`).
- `auto.betaCheckIntervalHours`: beta 채널 확인을 실행하는 빈도(시간)입니다(기본값: `1`, 최대: `24`).

---

## ACP

```json5
{
  acp: {
    enabled: true,
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

- `enabled`: 전역 ACP 기능 게이트입니다(기본값: `true`, ACP 디스패치 및 생성 어포던스를 숨기려면 `false`로 설정).
- `dispatch.enabled`: ACP 세션 턴 디스패치를 위한 독립 게이트입니다(기본값: `true`). ACP 명령은 사용할 수 있게 유지하면서 실행을 차단하려면 `false`로 설정하세요.
- `backend`: 기본 ACP 런타임 백엔드 id입니다(등록된 ACP 런타임 Plugin과 일치해야 함).
  먼저 백엔드 Plugin을 설치하고, `plugins.allow`가 설정된 경우 백엔드 Plugin id(예: `acpx`)를 포함하세요. 그렇지 않으면 ACP 백엔드가 로드되지 않습니다.
- `defaultAgent`: 생성 시 명시적 대상을 지정하지 않을 때의 폴백 ACP 대상 에이전트 id입니다.
- `allowedAgents`: ACP 런타임 세션에 허용된 에이전트 id의 허용 목록입니다. 비어 있으면 추가 제한이 없음을 의미합니다.
- `maxConcurrentSessions`: 동시에 활성화될 수 있는 ACP 세션의 최대 수입니다.
- `stream.coalesceIdleMs`: 스트리밍 텍스트의 유휴 플러시 시간 창(ms)입니다.
- `stream.maxChunkChars`: 스트리밍된 블록 투영을 분할하기 전 최대 청크 크기입니다.
- `stream.repeatSuppression`: 턴당 반복되는 상태/도구 줄을 억제합니다(기본값: `true`).
- `stream.deliveryMode`: `"live"`는 점진적으로 스트리밍하고, `"final_only"`는 턴 종료 이벤트까지 버퍼링합니다.
- `stream.hiddenBoundarySeparator`: 숨겨진 도구 이벤트 뒤 표시 텍스트 앞의 구분자입니다(기본값: `"paragraph"`).
- `stream.maxOutputChars`: ACP 턴당 투영되는 최대 어시스턴트 출력 문자 수입니다.
- `stream.maxSessionUpdateChars`: 투영된 ACP 상태/업데이트 줄의 최대 문자 수입니다.
- `stream.tagVisibility`: 스트리밍 이벤트에 대한 태그 이름별 불리언 표시 여부 재정의 레코드입니다.
- `runtime.ttlMinutes`: ACP 세션 워커가 정리 대상이 되기 전 유휴 TTL(분)입니다.
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
  - `"random"`(기본값): 순환하는 재미/계절 태그라인입니다.
  - `"default"`: 고정된 중립 태그라인(`All your chats, one OpenClaw.`)입니다.
  - `"off"`: 태그라인 텍스트 없음(배너 제목/버전은 계속 표시됨).
- 전체 배너를 숨기려면(태그라인만이 아니라) 환경 변수 `OPENCLAW_HIDE_BANNER=1`을 설정하세요.

---

## 마법사

CLI 안내 설정 흐름(`onboard`, `configure`, `doctor`)이 작성한 메타데이터:

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

## ID

[에이전트 기본값](/ko/gateway/config-agents#agent-defaults)의 `agents.list` ID 필드를 참조하세요.

---

## 브리지(레거시, 제거됨)

현재 빌드에는 더 이상 TCP 브리지가 포함되지 않습니다. Node는 Gateway WebSocket을 통해 연결됩니다. `bridge.*` 키는 더 이상 구성 스키마의 일부가 아닙니다(제거될 때까지 검증이 실패합니다. `openclaw doctor --fix`로 알 수 없는 키를 제거할 수 있습니다).

<Accordion title="레거시 브리지 구성(역사적 참조)">

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
    maxConcurrentRuns: 2, // cron dispatch + isolated cron agent-turn execution
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

- `sessionRetention`: 완료된 격리 cron 실행 세션을 `sessions.json`에서 정리하기 전에 보관하는 기간입니다. 보관된 삭제 cron transcript의 정리도 제어합니다. 기본값: `24h`; 비활성화하려면 `false`로 설정하세요.
- `runLog.maxBytes`: 정리 전 실행 로그 파일(`cron/runs/<jobId>.jsonl`)당 최대 크기입니다. 기본값: `2_000_000`바이트.
- `runLog.keepLines`: 실행 로그 정리가 트리거될 때 유지할 최신 줄 수입니다. 기본값: `2000`.
- `webhookToken`: cron Webhook POST 전달(`delivery.mode = "webhook"`)에 사용되는 bearer 토큰입니다. 생략하면 인증 헤더가 전송되지 않습니다.
- `webhook`: 아직 `notify: true`가 있는 저장된 작업에만 사용되는 더 이상 사용되지 않는 레거시 fallback Webhook URL(http/https)입니다.

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

- `maxAttempts`: 일시적 오류에서 일회성 작업의 최대 재시도 횟수입니다(기본값: `3`; 범위: `0`-`10`).
- `backoffMs`: 각 재시도 시도에 대한 ms 단위 backoff 지연 배열입니다(기본값: `[30000, 60000, 300000]`; 항목 1-10개).
- `retryOn`: 재시도를 트리거하는 오류 유형입니다 - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. 모든 일시적 유형을 재시도하려면 생략하세요.

일회성 cron 작업에만 적용됩니다. 반복 작업은 별도의 실패 처리를 사용합니다.

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      includeSkipped: false,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: cron 작업의 실패 알림을 활성화합니다(기본값: `false`).
- `after`: 알림이 발생하기 전의 연속 실패 횟수입니다(양의 정수, 최솟값: `1`).
- `cooldownMs`: 같은 작업에 대한 반복 알림 사이의 최소 밀리초입니다(음수가 아닌 정수).
- `includeSkipped`: 연속으로 건너뛴 실행을 알림 임계값에 포함합니다(기본값: `false`). 건너뛴 실행은 별도로 추적되며 실행 오류 backoff에는 영향을 주지 않습니다.
- `mode`: 전달 모드입니다 - `"announce"`는 채널 메시지를 통해 전송하고, `"webhook"`은 구성된 Webhook으로 게시합니다.
- `accountId`: 알림 전달 범위를 지정할 선택적 계정 또는 채널 id입니다.

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
- `mode`: `"announce"` 또는 `"webhook"`입니다. 충분한 대상 데이터가 있으면 기본값은 `"announce"`입니다.
- `channel`: announce 전달을 위한 채널 override입니다. `"last"`는 마지막으로 알려진 전달 채널을 재사용합니다.
- `to`: 명시적 announce 대상 또는 Webhook URL입니다. Webhook 모드에는 필수입니다.
- `accountId`: 전달을 위한 선택적 계정 override입니다.
- 작업별 `delivery.failureDestination`은 이 전역 기본값을 override합니다.
- 전역 및 작업별 실패 대상이 모두 설정되지 않은 경우, 이미 `announce`로 전달하는 작업은 실패 시 해당 기본 announce 대상으로 fallback합니다.
- `delivery.failureDestination`은 작업의 기본 `delivery.mode`가 `"webhook"`인 경우를 제외하고 `sessionTarget="isolated"` 작업에만 지원됩니다.

[Cron 작업](/ko/automation/cron-jobs)을 참조하세요. 격리된 cron 실행은 [백그라운드 작업](/ko/automation/tasks)으로 추적됩니다.

---

## 미디어 모델 템플릿 변수

`tools.media.models[].args`에서 확장되는 템플릿 placeholder입니다.

| 변수               | 설명                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | 전체 수신 메시지 본문                             |
| `{{RawBody}}`      | 원시 본문(히스토리/발신자 wrapper 없음)           |
| `{{BodyStripped}}` | 그룹 멘션이 제거된 본문                           |
| `{{From}}`         | 발신자 식별자                                     |
| `{{To}}`           | 대상 식별자                                       |
| `{{MessageSid}}`   | 채널 메시지 id                                    |
| `{{SessionId}}`    | 현재 세션 UUID                                    |
| `{{IsNewSession}}` | 새 세션이 생성된 경우 `"true"`                    |
| `{{MediaUrl}}`     | 수신 미디어 의사 URL                              |
| `{{MediaPath}}`    | 로컬 미디어 경로                                  |
| `{{MediaType}}`    | 미디어 유형(image/audio/document/…)               |
| `{{Transcript}}`   | 오디오 transcript                                 |
| `{{Prompt}}`       | CLI 항목에 대해 확인된 미디어 prompt              |
| `{{MaxChars}}`     | CLI 항목에 대해 확인된 최대 출력 문자 수          |
| `{{ChatType}}`     | `"direct"` 또는 `"group"`                         |
| `{{GroupSubject}}` | 그룹 주제(최선의 노력 기반)                       |
| `{{GroupMembers}}` | 그룹 구성원 미리 보기(최선의 노력 기반)           |
| `{{SenderName}}`   | 발신자 표시 이름(최선의 노력 기반)                |
| `{{SenderE164}}`   | 발신자 전화번호(최선의 노력 기반)                 |
| `{{Provider}}`     | Provider 힌트(whatsapp, telegram, discord 등)     |

---

## 구성 include(`$include`)

구성을 여러 파일로 나눕니다.

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
- 파일 배열: 순서대로 deep-merge됩니다(나중 항목이 앞 항목을 override).
- 형제 키: include 이후 병합됩니다(포함된 값을 override).
- 중첩 include: 최대 10단계 깊이까지 지원됩니다.
- 경로: 포함하는 파일을 기준으로 확인되지만, 최상위 구성 디렉터리(`openclaw.json`의 `dirname`) 안에 있어야 합니다. 절대 경로/`../` 형식은 여전히 해당 경계 안으로 확인되는 경우에만 허용됩니다.
- 단일 파일 include가 뒷받침하는 최상위 섹션 하나만 변경하는 OpenClaw 소유 쓰기는 해당 포함 파일에 직접 기록됩니다. 예를 들어 `plugins install`은 `plugins.json5`의 `plugins: { $include: "./plugins.json5" }`를 업데이트하고 `openclaw.json`은 그대로 둡니다.
- 루트 include, include 배열, 형제 override가 있는 include는 OpenClaw 소유 쓰기에 대해 읽기 전용입니다. 이러한 쓰기는 구성을 flatten하지 않고 fail closed됩니다.
- 오류: 누락된 파일, parse 오류, 순환 include에 대해 명확한 메시지를 제공합니다.

---

_관련: [구성](/ko/gateway/configuration) · [구성 예시](/ko/gateway/configuration-examples) · [Doctor](/ko/gateway/doctor)_

## 관련

- [구성](/ko/gateway/configuration)
- [구성 예시](/ko/gateway/configuration-examples)
